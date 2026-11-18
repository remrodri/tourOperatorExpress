import "dotenv/config";
import mongoose from "mongoose";
import { RoleModel } from "../../modules/role/model/roleModel";
import { TouristDestinationModel } from "../../modules/touristDestination/model/TouristDestinationModel";
import { TourTypeModel } from "../../modules/tourType/model/tourType/tourTypeModel";
import { UserModel } from "../../modules/user/model/userModel";
import {
  applySimulationPlan,
  captureLegacySnapshot,
  countCollections,
  legacySnapshotsEqual,
  verifyPersistedDataset,
  buildApplyPlan,
} from "./simulationApply";
import { validateFreshSimulationBackup } from "./simulationBackup";
import {
  DEFAULT_SIMULATION_CONFIG,
  SIMULATION_DATABASE,
  SimulationConfig,
  SimulationScenario,
} from "./simulationConfig";
import {
  SimulationReferenceData,
  buildSimulationDataset,
} from "./simulationPlan";
import { validateSimulationDataset } from "./simulationValidation";

const HELP = `
Uso:
  npm run simulate:data -- [opciones]

Por defecto el comando es un dry-run y no escribe en MongoDB.

Opciones:
  --apply                     Aplica las inserciones. Exige --backup-path fresco.
  --backup-path <ruta>        Carpeta base del respaldo de mongodump.
  --seed <entero>             Sobrescribe la semilla.
  --period-start <YYYY-MM-DD> Sobrescribe el inicio del periodo de salidas.
  --period-end <YYYY-MM-DD>   Sobrescribe el fin del periodo de salidas.
  --as-of <YYYY-MM-DD>        Sobrescribe el momento de corte.
  --scenario <nombre>         baseline | test-over-capacity
  --help                      Muestra esta ayuda.

Seguridad:
  - Solo opera sobre la base ${SIMULATION_DATABASE}.
  - No actualiza ni elimina documentos existentes.
  - No modifica los documentos legacy.
  - Se detiene ante conflictos, datos inesperados o validaciones fallidas.
`;

const args = process.argv.slice(2);
const apply = args.includes("--apply");

const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const parseSeed = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!/^-?\d+$/.test(value)) {
    throw new Error("--seed debe ser un entero");
  }
  const seed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(seed)) {
    throw new Error("--seed debe ser un entero seguro");
  }
  return seed;
};

const parseScenario = (
  value: string | undefined
): SimulationScenario | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (value === "baseline" || value === "test-over-capacity") {
    return value;
  }
  throw new Error("--scenario debe ser baseline o test-over-capacity");
};

const buildConfig = (): SimulationConfig => {
  const seed = parseSeed(getArg("--seed"));
  const scenario = parseScenario(getArg("--scenario"));

  return {
    ...DEFAULT_SIMULATION_CONFIG,
    ...(seed === undefined ? {} : { seed }),
    ...(scenario === undefined ? {} : { scenario }),
    periodStart:
      getArg("--period-start") ?? DEFAULT_SIMULATION_CONFIG.periodStart,
    periodEnd: getArg("--period-end") ?? DEFAULT_SIMULATION_CONFIG.periodEnd,
    asOf: getArg("--as-of") ?? DEFAULT_SIMULATION_CONFIG.asOf,
  };
};

