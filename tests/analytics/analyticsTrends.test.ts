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
    lastName: "Tendencias",
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
    imageFolder: `destino-tendencias-${suffix}`,
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

interface DepartureOptions {
  startDate?: Date | null;
  endDate?: Date | null;
  capacity?: number | null;
  suffix?: string;
}

const createDeparture = (
  tourPackageId: Types.ObjectId,
  options: DepartureOptions = {},
) =>
  DateRangeModel.create({
    dates: [],
    startDate:
      options.startDate === undefined
        ? new Date("2026-11-28T00:00:00.000Z")
        : options.startDate,
    endDate:
      options.endDate === undefined
        ? new Date("2026-11-29T00:00:00.000Z")
        : options.endDate,
    capacity: options.capacity === undefined ? 14 : options.capacity,
    state: "pending",
    guides: [],
    tourPackageId: tourPackageId.toString(),
    dataOrigin: "simulated",
    simulationId: `departure-trends-${options.suffix ?? "a"}`,
  });

const createRawBooking = async (
  departureId: Types.ObjectId,
  tourPackageId: Types.ObjectId,
  options: {
    status: "pending" | "confirmed" | "paid" | "cancelled" | "completed";
    createdAt: Date | string | null;
    touristCount?: number;
    totalPrice?: number;
  },
) => {
  const now = new Date("2026-11-13T23:59:59.999Z");

  await BookingModel.collection.insertOne({
    _id: new Types.ObjectId(),
    touristsIds: Array.from(
      { length: options.touristCount ?? 1 },
      () => new Types.ObjectId(),
    ),
    dateRangeId: departureId,
    paymentIds: [],
    sellerId: new Types.ObjectId(),
    status: options.status,
    totalPrice: options.totalPrice ?? 100,
    tourPackageId,
    paymentProofFolder: "test",
    dataOrigin: "simulated",
    createdAt: options.createdAt,
    updatedAt: now,
  });
};

const createFixture = async (suffix = "a") => {
  const destination = await createDestination(suffix);
  const tourPackage = await createTourPackage(destination._id, suffix);
  const departure = await createDeparture(tourPackage._id, { suffix });

  return { destination, tourPackage, departure };
};

const createControlFixture = async () => {
  const fixture = await createFixture("control");

  await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
    status: "confirmed",
    createdAt: new Date("2026-10-04T12:00:00.000Z"),
    touristCount: 3,
    totalPrice: 2100,
  });
  await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
    status: "paid",
    createdAt: new Date("2026-11-12T12:00:00.000Z"),
    touristCount: 2,
    totalPrice: 1400,
  });
  await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
    status: "cancelled",
    createdAt: new Date("2026-10-31T12:00:00.000Z"),
    touristCount: 4,
    totalPrice: 2800,
  });

  return fixture;
};

const getTrends = (
  authorization: string,
  query: Record<string, string>,
) =>
  request(app)
    .get("/api/v1/analytics/trends")
    .query(query)
    .set("Authorization", authorization);

