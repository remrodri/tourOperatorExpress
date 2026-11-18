import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  SIMULATION_COLLECTIONS,
  SIMULATION_DATABASE,
  SimulationCollectionName,
} from "../../src/database/simulation/simulationConfig";
import { validateFreshSimulationBackup } from "../../src/database/simulation/simulationBackup";

const HOUR_MILLISECONDS = 60 * 60 * 1000;

let temporaryDirectory: string;

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "t807-backup-"));
});

afterEach(() => {
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

const createBackupFiles = (
  collections: readonly SimulationCollectionName[] = SIMULATION_COLLECTIONS,
  database = SIMULATION_DATABASE
): void => {
  const databaseDirectory = join(temporaryDirectory, database);
  mkdirSync(databaseDirectory, { recursive: true });
  for (const collection of collections) {
    writeFileSync(join(databaseDirectory, `${collection}.bson`), "respaldo");
  }
};

describe("simulación T-807: validación del respaldo", () => {
  it("acepta un respaldo fresco con todas las colecciones", () => {
    createBackupFiles();
    const result = validateFreshSimulationBackup(temporaryDirectory);

    expect(result.valid).toBe(true);
    expect(result.files).toHaveLength(SIMULATION_COLLECTIONS.length);
    expect(result.files.every((file) => file.exists)).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rechaza un respaldo incompleto", () => {
    createBackupFiles(
      SIMULATION_COLLECTIONS.filter(
        (collection) => collection !== "Bookings"
      )
    );
    const result = validateFreshSimulationBackup(temporaryDirectory);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.includes("Bookings.bson"))
    ).toBe(true);
  });

  it("rechaza un respaldo con archivos vencidos", () => {
    createBackupFiles();
    const oldTimestamp = new Date(Date.now() - 48 * HOUR_MILLISECONDS);
    utimesSync(
      join(temporaryDirectory, SIMULATION_DATABASE, "Payments.bson"),
      oldTimestamp,
      oldTimestamp
    );

    const result = validateFreshSimulationBackup(temporaryDirectory);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.includes("más de 24 horas"))
    ).toBe(true);
  });

  it("rechaza la ausencia de ruta de respaldo", () => {
    const result = validateFreshSimulationBackup(undefined);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/--backup-path/);
  });

  it("rechaza un respaldo de otra base", () => {
    createBackupFiles(SIMULATION_COLLECTIONS, "OtraBase");
    const result = validateFreshSimulationBackup(temporaryDirectory);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
