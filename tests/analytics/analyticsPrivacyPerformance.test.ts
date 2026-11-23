import mongoose, { Types } from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { generateToken } from "../../src/utils/jwt";
import { BookingModel } from "../../src/modules/booking/model/BookingModel";
import { DateRangeModel } from "../../src/modules/dateRange/model/DateRangeModel";
import { RoleModel } from "../../src/modules/role/model/roleModel";
import { TourPackageModel } from "../../src/modules/tourPackage/model/TourPackageModel";
import { TouristDestinationModel } from "../../src/modules/touristDestination/model/TouristDestinationModel";

const createRole = (name: string, color: string) =>
  RoleModel.create({ name, color });

const tokenForRole = (roleId: string) =>
  generateToken({
    id: new mongoose.Types.ObjectId().toString(),
    firstName: "Prueba",
    lastName: "Privacidad",
    phone: "70000000",
    email: "prueba@example.test",
    firstLogin: false,
    role: roleId,
    ci: "000000",
    imagePath: "test.webp",
  });

const authorizationForRole = async (name: string, color: string) => {
  const role = await createRole(name, color);
  return `Bearer ${tokenForRole(role._id.toString())}`;
};

const createDestination = (suffix: string) =>
  TouristDestinationModel.create({
    name: `Destino ${suffix}`,
    description: `Destino de prueba ${suffix}`,
    imageFolder: `destino-privacidad-${suffix}`,
    images: [],
    deleted: false,
  });

const createTourPackage = (
  destinationId: Types.ObjectId,
  suffix: string,
) =>
  TourPackageModel.create({
    name: `Paquete ${suffix}`,
    tourType: new Types.ObjectId(),
    touristDestination: destinationId,
    duration: 3,
    dateRanges: [],
    price: 100,
    itinerary: { days: [] },
    status: "active",
    deleted: false,
    dataOrigin: "simulated",
  });

const createDeparture = (
  tourPackageId: Types.ObjectId,
  suffix: string,
  startDate = new Date("2026-11-28T00:00:00.000Z"),
) =>
  DateRangeModel.create({
    dates: [],
    startDate,
    endDate: new Date(startDate.getTime() + 2 * 86_400_000),
    capacity: 20,
    state: "pending",
    guides: [],
    tourPackageId: tourPackageId.toString(),
    dataOrigin: "simulated",
    simulationId: `departure-privacidad-${suffix}`,
  });

const createBooking = async (
  departureId: Types.ObjectId,
  tourPackageId: Types.ObjectId,
  suffix: string,
) =>
  BookingModel.create({
    touristsIds: [new Types.ObjectId()],
    dateRangeId: departureId,
    paymentIds: [],
    sellerId: new Types.ObjectId(),
    status: "confirmed",
    totalPrice: 100,
    tourPackageId,
    paymentProofFolder: `proof-${suffix}`,
    bookingCode: `code-${suffix}`,
    notes: `nota-${suffix}`,
    dataOrigin: "simulated",
    createdAt: new Date("2026-10-04T12:00:00.000Z"),
    updatedAt: new Date("2026-10-04T12:00:00.000Z"),
  });

const createFixture = async (suffix = "a") => {
  const destination = await createDestination(suffix);
  const tourPackage = await createTourPackage(destination._id, suffix);
  const departure = await createDeparture(tourPackage._id, suffix);
  await createBooking(departure._id, tourPackage._id, suffix);

  return { destination, tourPackage, departure };
};

const analyticsRequests = (
  authorization: string | undefined,
  departureId: string,
) => {
  const bearer = authorization ? { Authorization: authorization } : {};

  return [
    request(app).get("/api/v1/analytics").set(bearer),
    request(app).get("/api/v1/analytics/summary").set(bearer),
    request(app)
      .get("/api/v1/analytics/departures")
      .query({ limit: 100 })
      .set(bearer),
    request(app)
      .get(`/api/v1/analytics/departures/${departureId}`)
      .set(bearer),
    request(app)
      .get("/api/v1/analytics/trends")
      .query({
        dateRangeId: departureId,
        from: "2026-10-01",
        to: "2026-11-13",
      })
      .set(bearer),
  ];
};

const forbiddenKeys = new Set([
  "email",
  "phone",
  "ci",
  "firstName",
  "lastName",
  "address",
  "password",
  "touristsIds",
  "sellerId",
  "notes",
  "paymentProof",
  "paymentProofImage",
  "bookingCode",
  "paymentIds",
  "attendance",
  "refundAmount",
  "cancellationFee",
  "refundedAt",
]);

