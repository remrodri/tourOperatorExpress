import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { TouristModel } from "../../modules/tourist/model/TouristModel";
import { buildRealisticTouristIdentity } from "./touristIdentityProfile";
import { SIMULATION_DATABASE } from "./simulationConfig";
import { stableStringify } from "./simulationRandom";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const hash = (value: unknown): string =>
  createHash("sha256").update(stableStringify(value)).digest("hex");

const run = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI es obligatorio");
  await mongoose.connect(mongoUri);
  if (mongoose.connection.db?.databaseName !== SIMULATION_DATABASE) {
    throw new Error(`Solo se permite la base ${SIMULATION_DATABASE}`);
  }

  const tourists = await TouristModel.find({ dataOrigin: "simulated" })
    .sort({ _id: 1 })
    .lean()
    .exec();
  const beforeRelations = tourists.map((tourist) => ({
    id: tourist._id.toString(),
    bookingIds: tourist.bookingIds,
    simulationId: tourist.simulationId,
    simulationKey: tourist.simulationKey,
  }));
  const changes = tourists.flatMap((tourist) => {
    const id = tourist._id.toString();
    const identity = buildRealisticTouristIdentity(id);
    const current = {
      firstName: tourist.firstName,
      lastName: tourist.lastName,
      phone: tourist.phone,
      email: tourist.email,
      nationality: tourist.nationality,
      documentType: tourist.documentType,
      ci: tourist.ci ?? "",
      passportNumber: tourist.passportNumber ?? "",
      dateOfBirth: tourist.dateOfBirth,
    };
    return stableStringify(current) === stableStringify(identity)
      ? []
      : [{ id, before: current, after: identity }];
  });

  const report = {
    mode: apply ? "apply" : "dry-run",
    database: SIMULATION_DATABASE,
    profileVersion: "tourist-identity-v1",
    matched: tourists.length,
    changed: changes.length,
    unchanged: tourists.length - changes.length,
    relationHashBefore: hash(beforeRelations),
  };
  console.log(JSON.stringify(report, null, 2));
  if (!apply || changes.length === 0) return;

  const backupRoot = getArg("--backup-path");
  if (!backupRoot) throw new Error("--backup-path es obligatorio con --apply");
  await mkdir(backupRoot, { recursive: true });
  const backupPath = path.join(
    backupRoot,
    `tourists-before-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  await writeFile(
    backupPath,
    JSON.stringify({ profileVersion: "tourist-identity-v1", tourists: changes }, null, 2),
    "utf8",
  );

  await TouristModel.bulkWrite(
    changes.map((change) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(change.id), dataOrigin: "simulated" },
        update: { $set: change.after },
      },
    })),
  );

  const after = await TouristModel.find({ dataOrigin: "simulated" })
    .sort({ _id: 1 })
    .lean()
    .exec();
  const afterRelations = after.map((tourist) => ({
    id: tourist._id.toString(),
    bookingIds: tourist.bookingIds,
    simulationId: tourist.simulationId,
    simulationKey: tourist.simulationKey,
  }));
  const remaining = after.filter((tourist) => {
    const identity = buildRealisticTouristIdentity(tourist._id.toString());
    return Object.entries(identity).some(([key, value]) =>
      String((tourist as unknown as Record<string, unknown>)[key] ?? "") !== String(value),
    );
  }).length;
  const relationHashAfter = hash(afterRelations);

  console.log(JSON.stringify({
    mode: "verification",
    backupPath,
    matched: after.length,
    updated: changes.length,
    remaining,
    relationHashAfter,
    relationsPreserved: report.relationHashBefore === relationHashAfter,
  }, null, 2));

  if (remaining !== 0 || report.relationHashBefore !== relationHashAfter) {
    throw new Error("La verificación posterior falló");
  }
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
