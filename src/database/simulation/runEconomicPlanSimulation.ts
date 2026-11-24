import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { DateRangeModel } from "../../modules/dateRange/model/DateRangeModel";
import { TourPackageModel } from "../../modules/tourPackage/model/TourPackageModel";
import { buildSimulatedEconomicPlan, ECONOMIC_SIMULATION_VERSION, economicPlanHash } from "./economicPlanSimulation";
import { evaluateEconomicPlan, type EconomicPlan } from "../../modules/dateRange/domain/economicPlanning";
import { SIMULATION_DATABASE } from "./simulationConfig";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const run = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI es obligatorio");
  await mongoose.connect(mongoUri);
  if (mongoose.connection.db?.databaseName !== SIMULATION_DATABASE) {
    throw new Error(`Solo se permite la base ${SIMULATION_DATABASE}`);
  }
  const seed = getArg("--seed") ?? "tour-operator-economic-2026";
  const departures = await DateRangeModel.find({ dataOrigin: "simulated" }).lean().exec();
  const packageIds = [...new Set(departures.map((item) => item.tourPackageId?.toString()).filter(Boolean))];
  const packages = await TourPackageModel.find({ _id: { $in: packageIds } }).select("price duration").lean().exec();
  const packageMap = new Map(packages.map((item) => [item._id.toString(), item]));
  const skippedExisting = departures.filter((item) => Boolean(item.economicPlan)).length;
  const storedPlans = departures
    .filter((item) => Boolean(item.economicPlan))
    .map((item) => ({ id: item._id.toString(), plan: item.economicPlan as unknown as EconomicPlan, capacity: Number(item.capacity) }));
  const invalidStored = storedPlans.filter(({ plan, capacity }) =>
    plan.source !== "simulated" ||
    !(new Date(plan.planningStartedAt) < new Date(plan.decisionDeadline)) ||
    evaluateEconomicPlan(plan, capacity).status !== "available"
  );
  const eligible = departures.filter((item) => !item.economicPlan && item.startDate && item.capacity);
  const skippedInvalid = departures.length - skippedExisting - eligible.length;
  const planned = eligible.map((item) => {
    const tourPackage = packageMap.get(item.tourPackageId?.toString() ?? "");
    return {
      id: item._id.toString(),
      plan: buildSimulatedEconomicPlan({
        id: item._id.toString(),
        startDate: new Date(item.startDate as Date),
        endDate: item.endDate ? new Date(item.endDate as Date) : undefined,
        capacity: Number(item.capacity),
        packagePrice: tourPackage?.price,
        packageDuration: tourPackage?.duration,
      }, seed),
    };
  });
  const summary = {
    mode: apply ? "apply" : "dry-run",
    version: ECONOMIC_SIMULATION_VERSION,
    seed,
    simulatedDepartures: departures.length,
    planned: planned.length,
    skippedExisting,
    skippedInvalid,
    planHash: economicPlanHash(planned),
    storedPlans: storedPlans.length,
    invalidStored: invalidStored.length,
    storedPlanHash: economicPlanHash(storedPlans),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (invalidStored.length > 0) {
    throw new Error(`Se encontraron ${invalidStored.length} planes económicos persistidos inválidos`);
  }
  if (!apply || planned.length === 0) return;
  const backupRoot = getArg("--backup-path");
  if (!backupRoot) throw new Error("--backup-path es obligatorio con --apply");
  await mkdir(backupRoot, { recursive: true });
  const backupPath = path.join(backupRoot, `economic-plans-before-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(backupPath, JSON.stringify(eligible, null, 2), "utf8");
  const result = await DateRangeModel.bulkWrite(planned.map(({ id, plan }) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(id), dataOrigin: "simulated", economicPlan: { $exists: false } },
      update: { $set: { economicPlan: plan } },
    },
  })));
  const remaining = await DateRangeModel.countDocuments({ dataOrigin: "simulated", economicPlan: { $exists: false }, startDate: { $exists: true }, capacity: { $exists: true } });
  console.log(JSON.stringify({ mode: "verification", backupPath, modified: result.modifiedCount, remaining }, null, 2));
  if (remaining !== 0) throw new Error("Persisten salidas simuladas elegibles sin plan económico");
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => mongoose.disconnect());
