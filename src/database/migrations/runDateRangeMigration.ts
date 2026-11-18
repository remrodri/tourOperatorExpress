import "dotenv/config";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import { DateRangeModel } from "../../modules/dateRange/model/DateRangeModel";
import {
  buildDateRangeMigrationPlan,
  DateRangeMigrationDocument,
} from "./dateRangeMigration";
import {
  EXPECTED_DATE_RANGE_COUNT,
  EXPECTED_MIGRATION_DATABASE,
  LEGACY_DATE_RANGE_CAPACITIES,
} from "./dateRangeMigrationConfig";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const backupPathIndex = args.indexOf("--backup-path");
const backupPath = backupPathIndex >= 0 ? args[backupPathIndex + 1] : undefined;

const assertFreshBackup = (pathValue: string | undefined): void => {
  if (!pathValue) {
    throw new Error("--apply exige --backup-path con un respaldo fresco");
  }

  const bsonPath = resolve(pathValue, EXPECTED_MIGRATION_DATABASE, "Date_Ranges.bson");
  if (!existsSync(bsonPath)) {
    throw new Error(`El respaldo no contiene ${EXPECTED_MIGRATION_DATABASE}/Date_Ranges.bson`);
  }

  const ageMs = Date.now() - statSync(bsonPath).mtimeMs;
  if (ageMs > 24 * 60 * 60 * 1000) {
    throw new Error("El respaldo de Date_Ranges tiene más de 24 horas");
  }
};

const run = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI es obligatorio para ejecutar la migración");
  }

  await mongoose.connect(mongoUri);

  const databaseName = mongoose.connection.db?.databaseName;
  if (databaseName !== EXPECTED_MIGRATION_DATABASE) {
    throw new Error(
      `Base rechazada: se esperaba ${EXPECTED_MIGRATION_DATABASE} y se recibió ${databaseName ?? "desconocida"}`
    );
  }

  const documents = (await DateRangeModel.collection
    .find({}, { projection: { _id: 1, dates: 1, startDate: 1, endDate: 1, capacity: 1, dataOrigin: 1 } })
    .toArray()) as unknown as DateRangeMigrationDocument[];

  const plan = buildDateRangeMigrationPlan(documents, LEGACY_DATE_RANGE_CAPACITIES);
  const report = {
    mode: apply ? "apply" : "dry-run",
    database: databaseName,
    before: {
      total: plan.total,
      normalized: plan.unchanged.length,
      pending: plan.updates.length,
      invalid: plan.issues.length,
    },
    updateIds: plan.updates.map((update) => update.id),
    unchangedIds: plan.unchanged,
    issues: plan.issues,
  };

  console.log(JSON.stringify(report, null, 2));

  if (plan.total !== EXPECTED_DATE_RANGE_COUNT) {
    throw new Error(
      `Conteo inesperado: se esperaban ${EXPECTED_DATE_RANGE_COUNT} documentos y existen ${plan.total}`
    );
  }

  if (plan.issues.length > 0) {
    throw new Error("La migración se detuvo porque existen documentos inválidos o inesperados");
  }

  if (!apply) {
    return;
  }

  assertFreshBackup(backupPath);

  if (plan.updates.length > 0) {
    await DateRangeModel.collection.bulkWrite(
      plan.updates.map((update) => ({
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(update.id),
            startDate: { $exists: false },
            endDate: { $exists: false },
            capacity: { $exists: false },
            dataOrigin: { $exists: false },
          },
          update: {
            $set: {
              startDate: update.startDate,
              endDate: update.endDate,
              capacity: update.capacity,
              dataOrigin: update.dataOrigin,
            },
          },
        },
      }))
    );
  }

  const afterDocuments = (await DateRangeModel.collection
    .find({}, { projection: { _id: 1, dates: 1, startDate: 1, endDate: 1, capacity: 1, dataOrigin: 1 } })
    .toArray()) as unknown as DateRangeMigrationDocument[];
  const afterPlan = buildDateRangeMigrationPlan(
    afterDocuments,
    LEGACY_DATE_RANGE_CAPACITIES
  );

  console.log(
    JSON.stringify(
      {
        mode: "verification",
        after: {
          total: afterPlan.total,
          normalized: afterPlan.unchanged.length,
          pending: afterPlan.updates.length,
          invalid: afterPlan.issues.length,
        },
      },
      null,
      2
    )
  );

  if (afterPlan.updates.length > 0 || afterPlan.issues.length > 0) {
    throw new Error("La verificación posterior no confirmó la migración completa");
  }
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
