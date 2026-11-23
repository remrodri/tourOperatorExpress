import mongoose, { Types } from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { generateToken } from "../../src/utils/jwt";
import { RoleModel } from "../../src/modules/role/model/roleModel";
import { PredictiveAnalyticsService } from "../../src/modules/analytics/prediction/PredictiveAnalyticsService";
import { PredictiveDatasetInputs } from "../../src/modules/analytics/dataset/PredictiveDatasetTypes";
import { PredictiveModelRun } from "../../src/modules/analytics/prediction/PredictiveModelTypes";
import modelArtifactJson from "../../src/modules/analytics/prediction/artifacts/t813-model.json";

const artifact = modelArtifactJson as unknown as PredictiveModelRun;

const baseInputs = (overrides: {
  startDate?: Date | null;
  endDate?: Date | null;
  capacity?: number | null;
  dataOrigin?: string | null;
  packageExists?: boolean;
} = {}): PredictiveDatasetInputs => {
  const departureId = new Types.ObjectId().toString();
  const packageId = new Types.ObjectId().toString();
  return {
    departures: [{
      id: departureId,
      startDate: overrides.startDate === undefined
        ? new Date("2026-11-01T00:00:00.000Z")
        : overrides.startDate,
      endDate: overrides.endDate === undefined
        ? new Date("2026-11-02T00:00:00.000Z")
        : overrides.endDate,
      capacity: overrides.capacity === undefined ? 12 : overrides.capacity,
      tourPackageId: packageId,
      dataOrigin: overrides.dataOrigin === undefined ? "simulated" : overrides.dataOrigin,
      simulationId: "prediction-test",
      simulationVersion: "t807-v1",
      simulationSeed: 20261113,
    }],
    bookings: [
      {
        departureId,
        status: "confirmed",
        tourists: 3,
        createdAt: new Date("2026-09-01T00:00:00.000Z"),
      },
      {
        departureId,
        status: "cancelled",
        tourists: 8,
        createdAt: new Date("2026-09-02T00:00:00.000Z"),
      },
    ],
    packages: overrides.packageExists === false
      ? []
      : [{
          id: packageId,
          destinationId: new Types.ObjectId().toString(),
          tourTypeId: new Types.ObjectId().toString(),
          durationDays: 2,
          price: 100,
        }],
  };
};

const serviceFor = (
  inputs: PredictiveDatasetInputs,
  now = new Date("2026-11-23T13:00:00.000Z"),
) => new PredictiveAnalyticsService(artifact, async () => inputs, () => now);

const createRole = (name: string, color: string) => RoleModel.create({ name, color });

const authorizationForRole = async (name: string, color: string) => {
  const role = await createRole(name, color);
  const token = generateToken({
    id: new Types.ObjectId().toString(),
    firstName: "Prueba",
    lastName: "Predicción",
    phone: "70000000",
    email: "prediction@example.test",
    firstLogin: false,
    role: role._id.toString(),
    ci: "000000",
    imagePath: "test.webp",
  });
  return `Bearer ${token}`;
};

