import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  SIMULATION_COLLECTIONS,
  SIMULATION_DATABASE,
} from "./simulationConfig";

export interface BackupFileCheck {
  collection: string;
  path: string;
  exists: boolean;
  ageHours: number | null;
  size: number | null;
}

export interface BackupValidation {
  valid: boolean;
  path: string | null;
  database: string;
  maxAgeHours: number;
  files: BackupFileCheck[];
  errors: string[];
}

export const validateFreshSimulationBackup = (
  backupPath: string | undefined,
  database = SIMULATION_DATABASE,
  maxAgeHours = 24
): BackupValidation => {
  const errors: string[] = [];
  const files: BackupFileCheck[] = [];

  if (!backupPath) {
    return {
      valid: false,
      path: null,
      database,
      maxAgeHours,
      files,
      errors: ["--apply exige --backup-path con un respaldo fresco"],
    };
  }

  for (const collection of SIMULATION_COLLECTIONS) {
    const filePath = resolve(backupPath, database, `${collection}.bson`);
    if (!existsSync(filePath)) {
      errors.push(`El respaldo no contiene ${database}/${collection}.bson`);
      files.push({
        collection,
        path: filePath,
        exists: false,
        ageHours: null,
        size: null,
      });
      continue;
    }

    const stats = statSync(filePath);
    const ageHours = (Date.now() - stats.mtimeMs) / (60 * 60 * 1000);
    if (ageHours > maxAgeHours) {
      errors.push(
        `El respaldo de ${collection} tiene más de ${maxAgeHours} horas`
      );
    }

    files.push({
      collection,
      path: filePath,
      exists: true,
      ageHours,
      size: stats.size,
    });
  }

  return {
    valid: errors.length === 0,
    path: resolve(backupPath),
    database,
    maxAgeHours,
    files,
    errors,
  };
};
