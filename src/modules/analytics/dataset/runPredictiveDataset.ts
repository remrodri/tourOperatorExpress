import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { buildPredictiveDataset } from "./PredictiveDatasetBuilder";
import { loadPredictiveDatasetInputs } from "./PredictiveDatasetRepository";

const EXPECTED_DATABASE = "tourOperatorAPIDB";

const HELP = `
Uso:
  npm run dataset:predictive -- [opciones]

Opciones:
  --output <ruta>             Escribe el dataset completo en JSON.
  --departure-id <ObjectId>   Incluye las filas de una salida en la salida estándar.
  --generated-at <ISO-8601>   Fija generatedAt para comparar ejecuciones.
  --help                      Muestra esta ayuda.

Seguridad:
  - Solo lee la base ${EXPECTED_DATABASE}.
  - No escribe en MongoDB.
  - No incluye datos personales.
`;

const args = process.argv.slice(2);

const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const parseGeneratedAt = (value: string | undefined): Date | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("--generated-at debe ser una fecha ISO-8601 válida");
  }

  return date;
};

const run = async (): Promise<void> => {
  if (args.includes("--help")) {
    console.log(HELP.trim());
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI es obligatorio para generar el dataset");
  }

  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("No se pudo obtener la conexión de MongoDB");
  }

  if (db.databaseName !== EXPECTED_DATABASE) {
    throw new Error(
      `Base rechazada: se esperaba ${EXPECTED_DATABASE} y se recibió ${db.databaseName}`,
    );
  }

  const inputs = await loadPredictiveDatasetInputs();
  const dataset = buildPredictiveDataset({
    ...inputs,
    generatedAt: parseGeneratedAt(getArg("--generated-at")),
  });

  const outputPath = getArg("--output");
  if (outputPath !== undefined) {
    await writeFile(
      outputPath,
      `${JSON.stringify(dataset, null, 2)}\n`,
      "utf8",
    );
  }

  const departureId = getArg("--departure-id");
  const sample =
    departureId === undefined
      ? undefined
      : dataset.records.filter(
          (record) => record.departureId === departureId,
        );

  console.log(
    JSON.stringify(
      {
        mode: "generate",
        database: db.databaseName,
        datasetVersion: dataset.datasetVersion,
        generatedAt: dataset.generatedAt,
        asOf: dataset.asOf,
        datasetHash: dataset.datasetHash,
        source: dataset.source,
        summary: dataset.summary,
        warnings: dataset.warnings,
        ...(outputPath === undefined
          ? {}
          : { outputPath: path.resolve(outputPath) }),
        ...(sample === undefined ? {} : { sample }),
      },
      null,
      2,
    ),
  );
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
