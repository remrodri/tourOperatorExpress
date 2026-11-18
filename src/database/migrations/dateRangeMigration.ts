import { resolveDateRangeBounds } from "../../modules/dateRange/domain/dateRangeNormalization";

export interface DateRangeMigrationDocument {
  _id: { toString(): string } | string;
  dates?: string[];
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
  dataOrigin?: string;
}

export interface DateRangeMigrationUpdate {
  id: string;
  startDate: Date;
  endDate: Date;
  capacity: number;
  dataOrigin: "legacy";
}

export interface DateRangeMigrationIssue {
  id: string;
  reason: string;
}

export interface DateRangeMigrationPlan {
  total: number;
  updates: DateRangeMigrationUpdate[];
  unchanged: string[];
  issues: DateRangeMigrationIssue[];
}

const sameInstant = (left: Date | undefined, right: Date): boolean =>
  left instanceof Date && !Number.isNaN(left.getTime()) && left.getTime() === right.getTime();

const hasNormalizedFields = (document: DateRangeMigrationDocument): boolean =>
  document.startDate !== undefined ||
  document.endDate !== undefined ||
  document.capacity !== undefined ||
  document.dataOrigin !== undefined;

export const buildDateRangeMigrationPlan = (
  documents: DateRangeMigrationDocument[],
  capacities: Readonly<Record<string, number>>
): DateRangeMigrationPlan => {
  const updates: DateRangeMigrationUpdate[] = [];
  const unchanged: string[] = [];
  const issues: DateRangeMigrationIssue[] = [];
  const documentIds = new Set(documents.map((document) => document._id.toString()));

  for (const configuredId of Object.keys(capacities)) {
    if (!documentIds.has(configuredId)) {
      issues.push({ id: configuredId, reason: "ID configurado ausente en la colección" });
    }
  }

  for (const document of documents) {
    const id = document._id.toString();
    const capacity = capacities[id];

    if (!Number.isInteger(capacity) || capacity <= 0) {
      issues.push({ id, reason: "Capacidad explícita ausente o inválida" });
      continue;
    }

    let bounds;
    try {
      bounds = resolveDateRangeBounds({ dates: document.dates });
    } catch (error) {
      issues.push({
        id,
        reason: error instanceof Error ? error.message : "Fechas legadas inválidas",
      });
      continue;
    }

    const matchesExpected =
      sameInstant(document.startDate, bounds.startDate) &&
      sameInstant(document.endDate, bounds.endDate) &&
      document.capacity === capacity &&
      document.dataOrigin === "legacy";

    if (matchesExpected) {
      unchanged.push(id);
      continue;
    }

    if (hasNormalizedFields(document)) {
      issues.push({
        id,
        reason: "Campos normalizados existentes no coinciden con la configuración",
      });
      continue;
    }

    updates.push({
      id,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
      capacity,
      dataOrigin: "legacy",
    });
  }

  return { total: documents.length, updates, unchanged, issues };
};
