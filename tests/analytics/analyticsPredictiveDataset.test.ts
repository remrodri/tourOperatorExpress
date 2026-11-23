import { Types } from "mongoose";
import { BookingModel } from "../../src/modules/booking/model/BookingModel";
import { DateRangeModel } from "../../src/modules/dateRange/model/DateRangeModel";
import { buildPredictiveDataset } from "../../src/modules/analytics/dataset/PredictiveDatasetBuilder";
import { loadPredictiveDatasetInputs } from "../../src/modules/analytics/dataset/PredictiveDatasetRepository";
import {
  PREDICTIVE_DATASET_AS_OF,
  PREDICTIVE_DATASET_VERSION,
  PredictiveDataset,
  PredictiveDatasetBooking,
  PredictiveDatasetDeparture,
  PredictiveDatasetPackage,
} from "../../src/modules/analytics/dataset/PredictiveDatasetTypes";
import { TourPackageModel } from "../../src/modules/tourPackage/model/TourPackageModel";
import { TouristDestinationModel } from "../../src/modules/touristDestination/model/TouristDestinationModel";

const createPackage = (
  overrides: Partial<PredictiveDatasetPackage> = {},
): PredictiveDatasetPackage => ({
  id: "pkg-1",
  destinationId: "dest-1",
  tourTypeId: "type-1",
  durationDays: 2,
  price: 100,
  ...overrides,
});

const createDeparture = (
  overrides: Partial<PredictiveDatasetDeparture> = {},
): PredictiveDatasetDeparture => ({
  id: "dep-1",
  startDate: new Date("2026-01-30T00:00:00.000Z"),
  endDate: new Date("2026-01-31T00:00:00.000Z"),
  capacity: 20,
  tourPackageId: "pkg-1",
  dataOrigin: "simulated",
  simulationId: "sim-1",
  simulationVersion: "t807-v1",
  simulationSeed: 20261113,
  ...overrides,
});

const createBooking = (
  departureId: string,
  status: string,
  tourists: number,
  createdAt: Date,
): PredictiveDatasetBooking => ({
  departureId,
  status,
  tourists,
  createdAt,
});

const getRecord = (
  dataset: PredictiveDataset,
  departureId: string,
  horizon: number,
) => {
  const record = dataset.records.find(
    (item) =>
      item.departureId === departureId && item.horizonDays === horizon,
  );

  if (!record) {
    throw new Error(`No existe registro ${departureId}/${horizon}`);
  }

  return record;
};

const collectKeys = (value: unknown, keys: string[] = []): string[] => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, keys);
    }
    return keys;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      collectKeys(child, keys);
    }
  }

  return keys;
};

