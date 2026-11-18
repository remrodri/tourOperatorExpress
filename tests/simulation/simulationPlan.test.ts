import { DEFAULT_SIMULATION_CONFIG } from "../../src/database/simulation/simulationConfig";
import {
  SimulationDataset,
  buildSimulationDataset,
} from "../../src/database/simulation/simulationPlan";
import { validateSimulationDataset } from "../../src/database/simulation/simulationValidation";
import { makeReferenceData, makeSmallConfig } from "./simulationFixtures";

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const activeTouristsByDateRange = (
  dataset: SimulationDataset
): Map<string, number> => {
  const active = new Map<string, number>();
  for (const booking of dataset.collections.Bookings) {
    if (booking.status === "cancelled") {
      continue;
    }
    active.set(
      booking.dateRangeId,
      (active.get(booking.dateRangeId) ?? 0) + booking.touristsIds.length
    );
  }
  return active;
};

describe("simulación T-807: plan determinista", () => {
  it("produce el mismo dataset con la misma semilla y configuración", () => {
    const config = makeSmallConfig();
    const referenceData = makeReferenceData();
    const reversedReferenceData = {
      ...referenceData,
      destinations: [...referenceData.destinations].reverse(),
      tourTypes: [...referenceData.tourTypes].reverse(),
      sellers: [...referenceData.sellers].reverse(),
      guides: [...referenceData.guides].reverse(),
    };

    const first = buildSimulationDataset(config, referenceData);
    const second = buildSimulationDataset(config, reversedReferenceData);

    expect(second.simulationId).toBe(first.simulationId);
    expect(second.datasetHash).toBe(first.datasetHash);
    expect(second.collections.Date_Ranges.map((dateRange) => dateRange._id))
      .toEqual(first.collections.Date_Ranges.map((dateRange) => dateRange._id));
    expect(second.collections.Bookings.map((booking) => booking._id))
      .toEqual(first.collections.Bookings.map((booking) => booking._id));
    expect(second.collections.Payments.map((payment) => payment._id))
      .toEqual(first.collections.Payments.map((payment) => payment._id));
  });

  it("produce un dataset distinto y válido con otra semilla", () => {
    const referenceData = makeReferenceData();
    const first = buildSimulationDataset(makeSmallConfig(), referenceData);
    const second = buildSimulationDataset(
      makeSmallConfig({ seed: 987654 }),
      referenceData
    );

    expect(second.simulationId).not.toBe(first.simulationId);
    expect(second.datasetHash).not.toBe(first.datasetHash);
    expect(
      validateSimulationDataset(second, { strictVariation: false }).passed
    ).toBe(true);
  });

  it("mantiene relaciones sin huérfanos y respeta la capacidad", () => {
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    const validation = validateSimulationDataset(dataset, {
      strictVariation: false,
    });

    expect(validation.passed).toBe(true);
    expect(validation.failed).toEqual([]);

    const dateRangeById = new Map(
      dataset.collections.Date_Ranges.map((dateRange) => [
        dateRange._id,
        dateRange,
      ])
    );
    const tourPackageById = new Map(
      dataset.collections.Tour_Packages.map((tourPackage) => [
        tourPackage._id,
        tourPackage,
      ])
    );
    const touristById = new Map(
      dataset.collections.Tourists.map((tourist) => [tourist._id, tourist])
    );
    const paymentById = new Map(
      dataset.collections.Payments.map((payment) => [payment._id, payment])
    );
    const active = activeTouristsByDateRange(dataset);

    for (const dateRange of dataset.collections.Date_Ranges) {
      expect(Number.isInteger(dateRange.capacity)).toBe(true);
      expect(dateRange.capacity).toBeGreaterThanOrEqual(
        dataset.config.capacity.min
      );
      expect(dateRange.capacity).toBeLessThanOrEqual(
        dataset.config.capacity.max
      );
      expect(active.get(dateRange._id) ?? 0).toBeLessThanOrEqual(
        dateRange.capacity
      );
      expect(tourPackageById.has(dateRange.tourPackageId)).toBe(true);
    }

    for (const booking of dataset.collections.Bookings) {
      const dateRange = dateRangeById.get(booking.dateRangeId);
      expect(dateRange).toBeDefined();
      expect(tourPackageById.has(booking.tourPackageId)).toBe(true);
      expect(dateRange?.tourPackageId).toBe(booking.tourPackageId);

      for (const touristId of booking.touristsIds) {
        expect(touristById.has(touristId)).toBe(true);
        expect(touristById.get(touristId)?.bookingIds).toContain(booking._id);
      }
      for (const paymentId of booking.paymentIds) {
        expect(paymentById.get(paymentId)?.bookingId).toBe(booking._id);
      }
    }
  });

  it("genera fechas, estados y pagos coherentes con asOf", () => {
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    const periodStart = new Date(`${dataset.config.periodStart}T00:00:00.000Z`);
    const periodEnd = new Date(`${dataset.config.periodEnd}T00:00:00.000Z`);
    const asOf = new Date(`${dataset.config.asOf}T00:00:00.000Z`);
    const dateRangeById = new Map(
      dataset.collections.Date_Ranges.map((dateRange) => [
        dateRange._id,
        dateRange,
      ])
    );
    const bookingById = new Map(
      dataset.collections.Bookings.map((booking) => [booking._id, booking])
    );
    const paidByBooking = new Map<string, number>();

    for (const payment of dataset.collections.Payments) {
      paidByBooking.set(
        payment.bookingId,
        (paidByBooking.get(payment.bookingId) ?? 0) + payment.amount
      );

      const booking = bookingById.get(payment.bookingId);
      expect(booking).toBeDefined();
      const dateRange = dateRangeById.get(booking!.dateRangeId);
      expect(dateRange).toBeDefined();

      const paymentDate = new Date(`${payment.paymentDate}T00:00:00.000Z`);
      const latestAllowed = new Date(
        Math.min(
          asOf.getTime(),
          new Date(dateRange!.startDate).getTime() - DAY_MILLISECONDS
        )
      );

      expect(paymentDate.getTime()).toBeGreaterThanOrEqual(
        new Date(booking!.createdAt).getTime()
      );
      expect(paymentDate.getTime()).toBeLessThanOrEqual(
        latestAllowed.getTime()
      );
      expect(paymentDate.getTime()).toBeLessThanOrEqual(asOf.getTime());
    }

    for (const dateRange of dataset.collections.Date_Ranges) {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);

      expect(startDate.getTime()).toBeGreaterThanOrEqual(
        periodStart.getTime()
      );
      expect(startDate.getTime()).toBeLessThanOrEqual(periodEnd.getTime());
      expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(dateRange.state).toBe(
        endDate.getTime() < asOf.getTime() ? "completed" : "pending"
      );
    }

    for (const booking of dataset.collections.Bookings) {
      const dateRange = dateRangeById.get(booking.dateRangeId);
      expect(dateRange).toBeDefined();
      const createdAt = new Date(booking.createdAt);
      const updatedAt = new Date(booking.updatedAt);
      const departureStart = new Date(dateRange!.startDate);
      const departureEnd = new Date(dateRange!.endDate);

      expect(createdAt.getTime()).toBeLessThan(departureStart.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(asOf.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(asOf.getTime());

      if (departureEnd.getTime() < asOf.getTime()) {
        expect(["completed", "cancelled"]).toContain(booking.status);
      } else {
        expect(["pending", "confirmed", "cancelled"]).toContain(booking.status);
      }
    }
  });

  it("mantiene pagos, cancelaciones y asistencia consistentes", () => {
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    const paidByBooking = new Map<string, number>();
    for (const payment of dataset.collections.Payments) {
      paidByBooking.set(
        payment.bookingId,
        (paidByBooking.get(payment.bookingId) ?? 0) + payment.amount
      );
    }

    expect(
      dataset.collections.Bookings.every(
        (booking) => (booking.status as string) !== "paid"
      )
    ).toBe(true);

    for (const booking of dataset.collections.Bookings) {
      expect(["pending", "confirmed", "cancelled", "completed"]).toContain(
        booking.status
      );

      const paidAmount = paidByBooking.get(booking._id) ?? 0;
      expect(paidAmount).toBeLessThanOrEqual(booking.totalPrice);

      if (booking.status === "cancelled") {
        expect(booking.cancellationFee).toBeGreaterThanOrEqual(0);
        expect(booking.refundAmount).toBeGreaterThanOrEqual(0);
        expect(booking.cancellationFee + booking.refundAmount).toBe(
          paidAmount
        );
        if (booking.refundAmount > 0) {
          expect(booking.refundedAt).not.toBeNull();
        } else {
          expect(booking.refundedAt).toBeNull();
        }
      } else {
        expect(booking.cancellationFee).toBe(0);
        expect(booking.refundAmount).toBe(0);
        expect(booking.refundedAt).toBeNull();
      }

      if (booking.status === "completed") {
        expect(booking.attendance).toHaveLength(booking.touristsIds.length);
      } else {
        expect(booking.attendance).toHaveLength(0);
      }
    }
  });

  it("marca todos los documentos como simulados y trazables", () => {
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    const allDocuments = [
      ...dataset.collections.Date_Ranges,
      ...dataset.collections.Tour_Packages,
      ...dataset.collections.Tourists,
      ...dataset.collections.Bookings,
      ...dataset.collections.Payments,
    ];

    for (const document of allDocuments) {
      expect(document.dataOrigin).toBe("simulated");
      expect(document.simulationId).toBe(dataset.simulationId);
      expect(document.simulationVersion).toBe(dataset.config.version);
      expect(document.simulationSeed).toBe(dataset.config.seed);
      expect(document.simulationKey.length).toBeGreaterThan(0);
    }
  });

  it("valida el dataset baseline completo con variedad suficiente", () => {
    const dataset = buildSimulationDataset(
      DEFAULT_SIMULATION_CONFIG,
      makeReferenceData()
    );
    const validation = validateSimulationDataset(dataset);

    expect(validation.passed).toBe(true);
    expect(validation.failed).toEqual([]);
    expect(dataset.summary.bookingsByStatus.pending).toBeGreaterThan(0);
    expect(dataset.summary.bookingsByStatus.confirmed).toBeGreaterThan(0);
    expect(dataset.summary.bookingsByStatus.cancelled).toBeGreaterThan(0);
    expect(dataset.summary.bookingsByStatus.completed).toBeGreaterThan(0);
    expect(dataset.summary.distinctDestinations).toBeGreaterThanOrEqual(2);
    expect(dataset.summary.distinctTourTypes).toBeGreaterThanOrEqual(2);
    expect(dataset.summary.distinctDepartureMonths.length).toBeGreaterThanOrEqual(
      3
    );
    expect(dataset.summary.occupancy.max).toBeGreaterThan(
      dataset.summary.occupancy.min
    );
    expect(dataset.summary.collections.Date_Ranges).toBeGreaterThan(0);
    expect(dataset.summary.collections.Bookings).toBeGreaterThan(0);
    expect(dataset.summary.collections.Payments).toBeGreaterThan(0);
  });

  it("detecta sobreocupación salvo habilitación explícita", () => {
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    const active = activeTouristsByDateRange(dataset);
    const target = dataset.collections.Date_Ranges.find(
      (dateRange) => (active.get(dateRange._id) ?? 0) > 1
    );

    expect(target).toBeDefined();
    target!.capacity = 1;

    const strictReport = validateSimulationDataset(dataset, {
      strictVariation: false,
    });
    expect(strictReport.passed).toBe(false);
    expect(
      strictReport.failed.some((check) => check.name === "capacidad respetada")
    ).toBe(true);

    const allowedReport = validateSimulationDataset(dataset, {
      strictVariation: false,
      allowOverCapacity: true,
    });
    expect(allowedReport.passed).toBe(true);
  });
});