describe("Analytics prediction T-814", () => {
  it("returns an available accumulated prediction at 14 days", async () => {
    const inputs = baseInputs();
    const response = await serviceFor(inputs).getPrediction(
      inputs.departures[0].id,
      { horizonDays: 14 },
    );
    expect(response.data).toMatchObject({
      state: "available",
      horizonDays: 14,
      confirmedTourists: 3,
      predictedFinalTourists: 3,
      predictor: "baseline-accumulated",
      capacity: 12,
      expectedOccupancy: 25,
      modelVersion: "t813-v1",
      dataOrigin: "simulated",
      departureDataOrigin: "simulated",
    });
    expect(response.data.predictionRange).toEqual({
      lower: 2,
      upper: 4,
      method: "test-mae-band",
    });
  });

  it("uses the regression tree recommendation at 30 days", async () => {
    const inputs = baseInputs();
    const response = await serviceFor(inputs).getPrediction(
      inputs.departures[0].id,
      { horizonDays: 30 },
    );
    expect(response.data.state).toBe("available");
    expect(response.data.predictor).toBe("regression-tree");
    expect(response.data.metrics?.mae).toBe(2.116667);
    expect(response.data.predictedFinalTourists).toBeGreaterThanOrEqual(0);
  });

  it("does not silently truncate expected overcapacity", async () => {
    const inputs = baseInputs({ capacity: 1 });
    const response = await serviceFor(inputs).getPrediction(
      inputs.departures[0].id,
      { horizonDays: 14 },
    );
    expect(response.data.predictedFinalTourists).toBe(3);
    expect(response.data.expectedOccupancy).toBe(300);
    expect(response.warnings.join(" ")).toContain("EXPECTED_OVERCAPACITY");
  });

  it("returns insufficient-history when the cutoff is after asOf", async () => {
    const inputs = baseInputs({
      startDate: new Date("2026-12-20T00:00:00.000Z"),
      endDate: new Date("2026-12-21T00:00:00.000Z"),
    });
    const response = await serviceFor(inputs).getPrediction(
      inputs.departures[0].id,
      { horizonDays: 30 },
    );
    expect(response.data.state).toBe("insufficient-history");
    expect(response.data.predictedFinalTourists).toBeNull();
  });

  it("returns invalid-capacity without occupancy", async () => {
    const inputs = baseInputs({ capacity: 0 });
    const response = await serviceFor(inputs).getPrediction(
      inputs.departures[0].id,
      { horizonDays: 14 },
    );
    expect(response.data.state).toBe("invalid-capacity");
    expect(response.data.capacity).toBeNull();
    expect(response.data.expectedOccupancy).toBeNull();
  });

  it("returns no-data for non-simulated departures", async () => {
    const inputs = baseInputs({ dataOrigin: "legacy" });
    const response = await serviceFor(inputs).getPrediction(
      inputs.departures[0].id,
      { horizonDays: 14 },
    );
    expect(response.data.state).toBe("no-data");
    expect(response.data.departureDataOrigin).toBe("legacy");
    expect(response.data.predictedFinalTourists).toBeNull();
  });

  it("rejects an altered or incompatible model artifact", () => {
    const corrupted = {
      ...artifact,
      runHash: "altered",
    } as PredictiveModelRun;
    expect(
      () => new PredictiveAnalyticsService(corrupted, async () => baseInputs()),
    ).toThrow("Artefacto predictivo T-813 inválido o incompatible");
  });

  it("returns stale-model without publishing a prediction", async () => {
    const inputs = baseInputs();
    const response = await serviceFor(
      inputs,
      new Date("2027-03-01T00:00:00.000Z"),
    ).getPrediction(inputs.departures[0].id, { horizonDays: 14 });
    expect(response.data.state).toBe("stale-model");
    expect(response.data.predictedFinalTourists).toBeNull();
    expect(response.warnings.join(" ")).toContain("STALE_MODEL");
  });

  it("publishes metrics without internal model artifacts or PII", async () => {
    const response = await serviceFor(baseInputs()).getMetrics();
    const serialized = JSON.stringify(response);
    expect(response.data.state).toBe("available");
    expect(response.data.horizons).toHaveLength(3);
    expect(serialized).not.toContain('"artifact"');
    for (const key of ["email", "phone", "password", "token", "touristsIds"]) {
      expect(serialized).not.toContain(`"${key}"`);
    }
  });

  it("protects predictive endpoints with authentication and roles", async () => {
    const noToken = await request(app).get("/api/v1/analytics/predictions/metrics");
    expect(noToken.status).toBe(401);

    const guide = await authorizationForRole("guia de turismo", "#310001");
    const forbidden = await request(app)
      .get("/api/v1/analytics/predictions/metrics")
      .set("Authorization", guide);
    expect(forbidden.status).toBe(403);

    const admin = await authorizationForRole("administrador", "#310002");
    const allowed = await request(app)
      .get("/api/v1/analytics/predictions/metrics")
      .set("Authorization", admin);
    expect(allowed.status).toBe(200);
    expect(allowed.body.meta).toMatchObject({
      contractVersion: "1.3.0",
      release: "t814-v1",
      status: "predictive",
      dataOrigin: "simulated",
    });
  });

  it("validates departure id, horizon and unknown parameters", async () => {
    const admin = await authorizationForRole("administrador", "#310003");
    const invalidId = await request(app)
      .get("/api/v1/analytics/departures/no-es-id/prediction")
      .query({ horizonDays: 14 })
      .set("Authorization", admin);
    expect(invalidId.status).toBe(400);

    const invalidHorizon = await request(app)
      .get(`/api/v1/analytics/departures/${new Types.ObjectId()}/prediction`)
      .query({ horizonDays: 10 })
      .set("Authorization", admin);
    expect(invalidHorizon.status).toBe(400);

    const unknown = await request(app)
      .get("/api/v1/analytics/predictions/metrics")
      .query({ all: "true" })
      .set("Authorization", admin);
    expect(unknown.status).toBe(400);
  });

  it("returns 404 for an unknown departure", async () => {
    const admin = await authorizationForRole("administrador", "#310004");
    const response = await request(app)
      .get(`/api/v1/analytics/departures/${new Types.ObjectId()}/prediction`)
      .query({ horizonDays: 14 })
      .set("Authorization", admin);
    expect(response.status).toBe(404);
  });
});