describe("Predictive dataset T-812", () => {
  it("builds the 30, 14 and 7 day rows with deterministic keys", () => {
    const dataset = buildPredictiveDataset({
      departures: [createDeparture()],
      bookings: [],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    expect(dataset.datasetVersion).toBe(PREDICTIVE_DATASET_VERSION);
    expect(dataset.asOf).toBe(PREDICTIVE_DATASET_AS_OF);
    expect(dataset.records).toHaveLength(3);
    expect(dataset.records.map((record) => record.key).sort()).toEqual([
      "dep-1:14",
      "dep-1:30",
      "dep-1:7",
    ]);

    const record30 = getRecord(dataset, "dep-1", 30);
    const record14 = getRecord(dataset, "dep-1", 14);
    const record7 = getRecord(dataset, "dep-1", 7);

    expect(record30.cutoffDate).toBe("2025-12-31");
    expect(record30.cutoffAt).toBe("2025-12-31T00:00:00.000Z");
    expect(record30.features.daysUntilDeparture).toBe(30);
    expect(record14.cutoffDate).toBe("2026-01-16");
    expect(record14.features.daysUntilDeparture).toBe(14);
    expect(record7.cutoffDate).toBe("2026-01-23");
    expect(record7.features.daysUntilDeparture).toBe(7);
    expect(record30.split).toBe("train");
  });

  it("excludes post-cutoff bookings from features but keeps them in the final label", () => {
    const dataset = buildPredictiveDataset({
      departures: [createDeparture()],
      bookings: [
        createBooking(
          "dep-1",
          "confirmed",
          3,
          new Date("2025-12-20T12:00:00.000Z"),
        ),
        createBooking(
          "dep-1",
          "confirmed",
          2,
          new Date("2026-01-10T12:00:00.000Z"),
        ),
        createBooking(
          "dep-1",
          "cancelled",
          10,
          new Date("2025-12-15T12:00:00.000Z"),
        ),
      ],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    const record30 = getRecord(dataset, "dep-1", 30);
    const record7 = getRecord(dataset, "dep-1", 7);

    expect(record30.labelFinalTourists).toBe(5);
    expect(record30.features.confirmedTourists).toBe(3);
    expect(record30.features.confirmedBookings).toBe(1);
    expect(record30.features.averageGroupSize).toBe(3);
    expect(record30.features.rhythm.last7Days.bookings).toBe(0);
    expect(record30.features.rhythm.last14Days.bookings).toBe(1);
    expect(record30.features.rhythm.last14Days.tourists).toBe(3);

    expect(record7.labelFinalTourists).toBe(5);
    expect(record7.features.confirmedTourists).toBe(5);
    expect(record7.features.confirmedBookings).toBe(2);
    expect(record7.features.averageGroupSize).toBe(2.5);
  });

  it("uses exclusive cutoff and correct 7 and 14 day rhythm windows", () => {
    const dataset = buildPredictiveDataset({
      departures: [createDeparture()],
      bookings: [
        createBooking(
          "dep-1",
          "pending",
          2,
          new Date("2025-12-30T00:00:00.000Z"),
        ),
        createBooking(
          "dep-1",
          "paid",
          3,
          new Date("2025-12-20T00:00:00.000Z"),
        ),
        createBooking(
          "dep-1",
          "completed",
          4,
          new Date("2025-12-10T00:00:00.000Z"),
        ),
        createBooking(
          "dep-1",
          "confirmed",
          9,
          new Date("2025-12-31T00:00:00.000Z"),
        ),
      ],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    const record30 = getRecord(dataset, "dep-1", 30);

    expect(record30.features.confirmedBookings).toBe(3);
    expect(record30.features.confirmedTourists).toBe(9);
    expect(record30.features.rhythm.last7Days).toMatchObject({
      windowDays: 7,
      bookings: 1,
      tourists: 2,
      bookingsPerDay: 0.1429,
      touristsPerDay: 0.2857,
    });
    expect(record30.features.rhythm.last14Days).toMatchObject({
      windowDays: 14,
      bookings: 2,
      tourists: 5,
      bookingsPerDay: 0.1429,
      touristsPerDay: 0.3571,
    });
    expect(record30.features.salesAgeDays).toBe(21);
  });

  it("keeps a valid low-demand row when the departure has no bookings", () => {
    const dataset = buildPredictiveDataset({
      departures: [createDeparture()],
      bookings: [],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    const record = getRecord(dataset, "dep-1", 30);

    expect(record.labelFinalTourists).toBe(0);
    expect(record.features.confirmedTourists).toBe(0);
    expect(record.features.confirmedBookings).toBe(0);
    expect(record.features.averageGroupSize).toBeNull();
    expect(record.features.salesAgeDays).toBeNull();
    expect(record.features.historicalPackage).toEqual({
      completedDepartures: 0,
      averageFinalOccupancy: null,
    });
    expect(dataset.summary.horizons["30"].rowsWithoutPriorBookings).toBe(1);
  });

  it("counts every discard reason by horizon", () => {
    const dataset = buildPredictiveDataset({
      departures: [
        createDeparture({ id: "dep-legacy", dataOrigin: "legacy" }),
        createDeparture({ id: "dep-no-start", startDate: null }),
        createDeparture({ id: "dep-no-capacity", capacity: 0 }),
        createDeparture({ id: "dep-no-package", tourPackageId: null }),
        createDeparture({
          id: "dep-unknown-package",
          tourPackageId: "pkg-missing",
        }),
        createDeparture({
          id: "dep-future",
          startDate: new Date("2026-12-01T00:00:00.000Z"),
          endDate: new Date("2026-12-02T00:00:00.000Z"),
        }),
        createDeparture({ id: "dep-ok" }),
      ],
      bookings: [],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    expect(dataset.summary.departures).toMatchObject({
      candidates: 7,
      included: 1,
      discarded: {
        "non-simulated-origin": 1,
        "missing-dates": 1,
        "invalid-capacity": 1,
        "missing-package": 2,
        "outcome-unavailable": 1,
        "invalid-cutoff": 0,
      },
    });
    expect(dataset.summary.horizons["30"].discarded).toEqual(
      dataset.summary.departures.discarded,
    );
    expect(dataset.summary.horizons["14"].discarded).toEqual(
      dataset.summary.departures.discarded,
    );
    expect(dataset.summary.horizons["7"].discarded).toEqual(
      dataset.summary.departures.discarded,
    );
    expect(dataset.records.every((record) => record.departureId === "dep-ok")).toBe(
      true,
    );
  });

  it("splits chronologically and keeps all horizons of a departure together", () => {
    const departures = Array.from({ length: 20 }, (_, index) =>
      createDeparture({
        id: `dep-${String(index).padStart(2, "0")}`,
        startDate: new Date(
          `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        ),
        endDate: new Date(
          `2026-01-${String(index + 2).padStart(2, "0")}T00:00:00.000Z`,
        ),
      }),
    );

    const dataset = buildPredictiveDataset({
      departures,
      bookings: [],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    const splitByDeparture = new Map<string, Set<string>>();
    for (const record of dataset.records) {
      const splits = splitByDeparture.get(record.departureId) ?? new Set();
      splits.add(record.split);
      splitByDeparture.set(record.departureId, splits);
    }

    expect(
      [...splitByDeparture.values()].every((splits) => splits.size === 1),
    ).toBe(true);
    expect(dataset.summary.splits.train.departures).toBe(14);
    expect(dataset.summary.splits.validation.departures).toBe(3);
    expect(dataset.summary.splits.test.departures).toBe(3);

    const startOf = (record: (typeof dataset.records)[number]) =>
      new Date(record.cutoffAt).getTime() +
      record.horizonDays * 24 * 60 * 60 * 1000;
    const trainStarts = dataset.records
      .filter((record) => record.split === "train")
      .map(startOf);
    const validationStarts = dataset.records
      .filter((record) => record.split === "validation")
      .map(startOf);
    const testStarts = dataset.records
      .filter((record) => record.split === "test")
      .map(startOf);

    expect(Math.max(...trainStarts)).toBeLessThan(
      Math.min(...validationStarts),
    );
    expect(Math.max(...validationStarts)).toBeLessThan(
      Math.min(...testStarts),
    );
  });

  it("produces a stable hash and identical output regardless of input order", () => {
    const departures = [
      createDeparture({ id: "dep-a" }),
      createDeparture({
        id: "dep-b",
        startDate: new Date("2026-02-10T00:00:00.000Z"),
        endDate: new Date("2026-02-11T00:00:00.000Z"),
      }),
      createDeparture({
        id: "dep-c",
        startDate: new Date("2026-03-10T00:00:00.000Z"),
        endDate: new Date("2026-03-11T00:00:00.000Z"),
      }),
    ];
    const bookings = [
      createBooking(
        "dep-a",
        "confirmed",
        2,
        new Date("2025-12-20T00:00:00.000Z"),
      ),
      createBooking(
        "dep-b",
        "pending",
        3,
        new Date("2026-01-20T00:00:00.000Z"),
      ),
    ];
    const generatedAt = new Date("2026-11-23T00:00:00.000Z");

    const first = buildPredictiveDataset({
      departures,
      bookings,
      packages: [createPackage()],
      generatedAt,
    });
    const second = buildPredictiveDataset({
      departures: [...departures].reverse(),
      bookings: [...bookings].reverse(),
      packages: [createPackage()],
      generatedAt,
    });

    expect(second.datasetHash).toBe(first.datasetHash);
    expect(second.records).toEqual(first.records);
  });

  it("uses only package departures finished before the cutoff as historical context", () => {
    const dataset = buildPredictiveDataset({
      departures: [
        createDeparture({
          id: "dep-prior",
          startDate: new Date("2025-11-30T00:00:00.000Z"),
          endDate: new Date("2025-12-01T00:00:00.000Z"),
          capacity: 10,
        }),
        createDeparture({
          id: "dep-target",
          startDate: new Date("2026-01-30T00:00:00.000Z"),
          endDate: new Date("2026-01-31T00:00:00.000Z"),
          capacity: 20,
        }),
        createDeparture({
          id: "dep-after",
          startDate: new Date("2026-02-10T00:00:00.000Z"),
          endDate: new Date("2026-02-11T00:00:00.000Z"),
          capacity: 20,
        }),
      ],
      bookings: [
        createBooking(
          "dep-prior",
          "completed",
          5,
          new Date("2025-11-20T00:00:00.000Z"),
        ),
        createBooking(
          "dep-target",
          "confirmed",
          10,
          new Date("2026-01-10T00:00:00.000Z"),
        ),
        createBooking(
          "dep-after",
          "confirmed",
          20,
          new Date("2026-02-01T00:00:00.000Z"),
        ),
      ],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    const target30 = getRecord(dataset, "dep-target", 30);
    const target7 = getRecord(dataset, "dep-target", 7);

    expect(target30.features.historicalPackage).toEqual({
      completedDepartures: 1,
      averageFinalOccupancy: 0.5,
    });
    expect(target7.features.historicalPackage).toEqual({
      completedDepartures: 1,
      averageFinalOccupancy: 0.5,
    });
  });

  it("uses only historical bookings known at the cutoff", () => {
    const dataset = buildPredictiveDataset({
      departures: [
        createDeparture({
          id: "dep-prior",
          startDate: new Date("2025-11-30T00:00:00.000Z"),
          endDate: new Date("2025-12-01T00:00:00.000Z"),
          capacity: 10,
        }),
        createDeparture({
          id: "dep-target",
          startDate: new Date("2026-01-30T00:00:00.000Z"),
          endDate: new Date("2026-01-31T00:00:00.000Z"),
          capacity: 20,
        }),
      ],
      bookings: [
        createBooking(
          "dep-prior",
          "completed",
          5,
          new Date("2025-11-20T00:00:00.000Z"),
        ),
        createBooking(
          "dep-prior",
          "completed",
          5,
          new Date("2026-01-05T00:00:00.000Z"),
        ),
      ],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    const target30 = getRecord(dataset, "dep-target", 30);
    const target7 = getRecord(dataset, "dep-target", 7);

    expect(target30.features.historicalPackage).toEqual({
      completedDepartures: 1,
      averageFinalOccupancy: 0.5,
    });
    expect(target7.features.historicalPackage).toEqual({
      completedDepartures: 1,
      averageFinalOccupancy: 1,
    });
  });

  it("does not expose personal data in dataset records", () => {
    const dataset = buildPredictiveDataset({
      departures: [createDeparture()],
      bookings: [
        createBooking(
          "dep-1",
          "confirmed",
          2,
          new Date("2025-12-20T00:00:00.000Z"),
        ),
      ],
      packages: [createPackage()],
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });

    const keys = collectKeys(dataset.records);
    const serialized = JSON.stringify(dataset.records);

    expect(keys).not.toEqual(
      expect.arrayContaining([
        "email",
        "phone",
        "firstName",
        "lastName",
        "ci",
        "passportNumber",
        "touristsIds",
        "sellerId",
        "bookingCode",
        "paymentProofImage",
        "notes",
      ]),
    );
    expect(serialized).not.toContain("@");
    expect(serialized).not.toContain("example.test");
  });

  it("loads MongoDB inputs without personal collections", async () => {
    const destination = await TouristDestinationModel.create({
      name: "Destino dataset",
      description: "Destino de prueba",
      imageFolder: "dataset",
      images: [],
      deleted: false,
    });
    const tourPackage = await TourPackageModel.create({
      name: "Paquete dataset",
      tourType: new Types.ObjectId(),
      touristDestination: destination._id,
      duration: 2,
      dateRanges: [],
      price: 150,
      itinerary: { days: [] },
      status: "active",
      deleted: false,
      dataOrigin: "simulated",
    });
    const departure = await DateRangeModel.create({
      dates: [],
      startDate: new Date("2026-01-30T00:00:00.000Z"),
      endDate: new Date("2026-01-31T00:00:00.000Z"),
      capacity: 20,
      state: "completed",
      guides: [],
      tourPackageId: tourPackage._id,
      dataOrigin: "simulated",
      simulationId: "sim-dataset",
      simulationVersion: "t807-v1",
      simulationSeed: 20261113,
    });

    await BookingModel.create({
      touristsIds: [new Types.ObjectId(), new Types.ObjectId()],
      dateRangeId: departure._id,
      paymentIds: [],
      sellerId: new Types.ObjectId(),
      status: "completed",
      totalPrice: 300,
      tourPackageId: tourPackage._id,
      paymentProofFolder: "dataset",
      dataOrigin: "simulated",
      createdAt: new Date("2025-12-20T00:00:00.000Z"),
      updatedAt: new Date("2025-12-20T00:00:00.000Z"),
    });
    await BookingModel.create({
      touristsIds: [new Types.ObjectId()],
      dateRangeId: departure._id,
      paymentIds: [],
      sellerId: new Types.ObjectId(),
      status: "cancelled",
      totalPrice: 150,
      tourPackageId: tourPackage._id,
      paymentProofFolder: "dataset",
      dataOrigin: "simulated",
      createdAt: new Date("2025-12-21T00:00:00.000Z"),
      updatedAt: new Date("2025-12-21T00:00:00.000Z"),
    });

    const inputs = await loadPredictiveDatasetInputs();
    const dataset = buildPredictiveDataset({
      ...inputs,
      generatedAt: new Date("2026-11-23T00:00:00.000Z"),
    });
    const record = getRecord(dataset, departure._id.toString(), 30);

    expect(inputs.departures).toHaveLength(1);
    expect(inputs.bookings).toHaveLength(2);
    expect(inputs.packages).toHaveLength(1);
    expect(record.labelFinalTourists).toBe(2);
    expect(record.features.confirmedTourists).toBe(2);
    expect(record.features.confirmedBookings).toBe(1);
    expect(record.features.destinationId).toBe(destination._id.toString());
    expect(record.features.packagePrice).toBe(150);
  });
});
