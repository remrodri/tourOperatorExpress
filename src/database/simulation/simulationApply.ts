import type { Db } from "mongodb";
import mongoose from "mongoose";
import {
  SIMULATION_COLLECTIONS,
  SimulationCollectionName,
} from "./simulationConfig";
import {
  SimulationBookingDoc,
  SimulationDataset,
  SimulationDateRangeDoc,
  SimulationPaymentDoc,
  SimulationTouristDoc,
  SimulationTourPackageDoc,
} from "./simulationPlan";
import { sha256Hex, stableStringify } from "./simulationRandom";

type GenericDocument = Record<string, unknown> & {
  _id: string;
  simulationKey: string;
};

export interface ApplyConflict {
  id: string;
  simulationKey: string;
  reason: string;
  existingId?: string;
}

export interface ApplyPlanCollectionSummary {
  expected: number;
  inserts: number;
  unchanged: number;
  conflicts: ApplyConflict[];
  extras: string[];
}

export interface SimulationApplyPlan {
  simulationId: string;
  collections: Record<SimulationCollectionName, ApplyPlanCollectionSummary>;
  inserts: Record<SimulationCollectionName, Record<string, unknown>[]>;
  totals: {
    expected: number;
    inserts: number;
    unchanged: number;
    conflicts: number;
    extras: number;
  };
}

export interface CollectionCount {
  total: number;
  simulated: number;
  legacy: number;
}

export interface LegacyCollectionSnapshot {
  count: number;
  hash: string;
}

export interface LegacySnapshot {
  collections: Record<SimulationCollectionName, LegacyCollectionSnapshot>;
}

export interface SimulationApplyResult {
  inserted: Record<SimulationCollectionName, number>;
  totalInserted: number;
}

export interface PersistedVerification {
  passed: boolean;
  issues: string[];
  plan: SimulationApplyPlan;
}

const normalizeMongoValue = (value: unknown): unknown => {
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toHexString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeMongoValue);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      if (key === "__v") {
        continue;
      }
      result[key] = normalizeMongoValue(record[key]);
    }
    return result;
  }
  return value;
};