const loadReferenceData = async (): Promise<SimulationReferenceData> => {
  const destinationDocuments = (await TouristDestinationModel.find({
    deleted: { $ne: true },
  })
    .select("_id name")
    .lean()
    .exec()) as unknown as Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
  }>;

  const tourTypeDocuments = (await TourTypeModel.find({
    deleted: { $ne: true },
  })
    .select("_id name")
    .lean()
    .exec()) as unknown as Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
  }>;

  const roleDocuments = (await RoleModel.find({
    name: {
      $in: [
        "administrador",
        "operador de ventas",
        "guia de turismo",
      ],
    },
  })
    .select("_id name")
    .lean()
    .exec()) as unknown as Array<{
    _id: mongoose.Types.ObjectId;
    name: string;
  }>;

  const sellerRoleIds = roleDocuments
    .filter(
      (role) =>
        role.name === "administrador" || role.name === "operador de ventas"
    )
    .map((role) => role._id);
  const guideRoleIds = roleDocuments
    .filter((role) => role.name === "guia de turismo")
    .map((role) => role._id);

  if (sellerRoleIds.length === 0) {
    throw new Error(
      "No existen roles de venta (administrador u operador de ventas)"
    );
  }

  const sellerDocuments = (await UserModel.find({
    deleted: { $ne: true },
    role: { $in: sellerRoleIds },
  })
    .select("_id")
    .lean()
    .exec()) as unknown as Array<{ _id: mongoose.Types.ObjectId }>;

  const guideDocuments = (await UserModel.find({
    deleted: { $ne: true },
    role: { $in: guideRoleIds },
  })
    .select("_id")
    .lean()
    .exec()) as unknown as Array<{ _id: mongoose.Types.ObjectId }>;

  return {
    destinations: destinationDocuments
      .map((destination) => ({
        id: destination._id.toString(),
        name: destination.name,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    tourTypes: tourTypeDocuments
      .map((tourType) => ({
        id: tourType._id.toString(),
        name: tourType.name,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    sellers: sellerDocuments
      .map((seller) => ({ id: seller._id.toString() }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    guides: guideDocuments
      .map((guide) => ({ id: guide._id.toString() }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };
};

const run = async (): Promise<void> => {
  if (args.includes("--help")) {
    console.log(HELP.trim());
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI es obligatorio para ejecutar la simulación");
  }

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("No se pudo obtener la conexión de MongoDB");
  }

  const databaseName = db.databaseName;
  if (databaseName !== SIMULATION_DATABASE) {
    throw new Error(
      `Base rechazada: se esperaba ${SIMULATION_DATABASE} y se recibió ${databaseName}`
    );
  }

  const config = buildConfig();
  const referenceData = await loadReferenceData();
  const dataset = buildSimulationDataset(config, referenceData);
  const validation = validateSimulationDataset(dataset);

  const countsBefore = await countCollections(db);
  const legacyBefore = await captureLegacySnapshot(db);
  const plan = await buildApplyPlan(db, dataset);

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        database: databaseName,
        simulation: {
          id: dataset.simulationId,
          version: dataset.config.version,
          seed: dataset.config.seed,
          scenario: dataset.config.scenario,
          periodStart: dataset.config.periodStart,
          periodEnd: dataset.config.periodEnd,
          asOf: dataset.config.asOf,
          datasetHash: dataset.datasetHash,
        },
        referenceData: {
          destinations: dataset.referenceData.destinations.length,
          tourTypes: dataset.referenceData.tourTypes.length,
          sellers: dataset.referenceData.sellers.length,
          guides: dataset.referenceData.guides.length,
        },
        expected: dataset.summary,
        countsBefore,
        plan: {
          totals: plan.totals,
          collections: plan.collections,
        },
        validation: {
          passed: validation.passed,
          failed: validation.failed,
          checks: validation.checks,
        },
        legacyBefore,
        warnings: dataset.warnings,
      },
      null,
      2
    )
  );

  if (!validation.passed) {
    throw new Error(
      "La validación del conjunto simulado falló; no se aplicó nada"
    );
  }

  if (plan.totals.conflicts > 0 || plan.totals.extras > 0) {
    throw new Error(
      "El plan contiene conflictos o documentos inesperados; no se aplicó nada"
    );
  }

  if (!apply) {
    return;
  }

  const backup = validateFreshSimulationBackup(getArg("--backup-path"));
  console.log(
    JSON.stringify(
      {
        mode: "backup",
        backup,
      },
      null,
      2
    )
  );

  if (!backup.valid) {
    throw new Error("El respaldo no es válido; no se aplicó nada");
  }

  const applyResult = await applySimulationPlan(db, plan);
  const countsAfter = await countCollections(db);
  const legacyAfter = await captureLegacySnapshot(db);
  const verification = await verifyPersistedDataset(db, dataset);
  const legacyPreserved = legacySnapshotsEqual(legacyBefore, legacyAfter);

  console.log(
    JSON.stringify(
      {
        mode: "apply",
        simulationId: dataset.simulationId,
        datasetHash: dataset.datasetHash,
        backup: {
          valid: backup.valid,
          path: backup.path,
          database: backup.database,
          maxAgeHours: backup.maxAgeHours,
        },
        inserted: applyResult.inserted,
        totalInserted: applyResult.totalInserted,
        countsAfter,
        legacyAfter,
        legacyPreserved,
        verification: {
          passed: verification.passed,
          issues: verification.issues,
          totals: verification.plan.totals,
        },
      },
      null,
      2
    )
  );

  if (!verification.passed) {
    throw new Error(
      "La verificación posterior no confirmó el conjunto simulado"
    );
  }

  if (!legacyPreserved) {
    throw new Error(
      "La verificación detectó cambios en documentos no simulados"
    );
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
