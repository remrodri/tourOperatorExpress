import { createHash } from "node:crypto";
import {
  BuildPredictiveDatasetOptions,
  PREDICTIVE_DATASET_AS_OF,
  PREDICTIVE_DATASET_HORIZONS,
  PREDICTIVE_DATASET_TIME_ZONE,
  PREDICTIVE_DATASET_VERSION,
  PREDICTIVE_DISCARD_REASONS,
  PREDICTIVE_INCLUDED_BOOKING_STATUSES,
  PREDICTIVE_SPLIT_RATIOS,
  PredictiveDataset,
  PredictiveDatasetDeparture,
  PredictiveDatasetPackage,
  PredictiveDatasetRecord,
  PredictiveDatasetSummary,
  PredictiveDiscardReason,
  PredictiveHorizon,
  PredictiveRhythmWindow,
  PredictiveSeason,
  PredictiveSplit,
} from "./PredictiveDatasetTypes";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const HIGH_SEASON_MONTHS = new Set([6, 7, 8, 12]);
const LOW_SEASON_MONTHS = new Set([1, 2, 3]);

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const stableStringify = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "null";
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`);

  return `{${entries.join(",")}}`;
};

const isValidDate = (value: Date | null | undefined): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const isPositiveInteger = (value: number | null | undefined): value is number =>
  Number.isInteger(value) && (value as number) > 0;

const normalizeTourists = (value: number): number =>
  Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MILLISECONDS_PER_DAY);

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const isIncludedStatus = (status: string): boolean =>
  PREDICTIVE_INCLUDED_BOOKING_STATUSES.includes(
    status as (typeof PREDICTIVE_INCLUDED_BOOKING_STATUSES)[number],
  );

const getIsoWeek = (date: Date): number => {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);

  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);

  return (
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) /
        (7 * MILLISECONDS_PER_DAY),
    )
  );
};

const getSeason = (month: number): PredictiveSeason => {
  if (HIGH_SEASON_MONTHS.has(month)) {
    return "high";
  }
  if (LOW_SEASON_MONTHS.has(month)) {
    return "low";
  }
  return "mid";
};

const createEmptyDiscardCounts = (): Record<PredictiveDiscardReason, number> =>
  Object.fromEntries(
    PREDICTIVE_DISCARD_REASONS.map((reason) => [reason, 0]),
  ) as Record<PredictiveDiscardReason, number>;

const createHorizonSummary = (candidates: number) => ({
  candidates,
  included: 0,
  discarded: createEmptyDiscardCounts(),
  labelTourists: 0,
  rowsWithoutPriorBookings: 0,
});

const createHorizonSummaries = (
  candidates: number,
): PredictiveDatasetSummary["horizons"] =>
  Object.fromEntries(
    PREDICTIVE_DATASET_HORIZONS.map((horizon) => [
      String(horizon),
      createHorizonSummary(candidates),
    ]),
  ) as PredictiveDatasetSummary["horizons"];

const createSplitSummary = () => ({
  departures: 0,
  rows: 0,
  firstDepartureStart: null as string | null,
  lastDepartureStart: null as string | null,
  labelTourists: 0,
});

const createSplitSummaries = (): PredictiveDatasetSummary["splits"] => ({
  train: createSplitSummary(),
  validation: createSplitSummary(),
  test: createSplitSummary(),
});

interface NormalizedBooking {
  status: string;
  tourists: number;
  createdAt: Date | null;
}

interface EligibleDeparture {
  departure: PredictiveDatasetDeparture;
  startDate: Date;
  endDate: Date;
  capacity: number;
  tourPackageId: string;
  tourPackage: PredictiveDatasetPackage;
  labelFinalTourists: number;
}

interface HistoricalBooking {
  createdAt: Date;
  tourists: number;
}

interface HistoricalDeparture {
  endDate: Date;
  capacity: number;
  includedBookings: HistoricalBooking[];
}

const getDiscardReason = (
  departure: PredictiveDatasetDeparture,
  packages: Map<string, PredictiveDatasetPackage>,
  asOf: Date,
): PredictiveDiscardReason | null => {
  if (departure.dataOrigin !== "simulated") {
    return "non-simulated-origin";
  }

  if (!isValidDate(departure.startDate) || !isValidDate(departure.endDate)) {
    return "missing-dates";
  }

  if (!isPositiveInteger(departure.capacity)) {
    return "invalid-capacity";
  }

  if (
    !departure.tourPackageId ||
    !packages.has(departure.tourPackageId)
  ) {
    return "missing-package";
  }

  if (departure.endDate.getTime() >= asOf.getTime()) {
    return "outcome-unavailable";
  }

  return null;
};

const buildRhythmWindow = (
  bookings: NormalizedBooking[],
  cutoffAt: Date,
  windowDays: number,
): PredictiveRhythmWindow => {
  const windowStart = addDays(cutoffAt, -windowDays);
  const windowBookings = bookings.filter(
    (booking) =>
      booking.createdAt !== null &&
      booking.createdAt.getTime() >= windowStart.getTime(),
  );
  const tourists = windowBookings.reduce(
    (sum, booking) => sum + booking.tourists,
    0,
  );

  return {
    windowDays,
    bookings: windowBookings.length,
    tourists,
    bookingsPerDay: round(windowBookings.length / windowDays, 4),
    touristsPerDay: round(tourists / windowDays, 4),
  };
};

const assignSplits = (
  departures: EligibleDeparture[],
): Map<string, PredictiveSplit> => {
  const groups = new Map<string, string[]>();

  for (const departure of departures) {
    const dateKey = toDateOnly(departure.startDate);
    const ids = groups.get(dateKey) ?? [];
    ids.push(departure.departure.id);
    groups.set(dateKey, ids);
  }

  const sortedGroups = [...groups.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const total = departures.length;
  const trainTarget =
    total >= 3
      ? Math.max(1, Math.floor(total * PREDICTIVE_SPLIT_RATIOS.train))
      : total;
  const validationTarget =
    total >= 3
      ? Math.max(1, Math.floor(total * PREDICTIVE_SPLIT_RATIOS.validation))
      : 0;

  let cumulative = 0;
  let trainDone = false;
  let validationDone = validationTarget === 0;
  const splitById = new Map<string, PredictiveSplit>();

  for (const [, ids] of sortedGroups) {
    const split: PredictiveSplit = !trainDone
      ? "train"
      : !validationDone
        ? "validation"
        : "test";

    for (const id of ids) {
      splitById.set(id, split);
    }

    cumulative += ids.length;

    if (!trainDone && cumulative >= trainTarget) {
      trainDone = true;
    }

    if (
      trainDone &&
      !validationDone &&
      cumulative >= trainTarget + validationTarget
    ) {
      validationDone = true;
    }
  }

  return splitById;
};

const getHistoricalPackage = (
  historicalByPackage: Map<string, HistoricalDeparture[]>,
  packageId: string,
  cutoffAt: Date,
) => {
  const priorDepartures = (historicalByPackage.get(packageId) ?? []).filter(
    (departure) => departure.endDate.getTime() < cutoffAt.getTime(),
  );

  if (priorDepartures.length === 0) {
    return {
      completedDepartures: 0,
      averageFinalOccupancy: null,
    };
  }

  const averageFinalOccupancy =
    priorDepartures.reduce((sum, departure) => {
      const knownTourists = departure.includedBookings
        .filter(
          (booking) => booking.createdAt.getTime() < cutoffAt.getTime(),
        )
        .reduce((tourists, booking) => tourists + booking.tourists, 0);

      return sum + knownTourists / departure.capacity;
    }, 0) / priorDepartures.length;

  return {
    completedDepartures: priorDepartures.length,
    averageFinalOccupancy: round(averageFinalOccupancy, 4),
  };
};

export const buildPredictiveDataset = (
  options: BuildPredictiveDatasetOptions,
): PredictiveDataset => {
  const asOf = options.asOf ?? new Date(PREDICTIVE_DATASET_AS_OF);
  const generatedAt = options.generatedAt ?? new Date();

  if (!isValidDate(asOf)) {
    throw new Error("asOf debe ser una fecha válida");
  }

  if (!isValidDate(generatedAt)) {
    throw new Error("generatedAt debe ser una fecha válida");
  }

  const packages = new Map(
    options.packages.map((tourPackage) => [tourPackage.id, tourPackage]),
  );
  const bookingByDeparture = new Map<string, NormalizedBooking[]>();
  const labelByDeparture = new Map<string, number>();

  for (const booking of options.bookings) {
    const normalized: NormalizedBooking = {
      status: booking.status,
      tourists: normalizeTourists(booking.tourists),
      createdAt: isValidDate(booking.createdAt) ? booking.createdAt : null,
    };
    const bookings = bookingByDeparture.get(booking.departureId) ?? [];
    bookings.push(normalized);
    bookingByDeparture.set(booking.departureId, bookings);

    if (isIncludedStatus(normalized.status)) {
      labelByDeparture.set(
        booking.departureId,
        (labelByDeparture.get(booking.departureId) ?? 0) + normalized.tourists,
      );
    }
  }

  const historicalByPackage = new Map<string, HistoricalDeparture[]>();

  for (const departure of options.departures) {
    if (
      departure.dataOrigin !== "simulated" ||
      !isValidDate(departure.startDate) ||
      !isValidDate(departure.endDate) ||
      !isPositiveInteger(departure.capacity) ||
      !departure.tourPackageId
    ) {
      continue;
    }

    const historical = historicalByPackage.get(departure.tourPackageId) ?? [];
    const includedBookings = (bookingByDeparture.get(departure.id) ?? [])
      .filter(
        (
          booking,
        ): booking is NormalizedBooking & { createdAt: Date } =>
          booking.createdAt !== null && isIncludedStatus(booking.status),
      )
      .map((booking) => ({
        createdAt: booking.createdAt,
        tourists: booking.tourists,
      }));

    historical.push({
      endDate: departure.endDate,
      capacity: departure.capacity,
      includedBookings,
    });
    historicalByPackage.set(departure.tourPackageId, historical);
  }

  const departureDiscarded = createEmptyDiscardCounts();
  const horizonSummaries = createHorizonSummaries(options.departures.length);
  const eligible: EligibleDeparture[] = [];
  let includedDepartures = 0;

  for (const departure of options.departures) {
    const reason = getDiscardReason(departure, packages, asOf);

    if (reason !== null) {
      departureDiscarded[reason] += 1;
      for (const horizon of PREDICTIVE_DATASET_HORIZONS) {
        horizonSummaries[String(horizon) as `${PredictiveHorizon}`].discarded[
          reason
        ] += 1;
      }
      continue;
    }

    includedDepartures += 1;
    eligible.push({
      departure,
      startDate: departure.startDate as Date,
      endDate: departure.endDate as Date,
      capacity: departure.capacity as number,
      tourPackageId: departure.tourPackageId as string,
      tourPackage: packages.get(departure.tourPackageId as string) as PredictiveDatasetPackage,
      labelFinalTourists: labelByDeparture.get(departure.id) ?? 0,
    });
  }

  const splitById = assignSplits(eligible);
  const records: PredictiveDatasetRecord[] = [];

  for (const eligibleDeparture of eligible) {
    const split = splitById.get(eligibleDeparture.departure.id) ?? "train";
    const departureBookings =
      bookingByDeparture.get(eligibleDeparture.departure.id) ?? [];

    for (const horizon of PREDICTIVE_DATASET_HORIZONS) {
      const cutoffAt = addDays(eligibleDeparture.startDate, -horizon);
      const horizonSummary =
        horizonSummaries[String(horizon) as `${PredictiveHorizon}`];

      if (
        !isValidDate(cutoffAt) ||
        cutoffAt.getTime() >= eligibleDeparture.startDate.getTime()
      ) {
        horizonSummary.discarded["invalid-cutoff"] += 1;
        continue;
      }

      const priorBookings = departureBookings
        .filter(
          (booking): booking is NormalizedBooking & { createdAt: Date } =>
            booking.createdAt !== null &&
            booking.createdAt.getTime() < cutoffAt.getTime() &&
            isIncludedStatus(booking.status),
        );

      const confirmedBookings = priorBookings.length;
      const confirmedTourists = priorBookings.reduce(
        (sum, booking) => sum + booking.tourists,
        0,
      );
      const firstBookingAt = priorBookings.reduce<Date | null>(
        (earliest, booking) =>
          earliest === null || booking.createdAt.getTime() < earliest.getTime()
            ? booking.createdAt
            : earliest,
        null,
      );
      const month = eligibleDeparture.startDate.getUTCMonth() + 1;
      const cutoffDate = toDateOnly(cutoffAt);
      const recordWithoutHash = {
        datasetVersion: PREDICTIVE_DATASET_VERSION,
        key: `${eligibleDeparture.departure.id}:${horizon}`,
        departureId: eligibleDeparture.departure.id,
        cutoffDate,
        cutoffAt: cutoffAt.toISOString(),
        horizonDays: horizon,
        split,
        dataOrigin: "simulated" as const,
        labelFinalTourists: eligibleDeparture.labelFinalTourists,
        features: {
          confirmedTourists,
          confirmedBookings,
          averageGroupSize:
            confirmedBookings > 0
              ? round(confirmedTourists / confirmedBookings, 4)
              : null,
          rhythm: {
            last7Days: buildRhythmWindow(priorBookings, cutoffAt, 7),
            last14Days: buildRhythmWindow(priorBookings, cutoffAt, 14),
          },
          salesAgeDays:
            firstBookingAt === null
              ? null
              : Math.floor(
                  (cutoffAt.getTime() - firstBookingAt.getTime()) /
                    MILLISECONDS_PER_DAY,
                ),
          daysUntilDeparture: Math.round(
            (eligibleDeparture.startDate.getTime() - cutoffAt.getTime()) /
              MILLISECONDS_PER_DAY,
          ),
          departureMonth: month,
          departureIsoWeek: getIsoWeek(eligibleDeparture.startDate),
          departureDayOfWeek: eligibleDeparture.startDate.getUTCDay(),
          season: getSeason(month),
          tourPackageId: eligibleDeparture.tourPackageId,
          destinationId: eligibleDeparture.tourPackage.destinationId,
          tourTypeId: eligibleDeparture.tourPackage.tourTypeId,
          durationDays: eligibleDeparture.tourPackage.durationDays,
          packagePrice: eligibleDeparture.tourPackage.price,
          capacity: eligibleDeparture.capacity,
          historicalPackage: getHistoricalPackage(
            historicalByPackage,
            eligibleDeparture.tourPackageId,
            cutoffAt,
          ),
        },
      };

      const record: PredictiveDatasetRecord = {
        ...recordWithoutHash,
        recordHash: sha256Hex(stableStringify(recordWithoutHash)),
      };

      records.push(record);
      horizonSummary.included += 1;
      horizonSummary.labelTourists += record.labelFinalTourists;
      if (record.features.confirmedBookings === 0) {
        horizonSummary.rowsWithoutPriorBookings += 1;
      }
    }
  }

  records.sort(
    (left, right) =>
      left.departureId.localeCompare(right.departureId) ||
      right.horizonDays - left.horizonDays,
  );

  const splitSummaries = createSplitSummaries();
  const splitIds: Record<PredictiveSplit, Set<string>> = {
    train: new Set<string>(),
    validation: new Set<string>(),
    test: new Set<string>(),
  };
  const startById = new Map(
    eligible.map((departure) => [
      departure.departure.id,
      departure.startDate.toISOString(),
    ]),
  );

  for (const record of records) {
    splitSummaries[record.split].rows += 1;
    splitSummaries[record.split].labelTourists += record.labelFinalTourists;
    splitIds[record.split].add(record.departureId);
  }

  for (const split of Object.keys(splitSummaries) as PredictiveSplit[]) {
    const starts = [...splitIds[split]]
      .map((id) => startById.get(id))
      .filter((start): start is string => start !== undefined)
      .sort();
    splitSummaries[split].departures = splitIds[split].size;
    splitSummaries[split].firstDepartureStart = starts[0] ?? null;
    splitSummaries[split].lastDepartureStart =
      starts[starts.length - 1] ?? null;
  }

  const simulatedDepartures = options.departures.filter(
    (departure) => departure.dataOrigin === "simulated",
  );
  const source = {
    simulationVersions: [
      ...new Set(
        simulatedDepartures
          .map((departure) => departure.simulationVersion)
          .filter(
            (version): version is string =>
              typeof version === "string" && version.trim().length > 0,
          ),
      ),
    ].sort(),
    simulationSeeds: [
      ...new Set(
        simulatedDepartures
          .map((departure) => departure.simulationSeed)
          .filter((seed): seed is number => Number.isInteger(seed)),
      ),
    ].sort((left, right) => left - right),
    simulationIds: [
      ...new Set(
        simulatedDepartures
          .map((departure) => departure.simulationId)
          .filter(
            (id): id is string => typeof id === "string" && id.trim().length > 0,
          ),
      ),
    ].sort(),
  };

  const hashPayload = {
    datasetVersion: PREDICTIVE_DATASET_VERSION,
    asOf: asOf.toISOString(),
    horizons: [...PREDICTIVE_DATASET_HORIZONS],
    splitRatios: PREDICTIVE_SPLIT_RATIOS,
    records: [...records]
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((record) => ({ key: record.key, recordHash: record.recordHash })),
  };

  return {
    datasetVersion: PREDICTIVE_DATASET_VERSION,
    generatedAt: generatedAt.toISOString(),
    asOf: asOf.toISOString(),
    timeZone: PREDICTIVE_DATASET_TIME_ZONE,
    dataOrigin: "simulated",
    horizons: [...PREDICTIVE_DATASET_HORIZONS],
    splitRatios: PREDICTIVE_SPLIT_RATIOS,
    source,
    summary: {
      departures: {
        candidates: options.departures.length,
        included: includedDepartures,
        discarded: departureDiscarded,
      },
      horizons: horizonSummaries,
      splits: splitSummaries,
      rows: records.length,
    },
    records,
    datasetHash: sha256Hex(stableStringify(hashPayload)),
    warnings: [
      "Datos ficticios: el dataset se construye sobre registros simulados y no representa observaciones reales de una empresa.",
      "El dataset solo admite dataOrigin=simulated; los registros legacy o manual se excluyen y se contabilizan como non-simulated-origin.",
      "No se entrenan modelos ni se calculan métricas de error en T-812.",
      "Las salidas sin reservas previas al corte conservan demanda cero y no se descartan.",
      "Los eventos externos no se incluyen porque no existe una fuente reproducible disponible al corte.",
    ],
  };
};