const toObjectId = (value: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(value);

const toDate = (value: string | null): Date | null =>
  value === null ? null : new Date(value);

const toMongoDocument = (
  collection: SimulationCollectionName,
  document: Record<string, unknown>
): Record<string, unknown> => {
  switch (collection) {
    case "Date_Ranges": {
      const doc = document as unknown as SimulationDateRangeDoc;
      return {
        _id: toObjectId(doc._id),
        dates: doc.dates,
        startDate: new Date(doc.startDate),
        endDate: new Date(doc.endDate),
        capacity: doc.capacity,
        dataOrigin: doc.dataOrigin,
        simulationId: doc.simulationId,
        simulationVersion: doc.simulationVersion,
        simulationSeed: doc.simulationSeed,
        simulationKey: doc.simulationKey,
        state: doc.state,
        guides: doc.guides.map(toObjectId),
        tourPackageId: toObjectId(doc.tourPackageId),
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }
    case "Tour_Packages": {
      const doc = document as unknown as SimulationTourPackageDoc;
      return {
        _id: toObjectId(doc._id),
        name: doc.name,
        tourType: toObjectId(doc.tourType),
        touristDestination: toObjectId(doc.touristDestination),
        duration: doc.duration,
        dateRanges: doc.dateRanges.map(toObjectId),
        price: doc.price,
        itinerary: doc.itinerary,
        status: doc.status,
        deleted: doc.deleted,
        dataOrigin: doc.dataOrigin,
        simulationId: doc.simulationId,
        simulationVersion: doc.simulationVersion,
        simulationSeed: doc.simulationSeed,
        simulationKey: doc.simulationKey,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }
    case "Tourists": {
      const doc = document as unknown as SimulationTouristDoc;
      return {
        _id: toObjectId(doc._id),
        firstName: doc.firstName,
        lastName: doc.lastName,
        phone: doc.phone,
        email: doc.email,
        nationality: doc.nationality,
        documentType: doc.documentType,
        ci: doc.ci,
        passportNumber: doc.passportNumber,
        dateOfBirth: doc.dateOfBirth,
        bookingIds: doc.bookingIds,
        dataOrigin: doc.dataOrigin,
        simulationId: doc.simulationId,
        simulationVersion: doc.simulationVersion,
        simulationSeed: doc.simulationSeed,
        simulationKey: doc.simulationKey,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }
    case "Bookings": {
      const doc = document as unknown as SimulationBookingDoc;
      return {
        _id: toObjectId(doc._id),
        touristsIds: doc.touristsIds.map(toObjectId),
        dateRangeId: toObjectId(doc.dateRangeId),
        notes: doc.notes,
        paymentIds: doc.paymentIds.map(toObjectId),
        sellerId: toObjectId(doc.sellerId),
        status: doc.status,
        totalPrice: doc.totalPrice,
        tourPackageId: toObjectId(doc.tourPackageId),
        paymentProofFolder: doc.paymentProofFolder,
        attendance: doc.attendance.map((entry) => ({
          touristId: toObjectId(entry.touristId),
          status: entry.status,
        })),
        cancellationFee: doc.cancellationFee,
        refundAmount: doc.refundAmount,
        refundedAt: toDate(doc.refundedAt),
        bookingCode: doc.bookingCode,
        dataOrigin: doc.dataOrigin,
        simulationId: doc.simulationId,
        simulationVersion: doc.simulationVersion,
        simulationSeed: doc.simulationSeed,
        simulationKey: doc.simulationKey,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }
    case "Payments": {
      const doc = document as unknown as SimulationPaymentDoc;
      return {
        _id: toObjectId(doc._id),
        amount: doc.amount,
        paymentDate: doc.paymentDate,
        paymentMethod: doc.paymentMethod,
        bookingId: doc.bookingId,
        paymentProofImage: doc.paymentProofImage,
        sellerId: doc.sellerId,
        touristId: doc.touristId,
        dataOrigin: doc.dataOrigin,
        simulationId: doc.simulationId,
        simulationVersion: doc.simulationVersion,
        simulationSeed: doc.simulationSeed,
        simulationKey: doc.simulationKey,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      };
    }
  }
};

export const buildApplyPlan = async (
  db: Db,
  dataset: SimulationDataset
): Promise<SimulationApplyPlan> => {
  const collections = {} as Record<
    SimulationCollectionName,
    ApplyPlanCollectionSummary
  >;
  const inserts = {} as Record<
    SimulationCollectionName,
    Record<string, unknown>[]
  >;
  const totals = {
    expected: 0,
    inserts: 0,
    unchanged: 0,
    conflicts: 0,
    extras: 0,
  };

  for (const collectionName of SIMULATION_COLLECTIONS) {
    const expectedDocuments = dataset.collections[
      collectionName
    ] as unknown as GenericDocument[];
    const collection = db.collection(collectionName);
    const expectedIds = expectedDocuments.map((document) =>
      toObjectId(document._id)
    );

    const existingByIdDocuments =
      expectedIds.length > 0
        ? await collection.find({ _id: { $in: expectedIds } }).toArray()
        : [];
    const existingBySimulationDocuments = await collection
      .find({ simulationId: dataset.simulationId })
      .toArray();

    const existingById = new Map(
      existingByIdDocuments.map((document) => [
        String(document._id),
        document as unknown as Record<string, unknown>,
      ])
    );
    const existingByKey = new Map<string, Record<string, unknown>>();
    for (const document of existingBySimulationDocuments) {
      const simulationKey = document.simulationKey;
      if (typeof simulationKey === "string" && simulationKey.length > 0) {
        existingByKey.set(
          simulationKey,
          document as unknown as Record<string, unknown>
        );
      }
    }

    const expectedIdSet = new Set(
      expectedDocuments.map((document) => document._id)
    );
    const collectionSummary: ApplyPlanCollectionSummary = {
      expected: expectedDocuments.length,
      inserts: 0,
      unchanged: 0,
      conflicts: [],
      extras: [],
    };
    const documentsToInsert: Record<string, unknown>[] = [];

    for (const expectedDocument of expectedDocuments) {
      const existing = existingById.get(expectedDocument._id);
      if (existing) {
        const expectedCanonical = stableStringify(
          normalizeMongoValue(expectedDocument)
        );
        const existingCanonical = stableStringify(
          normalizeMongoValue(existing)
        );

        if (expectedCanonical === existingCanonical) {
          collectionSummary.unchanged += 1;
        } else {
          collectionSummary.conflicts.push({
            id: expectedDocument._id,
            simulationKey: expectedDocument.simulationKey,
            reason: "Documento existente distinto del esperado",
          });
        }
        continue;
      }

      const duplicateKeyDocument = existingByKey.get(
        expectedDocument.simulationKey
      );
      if (duplicateKeyDocument) {
        collectionSummary.conflicts.push({
          id: expectedDocument._id,
          simulationKey: expectedDocument.simulationKey,
          reason: "La clave natural ya existe con otro _id",
          existingId: String(duplicateKeyDocument._id),
        });
        continue;
      }

      documentsToInsert.push(
        toMongoDocument(collectionName, expectedDocument)
      );
      collectionSummary.inserts += 1;
    }

    collectionSummary.extras = existingBySimulationDocuments
      .map((document) => String(document._id))
      .filter((id) => !expectedIdSet.has(id));

    collections[collectionName] = collectionSummary;
    inserts[collectionName] = documentsToInsert;
    totals.expected += collectionSummary.expected;
    totals.inserts += collectionSummary.inserts;
    totals.unchanged += collectionSummary.unchanged;
    totals.conflicts += collectionSummary.conflicts.length;
    totals.extras += collectionSummary.extras.length;
  }

  return {
    simulationId: dataset.simulationId,
    collections,
    inserts,
    totals,
  };
};

export const applySimulationPlan = async (
  db: Db,
  plan: SimulationApplyPlan
): Promise<SimulationApplyResult> => {
  if (plan.totals.conflicts > 0 || plan.totals.extras > 0) {
    throw new Error(
      "El plan contiene conflictos o documentos inesperados; no se aplicó nada"
    );
  }

  const inserted = {} as Record<SimulationCollectionName, number>;
  let totalInserted = 0;

  for (const collectionName of SIMULATION_COLLECTIONS) {
    const documents = plan.inserts[collectionName];
    if (documents.length === 0) {
      inserted[collectionName] = 0;
      continue;
    }

    const result = await db
      .collection(collectionName)
      .insertMany(documents, { ordered: true });
    inserted[collectionName] = result.insertedCount;
    totalInserted += result.insertedCount;
  }

  return { inserted, totalInserted };
};

export const countCollections = async (
  db: Db
): Promise<Record<SimulationCollectionName, CollectionCount>> => {
  const counts = {} as Record<SimulationCollectionName, CollectionCount>;

  for (const collectionName of SIMULATION_COLLECTIONS) {
    const collection = db.collection(collectionName);
    const total = await collection.countDocuments({});
    const simulated = await collection.countDocuments({
      dataOrigin: "simulated",
    });
    counts[collectionName] = {
      total,
      simulated,
      legacy: total - simulated,
    };
  }

  return counts;
};

export const captureLegacySnapshot = async (
  db: Db
): Promise<LegacySnapshot> => {
  const collections = {} as Record<
    SimulationCollectionName,
    LegacyCollectionSnapshot
  >;

  for (const collectionName of SIMULATION_COLLECTIONS) {
    const documents = await db
      .collection(collectionName)
      .find({ dataOrigin: { $ne: "simulated" } })
      .sort({ _id: 1 })
      .toArray();

    collections[collectionName] = {
      count: documents.length,
      hash: sha256Hex(
        stableStringify(documents.map((document) => normalizeMongoValue(document)))
      ),
    };
  }

  return { collections };
};

export const verifyPersistedDataset = async (
  db: Db,
  dataset: SimulationDataset
): Promise<PersistedVerification> => {
  const plan = await buildApplyPlan(db, dataset);
  const issues: string[] = [];

  if (plan.totals.inserts > 0) {
    issues.push(`faltan ${plan.totals.inserts} documentos por insertar`);
  }
  if (plan.totals.conflicts > 0) {
    issues.push(`existen ${plan.totals.conflicts} conflictos`);
  }
  if (plan.totals.extras > 0) {
    issues.push(`existen ${plan.totals.extras} documentos inesperados`);
  }
  if (plan.totals.unchanged !== plan.totals.expected) {
    issues.push(
      `sin cambios ${plan.totals.unchanged} de ${plan.totals.expected} documentos`
    );
  }

  return {
    passed: issues.length === 0,
    issues,
    plan,
  };
};

export const legacySnapshotsEqual = (
  before: LegacySnapshot,
  after: LegacySnapshot
): boolean =>
  SIMULATION_COLLECTIONS.every(
    (collectionName) =>
      before.collections[collectionName].count ===
        after.collections[collectionName].count &&
      before.collections[collectionName].hash ===
        after.collections[collectionName].hash
  );
