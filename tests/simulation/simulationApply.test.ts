import mongoose from "mongoose";
import { BookingModel } from "../../src/modules/booking/model/BookingModel";
import { DateRangeModel } from "../../src/modules/dateRange/model/DateRangeModel";
import { PaymentModel } from "../../src/modules/payment/model/PaymentModel";
import { TouristModel } from "../../src/modules/tourist/model/TouristModel";
import { TourPackageModel } from "../../src/modules/tourPackage/model/TourPackageModel";
import {
  applySimulationPlan,
  buildApplyPlan,
  captureLegacySnapshot,
  countCollections,
  legacySnapshotsEqual,
  verifyPersistedDataset,
} from "../../src/database/simulation/simulationApply";
import { buildSimulationDataset } from "../../src/database/simulation/simulationPlan";
import { validateSimulationDataset } from "../../src/database/simulation/simulationValidation";
import {
  LEGACY_DATE_RANGE_IDS,
  insertLegacyDocuments,
  makeReferenceData,
  makeSmallConfig,
} from "./simulationFixtures";

const getSchemaPath = (schema: unknown, name: string): unknown =>
  (schema as { path: (pathName: string) => unknown }).path(name);

describe("simulación T-807: aplicación idempotente", () => {
  it("aplica una vez, preserva los legados y no duplica en la segunda pasada", async () => {
    await insertLegacyDocuments();
    const db = mongoose.connection.db!;
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    const validation = validateSimulationDataset(dataset, {
      strictVariation: false,
    });

    expect(validation.passed).toBe(true);

    const before = await countCollections(db);
    const legacyBefore = await captureLegacySnapshot(db);
    const plan = await buildApplyPlan(db, dataset);

    expect(plan.totals.conflicts).toBe(0);
    expect(plan.totals.extras).toBe(0);
    expect(plan.totals.expected).toBeGreaterThan(0);
    expect(plan.totals.inserts).toBe(plan.totals.expected);

    const result = await applySimulationPlan(db, plan);
    expect(result.totalInserted).toBe(plan.totals.expected);

    const after = await countCollections(db);
    const legacyAfter = await captureLegacySnapshot(db);

    expect(legacySnapshotsEqual(legacyBefore, legacyAfter)).toBe(true);
    expect(after.Date_Ranges.simulated).toBe(
      dataset.summary.collections.Date_Ranges
    );
    expect(after.Tour_Packages.simulated).toBe(
      dataset.summary.collections.Tour_Packages
    );
    expect(after.Tourists.simulated).toBe(
      dataset.summary.collections.Tourists
    );
    expect(after.Bookings.simulated).toBe(
      dataset.summary.collections.Bookings
    );
    expect(after.Payments.simulated).toBe(
      dataset.summary.collections.Payments
    );

    for (const collection of [
      "Date_Ranges",
      "Tour_Packages",
      "Tourists",
      "Bookings",
      "Payments",
    ] as const) {
      expect(after[collection].legacy).toBe(before[collection].legacy);
      expect(after[collection].total).toBe(
        before[collection].total + after[collection].simulated
      );
    }

    const secondPlan = await buildApplyPlan(db, dataset);
    expect(secondPlan.totals.inserts).toBe(0);
    expect(secondPlan.totals.conflicts).toBe(0);
    expect(secondPlan.totals.extras).toBe(0);
    expect(secondPlan.totals.unchanged).toBe(secondPlan.totals.expected);

    const verification = await verifyPersistedDataset(db, dataset);
    expect(verification.passed).toBe(true);
    expect(verification.issues).toEqual([]);
  });

  it("detecta un documento existente distinto y no aplica cambios", async () => {
    const db = mongoose.connection.db!;
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    const firstPlan = await buildApplyPlan(db, dataset);
    await applySimulationPlan(db, firstPlan);

    const target = dataset.collections.Date_Ranges[0];
    await db.collection("Date_Ranges").updateOne(
      { _id: new mongoose.Types.ObjectId(target._id) },
      { $set: { capacity: target.capacity + 1 } }
    );

    const conflictPlan = await buildApplyPlan(db, dataset);
    expect(conflictPlan.totals.conflicts).toBeGreaterThan(0);
    await expect(
      applySimulationPlan(db, conflictPlan)
    ).rejects.toThrow(/conflictos/);
  });

  it("detecta documentos simulados inesperados", async () => {
    const db = mongoose.connection.db!;
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    await applySimulationPlan(db, await buildApplyPlan(db, dataset));

    await db.collection("Payments").insertOne({
      _id: new mongoose.Types.ObjectId("999999999999999999999999"),
      amount: 1,
      paymentDate: "2025-01-01",
      paymentMethod: "cash",
      bookingId: "000000000000000000000000",
      paymentProofImage: "",
      sellerId: "000000000000000000000064",
      touristId: "0000000000000000000000c8",
      dataOrigin: "simulated",
      simulationId: dataset.simulationId,
      simulationVersion: dataset.config.version,
      simulationSeed: dataset.config.seed,
      simulationKey: "payment:extra",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    });

    const plan = await buildApplyPlan(db, dataset);
    expect(plan.totals.extras).toBeGreaterThan(0);
    await expect(applySimulationPlan(db, plan)).rejects.toThrow(/inesperados/);
  });

  it("conserva exactamente los seis Date_Ranges legados de T-806", async () => {
    await insertLegacyDocuments();
    const db = mongoose.connection.db!;
    const dataset = buildSimulationDataset(
      makeSmallConfig(),
      makeReferenceData()
    );
    await applySimulationPlan(db, await buildApplyPlan(db, dataset));

    const legacyDateRanges = await db
      .collection("Date_Ranges")
      .find({ dataOrigin: "legacy" })
      .toArray();

    expect(legacyDateRanges.map((document) => String(document._id)).sort()).toEqual(
      [...LEGACY_DATE_RANGE_IDS].sort()
    );
  });

  it("expone los campos de trazabilidad sin defaults en colecciones no Date_Ranges", () => {
    const models = [
      DateRangeModel,
      TourPackageModel,
      TouristModel,
      BookingModel,
      PaymentModel,
    ];

    for (const model of models) {
      expect(getSchemaPath(model.schema, "simulationId")).toBeDefined();
      expect(getSchemaPath(model.schema, "simulationVersion")).toBeDefined();
      expect(getSchemaPath(model.schema, "simulationSeed")).toBeDefined();
      expect(getSchemaPath(model.schema, "simulationKey")).toBeDefined();
      expect(getSchemaPath(model.schema, "dataOrigin")).toBeDefined();
    }

    for (const model of [
      TourPackageModel,
      TouristModel,
      BookingModel,
      PaymentModel,
    ]) {
      const path = getSchemaPath(model.schema, "dataOrigin") as {
        options: { default?: unknown };
      };
      expect(path.options.default).toBeUndefined();
    }
  });
});
