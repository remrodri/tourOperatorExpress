import { resolveDateRangeBounds } from "../../modules/dateRange/domain/dateRangeNormalization";
import {
  SimulationCollectionName,
  SimulationConfig,
  SimulationPackageProfile,
} from "./simulationConfig";
import {
  RandomSource,
  createRandom,
  sha256Hex,
  stableObjectId,
  stableStringify,
} from "./simulationRandom";
import { buildRealisticTouristIdentity } from "./touristIdentityProfile";
import { buildRealisticPackageName } from "./visibleSimulationLabels";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const SEASONAL_FACTORS = [
  0.6, 0.3, -0.2, -0.5, -0.7, 0.2, 0.8, 0.6, -0.1, -0.4, -0.3, 0.9,
];

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type SimulationDataOrigin = "simulated";

export interface SimulationReferenceData {
  destinations: { id: string; name: string }[];
  tourTypes: { id: string; name: string }[];
  sellers: { id: string }[];
  guides: { id: string }[];
}

export interface SimulationDateRangeDoc {
  _id: string;
  dates: string[];
  startDate: string;
  endDate: string;
  capacity: number;
  dataOrigin: SimulationDataOrigin;
  simulationId: string;
  simulationVersion: string;
  simulationSeed: number;
  simulationKey: string;
  state: "pending" | "completed" | "cancelled";
  guides: string[];
  tourPackageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationTourPackageDoc {
  _id: string;
  name: string;
  tourType: string;
  touristDestination: string;
  duration: number;
  dateRanges: string[];
  price: number;
  itinerary: {
    days: {
      dayNumber: number;
      activities: { description: string; time: string }[];
    }[];
  };
  status: "active" | "inactive";
  deleted: boolean;
  dataOrigin: SimulationDataOrigin;
  simulationId: string;
  simulationVersion: string;
  simulationSeed: number;
  simulationKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationTouristDoc {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationality: string;
  documentType: string;
  ci: string;
  passportNumber: string;
  dateOfBirth: string;
  bookingIds: string[];
  dataOrigin: SimulationDataOrigin;
  simulationId: string;
  simulationVersion: string;
  simulationSeed: number;
  simulationKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationBookingDoc {
  _id: string;
  touristsIds: string[];
  dateRangeId: string;
  notes: string;
  paymentIds: string[];
  sellerId: string;
  status: BookingStatus;
  totalPrice: number;
  tourPackageId: string;
  paymentProofFolder: string;
  attendance: { touristId: string; status: "present" | "absent" }[];
  cancellationFee: number;
  refundAmount: number;
  refundedAt: string | null;
  bookingCode: string;
  dataOrigin: SimulationDataOrigin;
  simulationId: string;
  simulationVersion: string;
  simulationSeed: number;
  simulationKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationPaymentDoc {
  _id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  bookingId: string;
  paymentProofImage: string;
  sellerId: string;
  touristId: string;
  dataOrigin: SimulationDataOrigin;
  simulationId: string;
  simulationVersion: string;
  simulationSeed: number;
  simulationKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationSummary {
  collections: Record<SimulationCollectionName, number>;
  bookingsByStatus: Record<BookingStatus, number>;
  paymentsByMethod: Record<string, number>;
  departures: number;
  departuresWithBookings: number;
  departuresWithoutBookings: number;
  occupancy: {
    min: number;
    median: number;
    max: number;
    average: number;
  };
  distinctDestinations: number;
  distinctTourTypes: number;
  distinctDepartureMonths: string[];
  firstDeparture: string | null;
  lastDeparture: string | null;
  firstPaymentDate: string | null;
  lastPaymentDate: string | null;
}

export interface SimulationDataset {
  simulationId: string;
  config: SimulationConfig;
  referenceData: SimulationReferenceData;
  collections: {
    Date_Ranges: SimulationDateRangeDoc[];
    Tour_Packages: SimulationTourPackageDoc[];
    Tourists: SimulationTouristDoc[];
    Bookings: SimulationBookingDoc[];
    Payments: SimulationPaymentDoc[];
  };
  summary: SimulationSummary;
  datasetHash: string;
  warnings: string[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const parseSimulationDate = (value: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Fecha inválida: ${value}`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Fecha inválida: ${value}`);
  }

  return date;
};

export const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MILLISECONDS_PER_DAY);

export const minDate = (...dates: Date[]): Date =>
  new Date(Math.min(...dates.map((date) => date.getTime())));

export const maxDate = (...dates: Date[]): Date =>
  new Date(Math.max(...dates.map((date) => date.getTime())));

const assertConfigDate = (label: string, value: string): Date => {
  try {
    return parseSimulationDate(value);
  } catch {
    throw new Error(`${label} debe usar el formato YYYY-MM-DD y ser una fecha real`);
  }
};

export const validateSimulationConfig = (config: SimulationConfig): void => {
  if (!config.version || config.version.trim().length === 0) {
    throw new Error("La versión de la simulación es obligatoria");
  }

  if (!Number.isInteger(config.seed)) {
    throw new Error("La semilla debe ser un entero");
  }

  const periodStart = assertConfigDate("periodStart", config.periodStart);
  const periodEnd = assertConfigDate("periodEnd", config.periodEnd);
  const asOf = assertConfigDate("asOf", config.asOf);

  if (periodStart.getTime() > periodEnd.getTime()) {
    throw new Error("periodStart no puede ser posterior a periodEnd");
  }

  if (asOf.getTime() < periodStart.getTime()) {
    throw new Error("asOf no puede ser anterior a periodStart");
  }

  if (
    !Number.isInteger(config.departureIntervalDays) ||
    config.departureIntervalDays <= 0
  ) {
    throw new Error("departureIntervalDays debe ser un entero positivo");
  }

  if (config.packageProfiles.length === 0) {
    throw new Error("Se requiere al menos un perfil de paquete");
  }

  const codes = new Set<string>();
  for (const profile of config.packageProfiles) {
    if (!profile.code || profile.code.trim().length === 0) {
      throw new Error("Cada perfil de paquete requiere un código");
    }
    if (codes.has(profile.code)) {
      throw new Error(`Código de paquete duplicado: ${profile.code}`);
    }
    codes.add(profile.code);

    if (!Number.isInteger(profile.durationDays) || profile.durationDays < 1) {
      throw new Error(`Duración inválida para ${profile.code}`);
    }
    if (!Number.isFinite(profile.price) || profile.price <= 0) {
      throw new Error(`Precio inválido para ${profile.code}`);
    }
    if (!Number.isFinite(profile.popularity) || profile.popularity <= 0) {
      throw new Error(`Popularidad inválida para ${profile.code}`);
    }
    if (!Number.isInteger(profile.capacityBias)) {
      throw new Error(`capacityBias inválido para ${profile.code}`);
    }
  }

  if (
    !Number.isInteger(config.capacity.min) ||
    !Number.isInteger(config.capacity.max) ||
    config.capacity.min <= 0 ||
    config.capacity.max < config.capacity.min
  ) {
    throw new Error("La capacidad mínima y máxima deben ser enteros positivos coherentes");
  }

  const demandRates = [
    config.demand.baseOccupancy,
    config.demand.seasonalityAmplitude,
    config.demand.weekendBoost,
    config.demand.noiseAmplitude,
    config.demand.noDemandRate,
    config.demand.highOccupancyRate,
  ];

  if (demandRates.some((rate) => !Number.isFinite(rate) || rate < 0)) {
    throw new Error("Los parámetros de demanda deben ser números no negativos");
  }

  if (
    config.demand.baseOccupancy > 1 ||
    config.demand.noDemandRate > 1 ||
    config.demand.highOccupancyRate > 1
  ) {
    throw new Error("Las tasas de demanda deben estar entre 0 y 1");
  }

  if (
    !Number.isInteger(config.booking.minGroupSize) ||
    !Number.isInteger(config.booking.maxGroupSize) ||
    config.booking.minGroupSize < 1 ||
    config.booking.maxGroupSize < config.booking.minGroupSize
  ) {
    throw new Error("El tamaño de grupo mínimo y máximo debe ser coherente");
  }

  if (
    !Number.isInteger(config.booking.minAnticipationDays) ||
    !Number.isInteger(config.booking.maxAnticipationDays) ||
    config.booking.minAnticipationDays < 0 ||
    config.booking.maxAnticipationDays < config.booking.minAnticipationDays
  ) {
    throw new Error("La anticipación mínima y máxima debe ser coherente");
  }

  const bookingRates = [
    config.booking.cancelledRatePast,
    config.booking.pendingRateFuture,
    config.booking.confirmedRateFuture,
  ];

  if (bookingRates.some((rate) => !Number.isFinite(rate) || rate < 0 || rate > 1)) {
    throw new Error("Las probabilidades de estado deben estar entre 0 y 1");
  }

  if (
    config.booking.pendingRateFuture + config.booking.confirmedRateFuture > 1
  ) {
    throw new Error("Las probabilidades de estados futuros no pueden superar 1");
  }

  if (config.payment.methods.length === 0) {
    throw new Error("Se requiere al menos un método de pago");
  }

  if (
    !Number.isInteger(config.payment.maxInstallments) ||
    config.payment.maxInstallments < 1
  ) {
    throw new Error("maxInstallments debe ser un entero positivo");
  }

  if (
    !Number.isFinite(config.payment.minFirstRatio) ||
    !Number.isFinite(config.payment.maxFirstRatio) ||
    config.payment.minFirstRatio < 0 ||
    config.payment.maxFirstRatio > 1 ||
    config.payment.minFirstRatio > config.payment.maxFirstRatio
  ) {
    throw new Error("Los ratios de pago deben ser coherentes y estar entre 0 y 1");
  }

  if (
    config.allowOverCapacityForTesting === true &&
    config.scenario !== "test-over-capacity"
  ) {
    throw new Error(
      "allowOverCapacityForTesting solo se permite con scenario test-over-capacity"
    );
  }
};

const assertReferenceData = (
  config: SimulationConfig,
  referenceData: SimulationReferenceData
): void => {
  if (referenceData.destinations.length === 0) {
    throw new Error("No existen destinos turísticos para la simulación");
  }
  if (referenceData.tourTypes.length === 0) {
    throw new Error("No existen tipos de tour para la simulación");
  }
  if (referenceData.sellers.length === 0) {
    throw new Error("No existen vendedores para asignar a las reservas simuladas");
  }

  const destinationNames = new Set(
    referenceData.destinations.map((destination) => destination.name)
  );
  const tourTypeNames = new Set(
    referenceData.tourTypes.map((tourType) => tourType.name)
  );

  for (const profile of config.packageProfiles) {
    if (!destinationNames.has(profile.destinationName)) {
      throw new Error(
        `El destino ${profile.destinationName} no existe para el paquete ${profile.code}`
      );
    }
    if (!tourTypeNames.has(profile.tourTypeName)) {
      throw new Error(
        `El tipo de tour ${profile.tourTypeName} no existe para el paquete ${profile.code}`
      );
    }
  }
};

const pickGuides = (
  random: RandomSource,
  guides: { id: string }[]
): string[] => {
  if (guides.length === 0) {
    return [];
  }

  const count = Math.min(guides.length, random.int(1, 2));
  return [...guides]
    .map((guide) => ({ id: guide.id, rank: random.next() }))
    .sort((left, right) => left.rank - right.rank || left.id.localeCompare(right.id))
    .slice(0, count)
    .map((entry) => entry.id);
};

const computeMedian = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

interface PackageBuildContext {
  config: SimulationConfig;
  simulationId: string;
  profile: SimulationPackageProfile;
  packageId: string;
  destinationId: string;
  tourTypeId: string;
  sellers: { id: string }[];
  guides: { id: string }[];
  periodStart: Date;
  periodEnd: Date;
  asOf: Date;
  dateRanges: SimulationDateRangeDoc[];
  tourists: SimulationTouristDoc[];
  bookings: SimulationBookingDoc[];
  payments: SimulationPaymentDoc[];
}

const buildPackage = (
  context: PackageBuildContext,
  packageIndex: number
): { dateRangeIds: string[] } => {
  const {
    config,
    simulationId,
    profile,
    packageId,
    destinationId,
    tourTypeId,
    sellers,
    guides,
    periodStart,
    periodEnd,
    asOf,
    dateRanges,
    tourists,
    bookings,
    payments,
  } = context;

  const packageKey = `tourPackage:${profile.code}`;
  const packageCreatedAt = addDays(periodStart, -60);
  const packageUpdatedAt = addDays(periodStart, -30);
  const dateRangeIds: string[] = [];
  const firstDeparture = addDays(periodStart, packageIndex * 2);

  for (
    let departureStart = firstDeparture;
    departureStart.getTime() <= periodEnd.getTime();
    departureStart = addDays(departureStart, config.departureIntervalDays)
  ) {
    const departureEnd = addDays(departureStart, profile.durationDays - 1);
    const departureKey = `dateRange:${profile.code}:${toDateOnly(departureStart)}`;
    const departureId = stableObjectId(simulationId, departureKey);
    const departureRandom = createRandom(`${simulationId}|${departureKey}`);
    const departureIsPast = departureEnd.getTime() < asOf.getTime();

    const capacity = clamp(
      config.capacity.min +
        profile.capacityBias +
        departureRandom.int(-2, 2),
      config.capacity.min,
      config.capacity.max
    );

    const month = departureStart.getUTCMonth();
    const dayOfWeek = departureStart.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const seasonalFactor = SEASONAL_FACTORS[month];
    const noise =
      (departureRandom.next() * 2 - 1) * config.demand.noiseAmplitude;

    let occupancy =
      config.demand.baseOccupancy *
        profile.popularity *
        (1 + config.demand.seasonalityAmplitude * seasonalFactor) *
        (isWeekend ? 1 + config.demand.weekendBoost : 1) +
      noise;

    if (departureRandom.chance(config.demand.noDemandRate)) {
      occupancy = 0;
    } else if (departureRandom.chance(config.demand.highOccupancyRate)) {
      occupancy = 0.92 + departureRandom.next() * 0.08;
    }

    occupancy = clamp(occupancy, 0, 1);
    const targetTourists = Math.round(capacity * occupancy);

    const bounds = resolveDateRangeBounds({
      startDate: departureStart,
      endDate: departureEnd,
    });

    const dateRangeCreatedAt = minDate(addDays(departureStart, -90), asOf);
    const dateRangeUpdatedAt = minDate(addDays(departureStart, -60), asOf);

    dateRanges.push({
      _id: departureId,
      dates: bounds.dates,
      startDate: bounds.startDate.toISOString(),
      endDate: bounds.endDate.toISOString(),
      capacity,
      dataOrigin: "simulated",
      simulationId,
      simulationVersion: config.version,
      simulationSeed: config.seed,
      simulationKey: departureKey,
      state: departureIsPast ? "completed" : "pending",
      guides: pickGuides(departureRandom, guides),
      tourPackageId: packageId,
      createdAt: dateRangeCreatedAt.toISOString(),
      updatedAt: dateRangeUpdatedAt.toISOString(),
    });
    dateRangeIds.push(departureId);

    let remainingTourists = targetTourists;
    let bookingIndex = 0;

    while (remainingTourists > 0) {
      const maxGroupSize = Math.min(
        config.booking.maxGroupSize,
        remainingTourists
      );
      let groupSize = Math.min(
        maxGroupSize,
        Math.max(
          1,
          departureRandom.int(
            config.booking.minGroupSize,
            config.booking.maxGroupSize
          )
        )
      );

      if (
        remainingTourists - groupSize > 0 &&
        remainingTourists - groupSize < config.booking.minGroupSize
      ) {
        groupSize = remainingTourists;
      }

      const bookingKey = `booking:${profile.code}:${toDateOnly(
        departureStart
      )}:${bookingIndex}`;
      const bookingId = stableObjectId(simulationId, bookingKey);
      const bookingRandom = createRandom(`${simulationId}|${bookingKey}`);

      const isPast = departureIsPast;
      const latestBooking = isPast
        ? addDays(departureStart, -1)
        : minDate(addDays(asOf, -1), addDays(departureStart, -1));

      let createdAt = addDays(
        departureStart,
        -bookingRandom.int(
          config.booking.minAnticipationDays,
          config.booking.maxAnticipationDays
        )
      );

      if (createdAt.getTime() > latestBooking.getTime()) {
        createdAt = latestBooking;
      }
      if (createdAt.getTime() >= departureStart.getTime()) {
        createdAt = addDays(departureStart, -1);
      }

      let status: BookingStatus;
      if (isPast) {
        status =
          bookingRandom.next() < config.booking.cancelledRatePast
            ? "cancelled"
            : "completed";
      } else {
        const statusRoll = bookingRandom.next();
        if (statusRoll < config.booking.pendingRateFuture) {
          status = "pending";
        } else if (
          statusRoll <
          config.booking.pendingRateFuture + config.booking.confirmedRateFuture
        ) {
          status = "confirmed";
        } else {
          status = "cancelled";
        }
      }

      const seller = sellers[bookingRandom.int(0, sellers.length - 1)];
      const totalPrice = profile.price * groupSize;
      const bookingTourists: SimulationTouristDoc[] = [];

      for (let touristIndex = 0; touristIndex < groupSize; touristIndex++) {
        const touristKey = `tourist:${profile.code}:${toDateOnly(
          departureStart
        )}:${bookingIndex}:${touristIndex}`;
        const touristId = stableObjectId(simulationId, touristKey);
        const identity = buildRealisticTouristIdentity(touristId);
        const touristDoc: SimulationTouristDoc = {
          _id: touristId,
          ...identity,
          bookingIds: [bookingId],
          dataOrigin: "simulated",
          simulationId,
          simulationVersion: config.version,
          simulationSeed: config.seed,
          simulationKey: touristKey,
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        };

        tourists.push(touristDoc);
        bookingTourists.push(touristDoc);
      }

      const paymentRandom = createRandom(`${simulationId}|payment:${bookingKey}`);
      const paymentDocs: SimulationPaymentDoc[] = [];
      const allowTwoInstallments = config.payment.maxInstallments >= 2;
      let paymentRatios: number[] = [];

      if (status === "cancelled") {
        if (paymentRandom.chance(0.55)) {
          paymentRatios = [0.2 + paymentRandom.next() * 0.4];
        }
      } else if (status === "pending") {
        if (paymentRandom.chance(0.5)) {
          paymentRatios = [0.2 + paymentRandom.next() * 0.3];
        }
      } else if (status === "confirmed") {
        if (allowTwoInstallments && paymentRandom.chance(0.35)) {
          const firstRatio = 0.3 + paymentRandom.next() * 0.3;
          const secondRatio = Math.min(
            1 - firstRatio,
            0.2 + paymentRandom.next() * 0.4
          );
          paymentRatios = [firstRatio, secondRatio];
        } else {
          paymentRatios = [0.4 + paymentRandom.next() * 0.6];
        }
      } else if (allowTwoInstallments && paymentRandom.chance(0.35)) {
        const firstRatio = 0.4 + paymentRandom.next() * 0.2;
        paymentRatios = [firstRatio, 1 - firstRatio];
      } else if (paymentRandom.chance(0.7)) {
        paymentRatios = [1];
      } else {
        paymentRatios = [0.5 + paymentRandom.next() * 0.4];
      }

      const latestPayment = minDate(asOf, addDays(departureStart, -1));
      let previousPaymentDate = createdAt;
      let alreadyPaid = 0;

      paymentRatios.forEach((ratio, paymentIndex) => {
        let amount = Math.round(totalPrice * ratio);
        const remainingAmount = totalPrice - alreadyPaid;
        if (amount > remainingAmount) {
          amount = remainingAmount;
        }
        if (amount <= 0) {
          return;
        }
        alreadyPaid += amount;

        let paymentDate =
          paymentIndex === 0
            ? addDays(createdAt, paymentRandom.int(0, 5))
            : addDays(previousPaymentDate, paymentRandom.int(3, 15));

        if (paymentDate.getTime() > latestPayment.getTime()) {
          paymentDate = latestPayment;
        }
        if (paymentDate.getTime() < createdAt.getTime()) {
          paymentDate = createdAt;
        }
        if (paymentDate.getTime() < previousPaymentDate.getTime()) {
          paymentDate = previousPaymentDate;
        }

        const paymentKey = `payment:${profile.code}:${toDateOnly(
          departureStart
        )}:${bookingIndex}:${paymentIndex}`;
        const paymentId = stableObjectId(simulationId, paymentKey);
        const paymentCreatedAt = new Date(
          `${toDateOnly(paymentDate)}T00:00:00.000Z`
        );

        paymentDocs.push({
          _id: paymentId,
          amount,
          paymentDate: toDateOnly(paymentDate),
          paymentMethod: paymentRandom.pick(config.payment.methods),
          bookingId,
          paymentProofImage: "",
          sellerId: seller.id,
          touristId: bookingTourists[0]._id,
          dataOrigin: "simulated",
          simulationId,
          simulationVersion: config.version,
          simulationSeed: config.seed,
          simulationKey: paymentKey,
          createdAt: paymentCreatedAt.toISOString(),
          updatedAt: paymentCreatedAt.toISOString(),
        });

        previousPaymentDate = paymentDate;
      });

      payments.push(...paymentDocs);

      const paidAmount = paymentDocs.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      let cancellationFee = 0;
      let refundAmount = 0;
      let refundedAt: string | null = null;

      if (status === "cancelled") {
        cancellationFee = Math.round(
          paidAmount * (0.1 + paymentRandom.next() * 0.2)
        );
        refundAmount = Math.max(0, paidAmount - cancellationFee);

        if (refundAmount > 0) {
          const latestRefund = minDate(asOf, addDays(departureStart, -1));
          let refundDate = addDays(createdAt, paymentRandom.int(1, 20));
          if (refundDate.getTime() > latestRefund.getTime()) {
            refundDate = latestRefund;
          }
          if (refundDate.getTime() < createdAt.getTime()) {
            refundDate = createdAt;
          }
          refundedAt = refundDate.toISOString();
        }
      }

      const attendance =
        status === "completed"
          ? bookingTourists.map((tourist) => ({
              touristId: tourist._id,
              status: (bookingRandom.chance(0.94)
                ? "present"
                : "absent") as "present" | "absent",
            }))
          : [];

      let updatedAt = createdAt;
      if (departureIsPast && status === "completed") {
        updatedAt = maxDate(updatedAt, addDays(departureEnd, 1));
      }
      for (const payment of paymentDocs) {
        updatedAt = maxDate(updatedAt, new Date(payment.createdAt));
      }
      if (refundedAt) {
        updatedAt = maxDate(updatedAt, new Date(refundedAt));
      }
      updatedAt = minDate(updatedAt, asOf);
      if (updatedAt.getTime() < createdAt.getTime()) {
        updatedAt = createdAt;
      }

      bookings.push({
        _id: bookingId,
        touristsIds: bookingTourists.map((tourist) => tourist._id),
        dateRangeId: departureId,
        notes: "Reserva registrada mediante canal web",
        paymentIds: paymentDocs.map((payment) => payment._id),
        sellerId: seller.id,
        status,
        totalPrice,
        tourPackageId: packageId,
        paymentProofFolder: `simulated/payment-proofs/${bookingId}`,
        attendance,
        cancellationFee,
        refundAmount,
        refundedAt,
        bookingCode: `RSV-${bookingId.slice(0, 12).toUpperCase()}`,
        dataOrigin: "simulated",
        simulationId,
        simulationVersion: config.version,
        simulationSeed: config.seed,
        simulationKey: bookingKey,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });

      remainingTourists -= groupSize;
      bookingIndex += 1;
    }
  }

  return { dateRangeIds };
};

const buildSummary = (dataset: Omit<SimulationDataset, "summary" | "datasetHash">): SimulationSummary => {
  const { collections, config } = dataset;
  const bookingsByStatus: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };

  for (const booking of collections.Bookings) {
    bookingsByStatus[booking.status] += 1;
  }

  const paymentsByMethod: Record<string, number> = {};
  for (const method of config.payment.methods) {
    paymentsByMethod[method] = 0;
  }
  for (const payment of collections.Payments) {
    paymentsByMethod[payment.paymentMethod] =
      (paymentsByMethod[payment.paymentMethod] ?? 0) + 1;
  }

  const bookingsByDateRange = new Map<string, SimulationBookingDoc[]>();
  for (const booking of collections.Bookings) {
    const current = bookingsByDateRange.get(booking.dateRangeId) ?? [];
    current.push(booking);
    bookingsByDateRange.set(booking.dateRangeId, current);
  }

  const occupancyValues: number[] = [];
  let departuresWithBookings = 0;

  for (const dateRange of collections.Date_Ranges) {
    const dateRangeBookings = bookingsByDateRange.get(dateRange._id) ?? [];
    if (dateRangeBookings.length > 0) {
      departuresWithBookings += 1;
    }

    const activeTourists = dateRangeBookings
      .filter((booking) => booking.status !== "cancelled")
      .reduce((sum, booking) => sum + booking.touristsIds.length, 0);

    occupancyValues.push(activeTourists / dateRange.capacity);
  }

  const departureDates = collections.Date_Ranges.map(
    (dateRange) => dateRange.startDate
  ).sort();
  const paymentDates = collections.Payments.map(
    (payment) => payment.paymentDate
  ).sort();

  return {
    collections: {
      Date_Ranges: collections.Date_Ranges.length,
      Tour_Packages: collections.Tour_Packages.length,
      Tourists: collections.Tourists.length,
      Bookings: collections.Bookings.length,
      Payments: collections.Payments.length,
    },
    bookingsByStatus,
    paymentsByMethod,
    departures: collections.Date_Ranges.length,
    departuresWithBookings,
    departuresWithoutBookings:
      collections.Date_Ranges.length - departuresWithBookings,
    occupancy: {
      min: occupancyValues.length > 0 ? Math.min(...occupancyValues) : 0,
      median: computeMedian(occupancyValues),
      max: occupancyValues.length > 0 ? Math.max(...occupancyValues) : 0,
      average:
        occupancyValues.length > 0
          ? occupancyValues.reduce((sum, value) => sum + value, 0) /
            occupancyValues.length
          : 0,
    },
    distinctDestinations: new Set(
      collections.Tour_Packages.map((tourPackage) => tourPackage.touristDestination)
    ).size,
    distinctTourTypes: new Set(
      collections.Tour_Packages.map((tourPackage) => tourPackage.tourType)
    ).size,
    distinctDepartureMonths: Array.from(
      new Set(
        collections.Date_Ranges.map((dateRange) =>
          dateRange.startDate.slice(0, 7)
        )
      )
    ).sort(),
    firstDeparture: departureDates[0] ?? null,
    lastDeparture: departureDates[departureDates.length - 1] ?? null,
    firstPaymentDate: paymentDates[0] ?? null,
    lastPaymentDate: paymentDates[paymentDates.length - 1] ?? null,
  };
};

export const buildSimulationDataset = (
  config: SimulationConfig,
  referenceData: SimulationReferenceData
): SimulationDataset => {
  validateSimulationConfig(config);
  assertReferenceData(config, referenceData);

  const periodStart = parseSimulationDate(config.periodStart);
  const periodEnd = parseSimulationDate(config.periodEnd);
  const asOf = parseSimulationDate(config.asOf);

  const sortedReferenceData: SimulationReferenceData = {
    destinations: [...referenceData.destinations].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
    tourTypes: [...referenceData.tourTypes].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
    sellers: [...referenceData.sellers].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
    guides: [...referenceData.guides].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
  };

  const simulationId = `sim_${sha256Hex(
    stableStringify({
      version: config.version,
      seed: config.seed,
      periodStart: config.periodStart,
      periodEnd: config.periodEnd,
      asOf: config.asOf,
      scenario: config.scenario,
      departureIntervalDays: config.departureIntervalDays,
      packageProfiles: config.packageProfiles,
      capacity: config.capacity,
      demand: config.demand,
      booking: config.booking,
      payment: config.payment,
      allowOverCapacityForTesting: config.allowOverCapacityForTesting === true,
      referenceData: sortedReferenceData,
    })
  ).slice(0, 24)}`;

  const destinationByName = new Map(
    sortedReferenceData.destinations.map((destination) => [
      destination.name,
      destination,
    ])
  );
  const tourTypeByName = new Map(
    sortedReferenceData.tourTypes.map((tourType) => [tourType.name, tourType])
  );

  const dateRanges: SimulationDateRangeDoc[] = [];
  const tourPackages: SimulationTourPackageDoc[] = [];
  const tourists: SimulationTouristDoc[] = [];
  const bookings: SimulationBookingDoc[] = [];
  const payments: SimulationPaymentDoc[] = [];
  const warnings: string[] = [];

  if (sortedReferenceData.guides.length === 0) {
    warnings.push(
      "No se encontraron guías; las salidas simuladas se generaron sin guías."
    );
  }

  config.packageProfiles.forEach((profile, packageIndex) => {
    const destination = destinationByName.get(profile.destinationName);
    const tourType = tourTypeByName.get(profile.tourTypeName);

    if (!destination || !tourType) {
      throw new Error(`Referencias incompletas para el paquete ${profile.code}`);
    }

    const packageKey = `tourPackage:${profile.code}`;
    const packageId = stableObjectId(simulationId, packageKey);
    const packageCreatedAt = addDays(periodStart, -60);
    const packageUpdatedAt = addDays(periodStart, -30);

    const { dateRangeIds } = buildPackage(
      {
        config,
        simulationId,
        profile,
        packageId,
        destinationId: destination.id,
        tourTypeId: tourType.id,
        sellers: sortedReferenceData.sellers,
        guides: sortedReferenceData.guides,
        periodStart,
        periodEnd,
        asOf,
        dateRanges,
        tourists,
        bookings,
        payments,
      },
      packageIndex
    );

    tourPackages.push({
      _id: packageId,
      name: buildRealisticPackageName(profile.code),
      tourType: tourType.id,
      touristDestination: destination.id,
      duration: profile.durationDays,
      dateRanges: dateRangeIds,
      price: profile.price,
      itinerary: {
        days: Array.from({ length: profile.durationDays }, (_, dayIndex) => ({
          dayNumber: dayIndex + 1,
          activities: [
            {
              description: `Actividad programada del día ${dayIndex + 1}`,
              time: "09:00",
            },
          ],
        })),
      },
      status: "active",
      deleted: false,
      dataOrigin: "simulated",
      simulationId,
      simulationVersion: config.version,
      simulationSeed: config.seed,
      simulationKey: packageKey,
      createdAt: packageCreatedAt.toISOString(),
      updatedAt: packageUpdatedAt.toISOString(),
    });
  });

  const datasetWithoutSummary = {
    simulationId,
    config,
    referenceData: sortedReferenceData,
    collections: {
      Date_Ranges: dateRanges,
      Tour_Packages: tourPackages,
      Tourists: tourists,
      Bookings: bookings,
      Payments: payments,
    },
    warnings,
  };

  const summary = buildSummary(datasetWithoutSummary);
  const datasetHash = sha256Hex(
    stableStringify({
      simulationId,
      collections: {
        Date_Ranges: [...dateRanges].sort((left, right) =>
          left._id.localeCompare(right._id)
        ),
        Tour_Packages: [...tourPackages].sort((left, right) =>
          left._id.localeCompare(right._id)
        ),
        Tourists: [...tourists].sort((left, right) =>
          left._id.localeCompare(right._id)
        ),
        Bookings: [...bookings].sort((left, right) =>
          left._id.localeCompare(right._id)
        ),
        Payments: [...payments].sort((left, right) =>
          left._id.localeCompare(right._id)
        ),
      },
    })
  );

  return {
    ...datasetWithoutSummary,
    summary,
    datasetHash,
  };
};
