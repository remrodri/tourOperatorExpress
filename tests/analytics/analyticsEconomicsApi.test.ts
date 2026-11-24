import mongoose, { Types } from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { generateToken } from "../../src/utils/jwt";
import { DateRangeModel } from "../../src/modules/dateRange/model/DateRangeModel";
import { RoleModel } from "../../src/modules/role/model/roleModel";
import { TourPackageModel } from "../../src/modules/tourPackage/model/TourPackageModel";
import { TouristDestinationModel } from "../../src/modules/touristDestination/model/TouristDestinationModel";

const authorizationForRole = async (name: string, color: string) => {
  const role = await RoleModel.create({ name, color });
  return `Bearer ${generateToken({
    id: new Types.ObjectId().toString(),
    firstName: "Prueba",
    lastName: "Económica",
    phone: "70000000",
    email: "economics@example.test",
    firstLogin: false,
    role: role._id.toString(),
    ci: "000000",
    imagePath: "test.webp",
  })}`;
};

const createEconomicDeparture = async () => {
  const destination = await TouristDestinationModel.create({
    name: "Destino económico",
    description: "Destino de prueba económica",
    imageFolder: "destino-economico",
    images: [],
    deleted: false,
  });
  const tourPackage = await TourPackageModel.create({
    name: "Paquete económico",
    tourType: new Types.ObjectId(),
    touristDestination: destination._id,
    duration: 2,
    dateRanges: [],
    price: 500,
    itinerary: { days: [] },
    status: "active",
    deleted: false,
    dataOrigin: "simulated",
  });
  return DateRangeModel.create({
    dates: [],
    startDate: new Date("2026-12-20T00:00:00.000Z"),
    endDate: new Date("2026-12-21T00:00:00.000Z"),
    capacity: 20,
    state: "pending",
    guides: [],
    tourPackageId: tourPackage._id.toString(),
    dataOrigin: "simulated",
    simulationId: "economics-api-test",
    economicPlan: {
      currency: "BOB",
      fixedCosts: {
        transportation: 2000,
        guide: 500,
        administration: 300,
        fixedLodging: 0,
        other: 0,
      },
      variableCostsPerTourist: {
        food: 100,
        tickets: 50,
        lodging: 0,
        insurance: 0,
        other: 0,
      },
      pricePerTourist: 500,
      operationalMinimum: 6,
      planningStartedAt: new Date("2026-11-01T00:00:00.000Z"),
      decisionDeadline: new Date("2026-12-13T00:00:00.000Z"),
      source: "simulated",
      version: "t1202-v1",
      updatedAt: new Date("2026-11-01T00:00:00.000Z"),
    },
  });
};

describe("Analytics economics HTTP boundary T-1208", () => {
  it("requires authentication and rejects the guide role", async () => {
    const id = new Types.ObjectId().toString();
    const noToken = await request(app)
      .get(`/api/v1/analytics/departures/${id}/economics`)
      .query({ horizonDays: 14 });
    expect(noToken.status).toBe(401);

    const guide = await authorizationForRole("guia de turismo", "#420001");
    const forbidden = await request(app)
      .get(`/api/v1/analytics/departures/${id}/economics`)
      .query({ horizonDays: 14 })
      .set("Authorization", guide);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.data).toBeNull();
  });

  it("validates the departure id and prediction horizon", async () => {
    const admin = await authorizationForRole("administrador", "#420002");
    const invalidId = await request(app)
      .get("/api/v1/analytics/departures/no-es-id/economics")
      .query({ horizonDays: 14 })
      .set("Authorization", admin);
    expect(invalidId.status).toBe(400);

    const invalidHorizon = await request(app)
      .get(`/api/v1/analytics/departures/${new Types.ObjectId()}/economics`)
      .query({ horizonDays: 10 })
      .set("Authorization", admin);
    expect(invalidHorizon.status).toBe(400);
  });

  it("returns the economic contract without PII or automatic decisions", async () => {
    const departure = await createEconomicDeparture();
    const admin = await authorizationForRole("administrador", "#420003");

    const response = await request(app)
      .get(`/api/v1/analytics/departures/${departure._id}/economics`)
      .query({ horizonDays: 14 })
      .set("Authorization", admin);

    expect(response.status).toBe(200);
    expect(response.body.meta).toMatchObject({
      module: "analytics",
      contractVersion: "1.5.0",
      release: "t1206-v1",
      status: "economic",
      dataOrigin: "simulated",
    });
    expect(response.body.data).toMatchObject({
      departureId: departure._id.toString(),
      predictionHorizonDays: 14,
      currency: "BOB",
      fixedCostsTotal: 2800,
      variableCostPerTourist: 150,
      contributionMarginPerTourist: 350,
      economicMinimum: 8,
      finalMinimum: 8,
      recommendation: { automaticDecision: false },
    });
    expect(response.body.data).not.toHaveProperty("automaticDecision");
    const serialized = JSON.stringify(response.body);
    for (const key of ["email", "phone", "ci", "touristsIds", "password", "token"]) {
      expect(serialized).not.toContain(`"${key}"`);
    }
  });

  it("returns 404 for an unknown departure to an allowed role", async () => {
    const operator = await authorizationForRole(
      "operador de ventas",
      "#420004",
    );
    const response = await request(app)
      .get(`/api/v1/analytics/departures/${new mongoose.Types.ObjectId()}/economics`)
      .query({ horizonDays: 7 })
      .set("Authorization", operator);
    expect(response.status).toBe(404);
    expect(response.body.data).toBeNull();
  });
});