describe("Analytics trends contract", () => {
  it("rejects requests without a token", async () => {
    const response = await request(app)
      .get("/api/v1/analytics/trends")
      .query({ dateRangeId: new Types.ObjectId().toString() });

    expect(response.status).toBe(401);
    expect(response.body.data).toBeNull();
  });

  it("rejects guia de turismo", async () => {
    const authorization = await authorizationForRole(
      "guia de turismo",
      "#200001",
    );
    const response = await getTrends(authorization, {
      dateRangeId: new Types.ObjectId().toString(),
    });

    expect(response.status).toBe(403);
    expect(response.body.data).toBeNull();
  });

  it("returns the default daily series with paid alias and cancelled exclusion", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200002",
    );
    const fixture = await createControlFixture();
    const response = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
    });
    const body = response.body;

    expect(response.status).toBe(200);
    expect(body.meta).toMatchObject({
      module: "analytics",
      contractVersion: "1.2.0",
      release: "t810-v1",
      status: "descriptive",
      dataOrigin: "simulated",
      granularity: "day",
      timeZone: "UTC",
      asOf: "2026-11-13T23:59:59.999Z",
      period: {
        from: "2026-10-04T00:00:00.000Z",
        to: "2026-11-13T00:00:00.000Z",
      },
      filters: {
        dateRangeId: fixture.departure._id.toString(),
        from: "2026-10-04T00:00:00.000Z",
        to: "2026-11-13T00:00:00.000Z",
      },
      observation: {
        eventField: "booking.createdAt",
        fromInclusive: true,
        toInclusive: true,
        maxPoints: 400,
        asOfRule: "booking.createdAt <= asOf",
      },
    });
    expect(body.data.departure).toMatchObject({
      id: fixture.departure._id.toString(),
      startDate: "2026-11-28T00:00:00.000Z",
      capacity: 14,
      tourPackage: {
        id: fixture.tourPackage._id.toString(),
        name: "Paquete control",
      },
      destination: {
        id: fixture.destination._id.toString(),
        name: "Destino control",
      },
    });
    expect(body.data.state).toBe("available");
    expect(body.data.totals).toEqual({
      bookings: 2,
      tourists: 5,
      reservedRevenue: 3500,
      eventDays: 2,
    });
    expect(body.data.series.granularity).toBe("day");
    expect(body.data.series.points).toHaveLength(41);
    expect(body.data.series.points[0]).toMatchObject({
      intervalStart: "2026-10-04T00:00:00.000Z",
      intervalEnd: "2026-10-05T00:00:00.000Z",
      complete: true,
      observedDays: 1,
      bookings: 1,
      tourists: 3,
      reservedRevenue: 2100,
      cumulativeBookings: 1,
      cumulativeTourists: 3,
      cumulativeReservedRevenue: 2100,
      touristsPerDay: 3,
    });
    expect(
      body.data.series.points[body.data.series.points.length - 1],
    ).toMatchObject({
      intervalStart: "2026-11-13T00:00:00.000Z",
      intervalEnd: "2026-11-14T00:00:00.000Z",
      complete: true,
      bookings: 0,
      tourists: 0,
      cumulativeBookings: 2,
      cumulativeTourists: 5,
      cumulativeReservedRevenue: 3500,
    });
    expect(body.data.rhythm).toEqual({
      window: {
        from: "2026-10-04T00:00:00.000Z",
        to: "2026-11-13T00:00:00.000Z",
        observedDays: 41,
        status: "open",
      },
      bookingsPerDay: 0.05,
      touristsPerDay: 0.12,
    });
    expect(body.warnings).toEqual([
      expect.stringContaining("Datos ficticios"),
      expect.stringContaining("PARTIAL_WINDOW"),
    ]);
    expect(JSON.stringify(body)).not.toContain("email");
    expect(JSON.stringify(body)).not.toContain("touristsIds");
  });

  it("returns an empty default window when the departure has no activity", async () => {
    const authorization = await authorizationForRole(
      "operador de ventas",
      "#200003",
    );
    const fixture = await createFixture("empty");
    const response = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.data.state).toBe("no-activity");
    expect(response.body.data.totals).toEqual({
      bookings: 0,
      tourists: 0,
      reservedRevenue: 0,
      eventDays: 0,
    });
    expect(response.body.data.series.points).toHaveLength(30);
    expect(response.body.data.rhythm.window.observedDays).toBe(30);
    expect(response.body.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("NO_ACTIVITY"),
        expect.stringContaining("PARTIAL_WINDOW"),
      ]),
    );
  });

  it("closes the default window at the departure start date", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200010",
    );
    const destination = await createDestination("past");
    const tourPackage = await createTourPackage(destination._id, "past");
    const departure = await createDeparture(tourPackage._id, {
      startDate: new Date("2026-11-10T00:00:00.000Z"),
      endDate: new Date("2026-11-11T00:00:00.000Z"),
      suffix: "past",
    });

    await createRawBooking(departure._id, tourPackage._id, {
      status: "confirmed",
      createdAt: new Date("2026-10-20T10:00:00.000Z"),
      touristCount: 2,
      totalPrice: 1000,
    });

    const response = await getTrends(authorization, {
      dateRangeId: departure._id.toString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.data.series.points).toHaveLength(22);
    expect(response.body.data.rhythm.window).toEqual({
      from: "2026-10-20T00:00:00.000Z",
      to: "2026-11-10T00:00:00.000Z",
      observedDays: 22,
      status: "closed",
    });
    expect(response.body.warnings).not.toEqual(
      expect.arrayContaining([expect.stringContaining("PARTIAL_WINDOW")]),
    );
  });

  it("truncates the default window to 365 days", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200011",
    );
    const fixture = await createFixture("truncated");

    await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "confirmed",
      createdAt: new Date("2025-10-01T10:00:00.000Z"),
      touristCount: 2,
      totalPrice: 1000,
    });

    const response = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.data.series.points).toHaveLength(365);
    expect(response.body.data.rhythm.window).toMatchObject({
      from: "2025-11-14T00:00:00.000Z",
      to: "2026-11-13T00:00:00.000Z",
      observedDays: 365,
    });
    expect(response.body.data.state).toBe("no-activity");
    expect(response.body.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("DEFAULT_WINDOW_TRUNCATED"),
      ]),
    );
  });

  it("marks a single event day as insufficient history", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200004",
    );
    const fixture = await createFixture("single");

    await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "completed",
      createdAt: new Date("2026-10-05T10:00:00.000Z"),
      touristCount: 2,
      totalPrice: 900,
    });

    const response = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.data.state).toBe("insufficient-history");
    expect(response.body.data.totals).toMatchObject({
      bookings: 1,
      tourists: 2,
      eventDays: 1,
    });
    expect(response.body.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("INSUFFICIENT_HISTORY"),
      ]),
    );
  });

  it("limits the series to the requested window", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200005",
    );
    const fixture = await createControlFixture();
    const response = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
      from: "2026-11-01",
      to: "2026-11-12",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.totals).toEqual({
      bookings: 1,
      tourists: 2,
      reservedRevenue: 1400,
      eventDays: 1,
    });
    expect(response.body.data.series.points).toHaveLength(12);
    expect(response.body.data.series.points[0].intervalStart).toBe(
      "2026-11-01T00:00:00.000Z",
    );
    expect(response.body.data.rhythm.window).toEqual({
      from: "2026-11-01T00:00:00.000Z",
      to: "2026-11-12T00:00:00.000Z",
      observedDays: 12,
      status: "open",
    });
  });

  it("aggregates weekly and monthly buckets with partial boundaries", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200006",
    );
    const fixture = await createControlFixture();
    const weekly = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
      from: "2026-11-04",
      to: "2026-11-13",
      granularity: "week",
    });
    const monthly = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
      from: "2026-10-01",
      to: "2026-11-13",
      granularity: "month",
    });

    expect(weekly.status).toBe(200);
    expect(weekly.body.data.series.points).toHaveLength(2);
    expect(weekly.body.data.series.points[0]).toMatchObject({
      intervalStart: "2026-11-04T00:00:00.000Z",
      intervalEnd: "2026-11-09T00:00:00.000Z",
      complete: false,
      observedDays: 5,
    });
    expect(weekly.body.data.series.points[1]).toMatchObject({
      intervalStart: "2026-11-09T00:00:00.000Z",
      intervalEnd: "2026-11-14T00:00:00.000Z",
      complete: false,
      observedDays: 5,
      bookings: 1,
      tourists: 2,
    });
    expect(weekly.body.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("PARTIAL_BUCKET")]),
    );
    expect(monthly.status).toBe(200);
    expect(monthly.body.data.series.points).toHaveLength(2);
    expect(monthly.body.data.series.points[0]).toMatchObject({
      intervalStart: "2026-10-01T00:00:00.000Z",
      intervalEnd: "2026-11-01T00:00:00.000Z",
      complete: true,
      bookings: 1,
      tourists: 3,
      reservedRevenue: 2100,
    });
    expect(monthly.body.data.series.points[1]).toMatchObject({
      intervalStart: "2026-11-01T00:00:00.000Z",
      intervalEnd: "2026-11-14T00:00:00.000Z",
      complete: false,
      bookings: 1,
      tourists: 2,
      reservedRevenue: 1400,
    });
  });

  it("excludes invalid and future booking dates with warnings", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200007",
    );
    const fixture = await createFixture("dates");

    await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "confirmed",
      createdAt: new Date("2026-10-10T10:00:00.000Z"),
      touristCount: 1,
      totalPrice: 500,
    });
    await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "confirmed",
      createdAt: new Date("2026-12-01T10:00:00.000Z"),
      touristCount: 4,
      totalPrice: 2000,
    });
    await createRawBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "confirmed",
      createdAt: "fecha-invalida",
      touristCount: 2,
      totalPrice: 700,
    });

    const response = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.data.totals).toEqual({
      bookings: 1,
      tourists: 1,
      reservedRevenue: 500,
      eventDays: 1,
    });
    expect(response.body.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("INVALID_BOOKING_DATE: 1"),
        expect.stringContaining("EVENTS_AFTER_AS_OF: 1"),
      ]),
    );
  });

  it("rejects invalid, conflicting and oversized queries", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200008",
    );
    const fixture = await createControlFixture();
    const otherFixture = await createFixture("other");
    const cases: Array<{ query: Record<string, string>; status: number }> = [
      {
        query: {},
        status: 400,
      },
      {
        query: { dateRangeId: "no-es-object-id" },
        status: 400,
      },
      {
        query: { dateRangeId: fixture.departure._id.toString(), from: "2026-11-01" },
        status: 400,
      },
      {
        query: {
          dateRangeId: fixture.departure._id.toString(),
          from: "2026-11-01",
          to: "2026-11-14",
        },
        status: 400,
      },
      {
        query: {
          dateRangeId: fixture.departure._id.toString(),
          from: "2026-11-02",
          to: "2026-11-01",
        },
        status: 400,
      },
      {
        query: {
          dateRangeId: fixture.departure._id.toString(),
          granularity: "year",
        },
        status: 400,
      },
      {
        query: {
          dateRangeId: fixture.departure._id.toString(),
          limit: "10",
        },
        status: 400,
      },
      {
        query: {
          dateRangeId: fixture.departure._id.toString(),
          from: "1900-01-01",
          to: "2026-11-13",
          granularity: "month",
        },
        status: 400,
      },
      {
        query: {
          dateRangeId: fixture.departure._id.toString(),
          tourPackageId: otherFixture.tourPackage._id.toString(),
        },
        status: 400,
      },
    ];

    for (const testCase of cases) {
      const response = await getTrends(authorization, testCase.query);
      expect(response.status).toBe(testCase.status);
    }

    const missing = await getTrends(authorization, {
      dateRangeId: new Types.ObjectId().toString(),
    });
    expect(missing.status).toBe(404);
  });

  it("rejects a destination that does not belong to the departure", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#200009",
    );
    const fixture = await createControlFixture();
    const otherFixture = await createFixture("destination");

    const response = await getTrends(authorization, {
      dateRangeId: fixture.departure._id.toString(),
      destinationId: otherFixture.destination._id.toString(),
    });

    expect(response.status).toBe(404);
  });
});
