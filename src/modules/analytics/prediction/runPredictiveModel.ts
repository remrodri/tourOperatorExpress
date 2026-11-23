import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { buildPredictiveDataset } from "../dataset/PredictiveDatasetBuilder";
import { loadPredictiveDatasetInputs } from "../dataset/PredictiveDatasetRepository";
import { evaluatePredictiveModels } from "./PredictiveModelEvaluator";

const EXPECTED_DATABASE = "tourOperatorAPIDB";
const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const HELP = `
Uso:
  npm run model:predictive -- [--output <ruta>] [--generated-at <ISO-8601>] [--help]

Entrena y evalúa T-813 con el dataset T-812 generado en memoria. Solo lee MongoDB,
no expone PII y no publica predicciones por API.
`;

const run = async (): Promise<void> => {
  if (args.includes("--help")) {
    console.log(HELP.trim());
    return;
  }
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI es obligatorio");
  const generatedAtValue = getArg("--generated-at");
  const generatedAt = generatedAtValue === undefined ? new Date() : new Date(generatedAtValue);
  if (Number.isNaN(generatedAt.getTime())) throw new Error("--generated-at debe ser ISO-8601 válido");

  await mongoose.connect(mongoUri);
  const database = mongoose.connection.db;
  if (!database || database.databaseName !== EXPECTED_DATABASE) {
    throw new Error(`Solo se permite la base ${EXPECTED_DATABASE}`);
  }
  const inputs = await loadPredictiveDatasetInputs();
  const dataset = buildPredictiveDataset({ ...inputs, generatedAt });
  const result = evaluatePredictiveModels({
    records: dataset.records,
    datasetVersion: dataset.datasetVersion,
    datasetHash: dataset.datasetHash,
    generatedAt,
  });
  const output = getArg("--output");
  if (output) await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    mode: "evaluate",
    database: database.databaseName,
    modelVersion: result.modelVersion,
    datasetVersion: result.datasetVersion,
    datasetHash: result.datasetHash,
    runHash: result.runHash,
    horizons: result.horizons.map(({ horizonDays, samples, baselines, selected, recommendation }) => ({
      horizonDays,
      samples,
      baselines,
      selected: {
        model: selected.model,
        configuration: selected.configuration,
        validation: selected.validation,
        test: selected.test,
        improvementVsAccumulatedPct: selected.improvementVsAccumulatedPct,
        improvementVsHistoricalRemainingPct: selected.improvementVsHistoricalRemainingPct,
        stableImprovement: selected.stableImprovement,
      },
      recommendation,
    })),
    warnings: result.warnings,
    ...(output ? { outputPath: path.resolve(output) } : {}),
  }, null, 2));
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());