const collectKeys = (value: unknown, found: string[] = []): string[] => {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, found);
    }
    return found;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      found.push(key);
      collectKeys(child, found);
    }
  }

  return found;
};

const bytesOf = (value: unknown): number =>
  Buffer.byteLength(JSON.stringify(value), "utf8");

describe("Analytics privacy and performance guardrails", () => {
  it("enforces the role matrix on all analytics endpoints", async () => {
    const fixture = await createFixture("roles");
    const departureId = fixture.departure._id.toString();
    const admin = await authorizationForRole("administrador", "#300001");
    const operator = await authorizationForRole(
      "operador de ventas",
      "#300002",
    );
    const guide = await authorizationForRole("guia de turismo", "#300003");

    const anonymous = await Promise.all(
      analyticsRequests(undefined, departureId),
    );
    const guideResponses = await Promise.all(
      analyticsRequests(guide, departureId),
    );
    const adminResponses = await Promise.all(
      analyticsRequests(admin, departureId),
    );
    const operatorResponses = await Promise.all(
      analyticsRequests(operator, departureId),
    );

    for (const response of anonymous) {
      expect(response.status).toBe(401);
    }

    for (const response of guideResponses) {
      expect(response.status).toBe(403);
      expect(response.body.data).toBeNull();
    }

    for (const response of [...adminResponses, ...operatorResponses]) {
      expect(response.status).toBe(200);
    }
  });

  it("does not expose PII, internal fields or error internals", async () => {
    const fixture = await createFixture("pii");
    const departureId = fixture.departure._id.toString();
    const admin = await authorizationForRole("administrador", "#300004");
    const responses = await Promise.all(
      analyticsRequests(admin, departureId),
    );
    const payloads = responses.map((response) => response.body);
    const keys = collectKeys(payloads);
    const serialized = JSON.stringify(payloads);

    for (const key of keys) {
      expect(forbiddenKeys.has(key)).toBe(false);
    }

    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(serialized).not.toMatch(/\b[67]\d{7}\b/);
    expect(serialized).not.toContain("stack");
    expect(serialized).not.toContain("MongoServerError");

    const invalidLimit = await request(app)
      .get("/api/v1/analytics/departures")
      .query({ limit: 101 })
      .set("Authorization", admin);
    const invalidDetail = await request(app)
      .get("/api/v1/analytics/departures/no-es-object-id")
      .set("Authorization", admin);
    const missingDeparture = await request(app)
      .get(
        `/api/v1/analytics/departures/${new Types.ObjectId().toString()}`,
      )
      .set("Authorization", admin);

    for (const response of [invalidLimit, invalidDetail, missingDeparture]) {
      const errorBody = JSON.stringify(response.body);
      expect(errorBody).not.toContain("stack");
      expect(errorBody).not.toContain("MongoServerError");
      expect(errorBody).not.toContain("Bookings");
      expect(errorBody).not.toContain("Payments");
      expect(errorBody).not.toContain("Tourists");
    }
  });

  it("caps the departures page and rejects unbounded pagination inputs", async () => {
    const destination = await createDestination("pagination");
    const tourPackage = await createTourPackage(
      destination._id,
      "pagination",
    );
    const admin = await authorizationForRole("administrador", "#300005");

    for (let index = 0; index < 105; index += 1) {
      const departure = await createDeparture(
        tourPackage._id,
        `pagination-${index}`,
        new Date(Date.UTC(2026, 0, 1 + index)),
      );
      await createBooking(
        departure._id,
        tourPackage._id,
        `pagination-${index}`,
      );
    }

    const capped = await request(app)
      .get("/api/v1/analytics/departures")
      .query({ limit: 100 })
      .set("Authorization", admin);
    const single = await request(app)
      .get("/api/v1/analytics/departures")
      .query({ limit: 1 })
      .set("Authorization", admin);
    const invalidLimits = await Promise.all(
      ["0", "101", "1.5", "-1", "abc"].map((limit) =>
        request(app)
          .get("/api/v1/analytics/departures")
          .query({ limit })
          .set("Authorization", admin),
      ),
    );
    const invalidCursor = await request(app)
      .get("/api/v1/analytics/departures")
      .query({ cursor: "no-es-un-cursor" })
      .set("Authorization", admin);
    const unknownParameter = await request(app)
      .get("/api/v1/analytics/departures")
      .query({ limit: 10, all: "true" })
      .set("Authorization", admin);

    expect(capped.status).toBe(200);
    expect(capped.body.data.items).toHaveLength(100);
    expect(capped.body.data.pagination).toMatchObject({
      limit: 100,
      hasMore: true,
    });
    expect(bytesOf(capped.body)).toBeLessThan(250 * 1024);
    expect(single.status).toBe(200);
    expect(single.body.data.items).toHaveLength(1);
    expect(single.body.data.pagination.hasMore).toBe(true);
    expect(bytesOf(single.body)).toBeLessThan(10 * 1024);

    for (const response of [...invalidLimits, invalidCursor, unknownParameter]) {
      expect(response.status).toBe(400);
    }
  });

  it("caps the trends window and rejects oversized queries", async () => {
    const fixture = await createFixture("trends");
    const admin = await authorizationForRole("administrador", "#300006");
    const departureId = fixture.departure._id.toString();
    const maxWindow = await request(app)
      .get("/api/v1/analytics/trends")
      .query({
        dateRangeId: departureId,
        from: "2025-10-10",
        to: "2026-11-13",
      })
      .set("Authorization", admin);
    const excessiveWindow = await request(app)
      .get("/api/v1/analytics/trends")
      .query({
        dateRangeId: departureId,
        from: "2025-10-09",
        to: "2026-11-13",
      })
      .set("Authorization", admin);
    const futureTo = await request(app)
      .get("/api/v1/analytics/trends")
      .query({
        dateRangeId: departureId,
        from: "2026-11-01",
        to: "2026-11-14",
      })
      .set("Authorization", admin);
    const hugeRange = await request(app)
      .get("/api/v1/analytics/trends")
      .query({
        dateRangeId: departureId,
        from: "1900-01-01",
        to: "2026-11-13",
      })
      .set("Authorization", admin);
    const invalidGranularity = await request(app)
      .get("/api/v1/analytics/trends")
      .query({ dateRangeId: departureId, granularity: "year" })
      .set("Authorization", admin);
    const unknownParameter = await request(app)
      .get("/api/v1/analytics/trends")
      .query({ dateRangeId: departureId, limit: 10 })
      .set("Authorization", admin);
    const missingDeparture = await request(app)
      .get("/api/v1/analytics/trends")
      .set("Authorization", admin);

    expect(maxWindow.status).toBe(200);
    expect(maxWindow.body.data.series.points).toHaveLength(400);
    expect(bytesOf(maxWindow.body)).toBeLessThan(250 * 1024);

    for (const response of [
      excessiveWindow,
      futureTo,
      hugeRange,
      invalidGranularity,
      unknownParameter,
      missingDeparture,
    ]) {
      expect(response.status).toBe(400);
    }
  });

  it("keeps every analytics response small and aggregate-only", async () => {
    const fixture = await createFixture("size");
    const admin = await authorizationForRole("administrador", "#300007");
    const [overview, summary, departures, detail, trends] = await Promise.all(
      analyticsRequests(admin, fixture.departure._id.toString()),
    );

    expect(overview.status).toBe(200);
    expect(summary.status).toBe(200);
    expect(departures.status).toBe(200);
    expect(detail.status).toBe(200);
    expect(trends.status).toBe(200);

    expect(objectKeys(overview.body)).toEqual(
      expect.arrayContaining(["data", "meta", "warnings"]),
    );
    expect(objectKeys(summary.body)).toEqual(
      expect.arrayContaining(["data", "meta", "warnings"]),
    );
    expect(objectKeys(detail.body.data)).toEqual(["departure"]);
    expect(Array.isArray(departures.body.data.items)).toBe(true);
    expect(Array.isArray(trends.body.data.series.points)).toBe(true);
    expect(trends.body.data.series.points.length).toBeLessThanOrEqual(400);

    expect(bytesOf(overview.body)).toBeLessThan(5 * 1024);
    expect(bytesOf(summary.body)).toBeLessThan(5 * 1024);
    expect(bytesOf(detail.body)).toBeLessThan(10 * 1024);
    expect(bytesOf(departures.body)).toBeLessThan(250 * 1024);
    expect(bytesOf(trends.body)).toBeLessThan(250 * 1024);
  });
});

const objectKeys = (value: unknown): string[] =>
  value && typeof value === "object" ? Object.keys(value) : [];
