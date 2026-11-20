import mongoose, { Types } from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { generateToken } from "../../src/utils/jwt";
import { BookingModel } from "../../src/modules/booking/model/BookingModel";
import { DateRangeModel } from "../../src/modules/dateRange/model/DateRangeModel";
import { PaymentModel } from "../../src/modules/payment/model/PaymentModel";
import { RoleModel } from "../../src/modules/role/model/roleModel";
import { TourPackageModel } from "../../src/modules/tourPackage/model/TourPackageModel";
import { TouristDestinationModel } from "../../src/modules/touristDestination/model/TouristDestinationModel";

const createRole = (name: string, color: string) =>
  RoleModel.create({ name, color });

const tokenForRole = (roleId: string) =>
  generateToken({
    id: new mongoose.Types.ObjectId().toString(),
    firstName: "Prueba",
    lastName: "Descriptiva",
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
    imageFolder: `destino-descriptivo-${suffix}`,
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
  state?: "pending" | "completed" | "cancelled";
  dataOrigin?: "simulated" | "legacy" | "manual";
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
        ? new Date("2026-02-10T00:00:00.000Z")
        : options.startDate,
    endDate:
      options.endDate === undefined
        ? new Date("2026-02-12T00:00:00.000Z")
        : options.endDate,
    capacity: options.capacity === undefined ? 20 : options.capacity,
    state: options.state ?? "pending",
    guides: [],
    tourPackageId: tourPackageId.toString(),
    dataOrigin: options.dataOrigin ?? "simulated",
    simulationId: `departure-descriptive-${options.suffix ?? "a"}`,
  });

const createPayment = (amount: number) =>
  PaymentModel.create({
    amount,
    paymentDate: "2026-01-01",
    paymentMethod: "cash",
    bookingId: new Types.ObjectId().toString(),
    sellerId: new Types.ObjectId().toString(),
    touristId: new Types.ObjectId().toString(),
    dataOrigin: "simulated",
  });

interface BookingOptions {
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  touristCount?: number;
  totalPrice?: number;
  paymentIds?: Types.ObjectId[];
}

const createBooking = (
  departureId: Types.ObjectId,
  tourPackageId: Types.ObjectId,
  options: BookingOptions = {},
) =>
  BookingModel.create({
    touristsIds: Array.from(
      { length: options.touristCount ?? 1 },
      () => new Types.ObjectId(),
    ),
    dateRangeId: departureId,
    paymentIds: options.paymentIds ?? [],
    sellerId: new Types.ObjectId(),
    status: options.status ?? "confirmed",
    totalPrice: options.totalPrice ?? 100,
    tourPackageId,
    paymentProofFolder: "test",
    dataOrigin: "simulated",
  });

const createRawPaidBooking = async (
  departureId: Types.ObjectId,
  tourPackageId: Types.ObjectId,
  touristCount: number,
  totalPrice: number,
) => {
  const bookingId = new Types.ObjectId();

  await BookingModel.collection.insertOne({
    _id: bookingId,
    touristsIds: Array.from(
      { length: touristCount },
      () => new Types.ObjectId(),
    ),
    dateRangeId: departureId,
    paymentIds: [],
    sellerId: new Types.ObjectId(),
    status: "paid",
    totalPrice,
    tourPackageId,
    paymentProofFolder: "test",
    dataOrigin: "simulated",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return bookingId;
};

const createFixture = async (
  suffix = "a",
  options: DepartureOptions = {},
) => {
  const destination = await createDestination(suffix);
  const tourPackage = await createTourPackage(destination._id, suffix);
  const departure = await createDeparture(tourPackage._id, {
    ...options,
    suffix,
  });

  return { destination, tourPackage, departure };
};

const getSummary = (
  authorization: string,
  query: Record<string, string | number> = {},
) =>
  request(app)
    .get("/api/v1/analytics/summary")
    .query(query)
    .set("Authorization", authorization);

const getDepartures = (
  authorization: string,
  query: Record<string, string | number> = {},
) =>
  request(app)
    .get("/api/v1/analytics/departures")
    .query(query)
    .set("Authorization", authorization);

const getDepartureDetail = (
  authorization: string,
  id: string,
  query: Record<string, string | number> = {},
) =>
  request(app)
    .get(`/api/v1/analytics/departures/${id}`)
    .query(query)
    .set("Authorization", authorization);

describe("Analytics descriptive contract", () => {
  it("rejects requests without a token", async () => {
    const responses = await Promise.all([
      request(app).get("/api/v1/analytics/summary"),
      request(app).get("/api/v1/analytics/departures"),
      request(app).get(
        `/api/v1/analytics/departures/${new Types.ObjectId().toString()}`,
      ),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body.data).toBeNull();
    }
  });

  it("rejects guia de turismo on the three descriptive endpoints", async () => {
    const authorization = await authorizationForRole(
      "guia de turismo",
      "#100001",
    );
    const departureId = new Types.ObjectId().toString();

    const responses = await Promise.all([
      getSummary(authorization),
      getDepartures(authorization),
      getDepartureDetail(authorization, departureId),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(response.body.message).toContain("permisos");
    }
  });

  it("returns summary and list for administrador and operador", async () => {
    const fixture = await createFixture("roles");
    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      touristCount: 2,
      totalPrice: 200,
    });

    const admin = await authorizationForRole("administrador", "#100002");
    const operator = await authorizationForRole(
      "operador de ventas",
      "#100003",
    );

    const adminSummary = await getSummary(admin);
    const operatorSummary = await getSummary(operator);
    const adminList = await getDepartures(admin);
    const operatorList = await getDepartures(operator);

    expect(adminSummary.status).toBe(200);
    expect(operatorSummary.status).toBe(200);
    expect(adminList.status).toBe(200);
    expect(operatorList.status).toBe(200);
    expect(adminSummary.body.data.summary.tourists).toBe(2);
    expect(operatorSummary.body.data.summary.tourists).toBe(2);
    expect(adminList.body.data.items).toHaveLength(1);
    expect(operatorList.body.data.items).toHaveLength(1);
  });

  it("calculates the summary formulas and excludes cancelled bookings", async () => {
    const fixture = await createFixture("formulas", { capacity: 10 });
    const firstPayment = await createPayment(300);
    const secondPayment = await createPayment(200);
    const thirdPayment = await createPayment(100);
    const cancelledPayment = await createPayment(999);

    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "confirmed",
      touristCount: 3,
      totalPrice: 1000,
      paymentIds: [firstPayment._id, secondPayment._id],
    });
    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "pending",
      touristCount: 2,
      totalPrice: 500,
      paymentIds: [thirdPayment._id],
    });
    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "completed",
      touristCount: 1,
      totalPrice: 250,
    });
    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "cancelled",
      touristCount: 4,
      totalPrice: 999,
      paymentIds: [cancelledPayment._id],
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100004",
    );
    const response = await getSummary(authorization);
    const summary = response.body.data.summary;

    expect(response.status).toBe(200);
    expect(summary).toMatchObject({
      departures: 1,
      tourists: 6,
      bookings: 3,
      averageGroupSize: 2,
      averageGroupSizeStatus: "available",
      reservedRevenue: 1750,
      registeredPayments: 600,
      pendingBalance: 1150,
      pendingBalanceStatus: "pending",
      capacity: 10,
      availableSlots: 4,
      occupancy: 60,
      capacityStatus: "valid",
      invalidCapacityDepartures: 0,
      overcapacityDepartures: 0,
      overpaidDepartures: 0,
    });
    expect(response.body.meta).toMatchObject({
      module: "analytics",
      contractVersion: "1.1.0",
      release: "t809-v1",
      status: "descriptive",
      dataOrigin: "simulated",
      period: { from: null, to: null },
      filters: {},
    });
    expect(response.body.warnings[0]).toContain("Datos ficticios");
    expect(response.body.warnings).toHaveLength(1);
  });

  it("calculates summary average from totals instead of averaging departures", async () => {
    const fixture = await createFixture("average");
    const secondDeparture = await createDeparture(fixture.tourPackage._id, {
      suffix: "average-b",
    });

    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      touristCount: 4,
      totalPrice: 400,
    });
    await createBooking(secondDeparture._id, fixture.tourPackage._id, {
      touristCount: 1,
      totalPrice: 100,
    });
    await createBooking(secondDeparture._id, fixture.tourPackage._id, {
      touristCount: 1,
      totalPrice: 100,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100005",
    );
    const response = await getSummary(authorization);
    const summary = response.body.data.summary;

    expect(summary.tourists).toBe(6);
    expect(summary.bookings).toBe(3);
    expect(summary.averageGroupSize).toBe(2);
  });

  it("includes paid as a legacy alias and does not duplicate payments", async () => {
    const fixture = await createFixture("paid");
    const payment = await createPayment(100);

    await createRawPaidBooking(
      fixture.departure._id,
      fixture.tourPackage._id,
      2,
      400,
    );
    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "confirmed",
      touristCount: 1,
      totalPrice: 1000,
      paymentIds: [payment._id, payment._id],
    });
    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      status: "pending",
      touristCount: 1,
      totalPrice: 1000,
      paymentIds: [payment._id],
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100006",
    );
    const response = await getSummary(authorization);
    const summary = response.body.data.summary;

    expect(summary.tourists).toBe(4);
    expect(summary.bookings).toBe(3);
    expect(summary.reservedRevenue).toBe(2400);
    expect(summary.registeredPayments).toBe(100);
    expect(summary.pendingBalance).toBe(2300);
  });

  it("reports overpayment without a negative pending balance", async () => {
    const fixture = await createFixture("overpaid");
    const payment = await createPayment(150);

    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      touristCount: 1,
      totalPrice: 100,
      paymentIds: [payment._id],
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100007",
    );
    const summaryResponse = await getSummary(authorization);
    const detailResponse = await getDepartureDetail(
      authorization,
      fixture.departure._id.toString(),
    );

    expect(summaryResponse.body.data.summary.pendingBalance).toBe(0);
    expect(summaryResponse.body.data.summary.pendingBalanceStatus).toBe(
      "overpaid",
    );
    expect(summaryResponse.body.data.summary.overpaidDepartures).toBe(1);
    expect(
      summaryResponse.body.warnings.some((warning: string) =>
        warning.startsWith("OVERPAID"),
      ),
    ).toBe(true);
    expect(detailResponse.body.data.departure.pendingBalance).toBe(0);
    expect(detailResponse.body.data.departure.pendingBalanceStatus).toBe(
      "overpaid",
    );
  });

  it("returns coherent zeros for a departure without bookings", async () => {
    const fixture = await createFixture("no-bookings");
    const authorization = await authorizationForRole(
      "administrador",
      "#100008",
    );

    const summaryResponse = await getSummary(authorization);
    const detailResponse = await getDepartureDetail(
      authorization,
      fixture.departure._id.toString(),
    );
    const summary = summaryResponse.body.data.summary;
    const departure = detailResponse.body.data.departure;

    expect(summary).toMatchObject({
      tourists: 0,
      bookings: 0,
      averageGroupSize: null,
      averageGroupSizeStatus: "no-bookings",
      reservedRevenue: 0,
      registeredPayments: 0,
      pendingBalance: 0,
      pendingBalanceStatus: "no-bookings",
      capacity: 20,
      availableSlots: 20,
      occupancy: 0,
      capacityStatus: "valid",
    });
    expect(departure).toMatchObject({
      tourists: 0,
      bookings: 0,
      averageGroupSize: null,
      averageGroupSizeStatus: "no-bookings",
      capacity: 20,
      availableSlots: 20,
      occupancy: 0,
      capacityStatus: "valid",
    });
  });

  it("does not calculate occupancy or slots when capacity is invalid", async () => {
    const fixture = await createFixture("invalid");
    const invalidDeparture = await createDeparture(
      fixture.tourPackage._id,
      { capacity: null, suffix: "invalid-b" },
    );

    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      touristCount: 2,
      totalPrice: 200,
    });
    await createBooking(invalidDeparture._id, fixture.tourPackage._id, {
      touristCount: 3,
      totalPrice: 300,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100009",
    );
    const summaryResponse = await getSummary(authorization);
    const detailResponse = await getDepartureDetail(
      authorization,
      invalidDeparture._id.toString(),
    );
    const summary = summaryResponse.body.data.summary;
    const departure = detailResponse.body.data.departure;

    expect(summary.capacityStatus).toBe("partial");
    expect(summary.capacity).toBeNull();
    expect(summary.availableSlots).toBeNull();
    expect(summary.occupancy).toBeNull();
    expect(summary.invalidCapacityDepartures).toBe(1);
    expect(
      summaryResponse.body.warnings.some((warning: string) =>
        warning.startsWith("INVALID_CAPACITY"),
      ),
    ).toBe(true);
    expect(departure.capacityStatus).toBe("invalid");
    expect(departure.capacity).toBeNull();
    expect(departure.availableSlots).toBeNull();
    expect(departure.occupancy).toBeNull();
    expect(
      detailResponse.body.warnings.some((warning: string) =>
        warning.startsWith("INVALID_CAPACITY"),
      ),
    ).toBe(true);
  });

  it("preserves overcapacity occupancy and reports zero slots", async () => {
    const fixture = await createFixture("overcapacity");
    const smallDeparture = await createDeparture(fixture.tourPackage._id, {
      capacity: 2,
      suffix: "overcapacity-b",
    });

    await createBooking(smallDeparture._id, fixture.tourPackage._id, {
      touristCount: 3,
      totalPrice: 300,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100010",
    );
    const summaryResponse = await getSummary(authorization);
    const detailResponse = await getDepartureDetail(
      authorization,
      smallDeparture._id.toString(),
    );
    const summary = summaryResponse.body.data.summary;
    const departure = detailResponse.body.data.departure;

    expect(summary.overcapacityDepartures).toBe(1);
    expect(
      summaryResponse.body.warnings.some((warning: string) =>
        warning.startsWith("OVERCAPACITY"),
      ),
    ).toBe(true);
    expect(departure.capacityStatus).toBe("overcapacity");
    expect(departure.occupancy).toBe(150);
    expect(departure.availableSlots).toBe(0);
    expect(departure.capacity).toBe(2);
  });

  it("reports list warnings for invalid capacity and overcapacity", async () => {
    const destination = await createDestination("list-warnings");
    const tourPackage = await createTourPackage(
      destination._id,
      "list-warnings",
    );
    const invalidDeparture = await createDeparture(tourPackage._id, {
      capacity: null,
      suffix: "list-warnings-invalid",
    });
    const overcapacityDeparture = await createDeparture(tourPackage._id, {
      capacity: 2,
      suffix: "list-warnings-overcapacity",
    });
    await createBooking(overcapacityDeparture._id, tourPackage._id, {
      touristCount: 3,
      totalPrice: 300,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100020",
    );
    const response = await getDepartures(authorization);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(
      response.body.warnings.some((warning: string) =>
        warning.startsWith("INVALID_CAPACITY"),
      ),
    ).toBe(true);
    expect(
      response.body.warnings.some((warning: string) =>
        warning.startsWith("OVERCAPACITY"),
      ),
    ).toBe(true);
    expect(
      response.body.data.items.find(
        (item: { id: string }) =>
          item.id === invalidDeparture._id.toString(),
      ).capacityStatus,
    ).toBe("invalid");
    expect(
      response.body.data.items.find(
        (item: { id: string }) =>
          item.id === overcapacityDeparture._id.toString(),
      ).capacityStatus,
    ).toBe("overcapacity");
  });

  it("reports an invalid aggregate when every departure has invalid capacity", async () => {
    await createFixture("all-invalid", { capacity: null });
    const authorization = await authorizationForRole(
      "administrador",
      "#100021",
    );
    const response = await getSummary(authorization);
    const summary = response.body.data.summary;

    expect(response.status).toBe(200);
    expect(summary.capacityStatus).toBe("invalid");
    expect(summary.capacity).toBeNull();
    expect(summary.availableSlots).toBeNull();
    expect(summary.occupancy).toBeNull();
    expect(summary.invalidCapacityDepartures).toBe(1);
    expect(
      response.body.warnings.some((warning: string) =>
        warning.startsWith("INVALID_CAPACITY"),
      ),
    ).toBe(true);
  });

  it("applies date, package, destination and departure filters", async () => {
    const firstDestination = await createDestination("filter-a");
    const firstPackage = await createTourPackage(
      firstDestination._id,
      "filter-a",
    );
    const firstDeparture = await createDeparture(firstPackage._id, {
      startDate: new Date("2026-02-10T00:00:00.000Z"),
      endDate: new Date("2026-02-12T00:00:00.000Z"),
      capacity: 10,
      suffix: "filter-a",
    });
    await createBooking(firstDeparture._id, firstPackage._id, {
      touristCount: 2,
      totalPrice: 200,
    });

    const secondDestination = await createDestination("filter-b");
    const secondPackage = await createTourPackage(
      secondDestination._id,
      "filter-b",
    );
    const secondDeparture = await createDeparture(secondPackage._id, {
      startDate: new Date("2026-03-10T00:00:00.000Z"),
      endDate: new Date("2026-03-12T00:00:00.000Z"),
      capacity: 10,
      suffix: "filter-b",
    });
    await createBooking(secondDeparture._id, secondPackage._id, {
      touristCount: 3,
      totalPrice: 300,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100011",
    );

    const byPackage = await getSummary(authorization, {
      tourPackageId: firstPackage._id.toString(),
    });
    const byDestination = await getSummary(authorization, {
      destinationId: firstDestination._id.toString(),
    });
    const byDeparture = await getSummary(authorization, {
      dateRangeId: firstDeparture._id.toString(),
    });
    const byDate = await getSummary(authorization, {
      from: "2026-03-01",
      to: "2026-03-31",
    });
    const listByPackage = await getDepartures(authorization, {
      tourPackageId: firstPackage._id.toString(),
    });
    const detailByPackage = await getDepartureDetail(
      authorization,
      firstDeparture._id.toString(),
      { tourPackageId: firstPackage._id.toString() },
    );

    expect(byPackage.body.data.summary.tourists).toBe(2);
    expect(byDestination.body.data.summary.tourists).toBe(2);
    expect(byDeparture.body.data.summary.tourists).toBe(2);
    expect(byDate.body.data.summary.tourists).toBe(3);
    expect(listByPackage.body.data.items).toHaveLength(1);
    expect(listByPackage.body.data.items[0].id).toBe(
      firstDeparture._id.toString(),
    );
    expect(detailByPackage.status).toBe(200);
    expect(detailByPackage.body.data.departure.id).toBe(
      firstDeparture._id.toString(),
    );
    expect(detailByPackage.body.meta.filters.dateRangeId).toBe(
      firstDeparture._id.toString(),
    );
  });

  it("rejects invalid filters, contradictions and missing references", async () => {
    const firstDestination = await createDestination("invalid-filter-a");
    const firstPackage = await createTourPackage(
      firstDestination._id,
      "invalid-filter-a",
    );
    const firstDeparture = await createDeparture(firstPackage._id, {
      suffix: "invalid-filter-a",
    });
    const secondDestination = await createDestination("invalid-filter-b");
    const secondPackage = await createTourPackage(
      secondDestination._id,
      "invalid-filter-b",
    );

    const authorization = await authorizationForRole(
      "administrador",
      "#100012",
    );

    const missingPair = await getSummary(authorization, {
      from: "2026-01-01",
    });
    const inverted = await getSummary(authorization, {
      from: "2026-02-01",
      to: "2026-01-01",
    });
    const unknownParameter = await getSummary(authorization, { limit: "10" });
    const contradiction = await getSummary(authorization, {
      tourPackageId: firstPackage._id.toString(),
      destinationId: secondDestination._id.toString(),
    });
    const missingPackage = await getSummary(authorization, {
      tourPackageId: new Types.ObjectId().toString(),
    });
    const missingDestination = await getSummary(authorization, {
      destinationId: new Types.ObjectId().toString(),
    });
    const missingDeparture = await getSummary(authorization, {
      dateRangeId: new Types.ObjectId().toString(),
    });
    const detailContradiction = await getDepartureDetail(
      authorization,
      firstDeparture._id.toString(),
      { dateRangeId: new Types.ObjectId().toString() },
    );
    const detailFilterMismatch = await getDepartureDetail(
      authorization,
      firstDeparture._id.toString(),
      { tourPackageId: secondPackage._id.toString() },
    );
    const invalidDetailId = await getDepartureDetail(
      authorization,
      "no-es-object-id",
    );

    expect(missingPair.status).toBe(400);
    expect(inverted.status).toBe(400);
    expect(unknownParameter.status).toBe(400);
    expect(contradiction.status).toBe(400);
    expect(missingPackage.status).toBe(404);
    expect(missingDestination.status).toBe(404);
    expect(missingDeparture.status).toBe(404);
    expect(detailContradiction.status).toBe(400);
    expect(detailFilterMismatch.status).toBe(404);
    expect(invalidDetailId.status).toBe(400);
  });

  it("paginates with a stable cursor and rejects invalid limits or cursors", async () => {
    const destination = await createDestination("pagination");
    const tourPackage = await createTourPackage(
      destination._id,
      "pagination",
    );
    const departures = await Promise.all([
      createDeparture(tourPackage._id, {
        startDate: new Date("2026-01-04T00:00:00.000Z"),
        suffix: "pagination-4",
      }),
      createDeparture(tourPackage._id, {
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        suffix: "pagination-1",
      }),
      createDeparture(tourPackage._id, {
        startDate: new Date("2026-01-03T00:00:00.000Z"),
        suffix: "pagination-3",
      }),
      createDeparture(tourPackage._id, {
        startDate: new Date("2026-01-02T00:00:00.000Z"),
        suffix: "pagination-2",
      }),
    ]);

    const authorization = await authorizationForRole(
      "administrador",
      "#100013",
    );
    const firstPage = await getDepartures(authorization, { limit: "2" });
    const cursor = firstPage.body.data.pagination.nextCursor;
    const secondPage = await getDepartures(authorization, {
      limit: "2",
      cursor,
    });
    const invalidCursor = await getDepartures(authorization, {
      cursor: "no-es-un-cursor",
    });
    const invalidLimit = await getDepartures(authorization, { limit: "101" });
    const zeroLimit = await getDepartures(authorization, { limit: "0" });

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.pagination).toMatchObject({
      limit: 2,
      hasMore: true,
    });
    expect(firstPage.body.data.items.map((item: { id: string }) => item.id)).toEqual(
      [
        departures[1]._id.toString(),
        departures[3]._id.toString(),
      ],
    );
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data.pagination.hasMore).toBe(false);
    expect(secondPage.body.data.pagination.nextCursor).toBeNull();
    expect(secondPage.body.data.items.map((item: { id: string }) => item.id)).toEqual(
      [
        departures[2]._id.toString(),
        departures[0]._id.toString(),
      ],
    );
    expect(invalidCursor.status).toBe(400);
    expect(invalidLimit.status).toBe(400);
    expect(zeroLimit.status).toBe(400);
  });

  it("paginates from null start dates into dated departures", async () => {
    const destination = await createDestination("null-cursor");
    const tourPackage = await createTourPackage(
      destination._id,
      "null-cursor",
    );
    const firstNullDeparture = await createDeparture(tourPackage._id, {
      startDate: null,
      suffix: "null-cursor-a",
    });
    const secondNullDeparture = await createDeparture(tourPackage._id, {
      startDate: null,
      suffix: "null-cursor-b",
    });
    const datedDeparture = await createDeparture(tourPackage._id, {
      startDate: new Date("2026-07-01T00:00:00.000Z"),
      suffix: "null-cursor-c",
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100022",
    );
    const firstPage = await getDepartures(authorization, { limit: "1" });
    const secondPage = await getDepartures(authorization, {
      limit: "1",
      cursor: firstPage.body.data.pagination.nextCursor,
    });
    const thirdPage = await getDepartures(authorization, {
      limit: "1",
      cursor: secondPage.body.data.pagination.nextCursor,
    });

    expect(
      firstPage.body.data.items.map((item: { id: string }) => item.id),
    ).toEqual([firstNullDeparture._id.toString()]);
    expect(firstPage.body.data.pagination.hasMore).toBe(true);
    expect(
      secondPage.body.data.items.map((item: { id: string }) => item.id),
    ).toEqual([secondNullDeparture._id.toString()]);
    expect(secondPage.body.data.pagination.hasMore).toBe(true);
    expect(
      thirdPage.body.data.items.map((item: { id: string }) => item.id),
    ).toEqual([datedDeparture._id.toString()]);
    expect(thirdPage.body.data.pagination.hasMore).toBe(false);
    expect(thirdPage.body.data.pagination.nextCursor).toBeNull();
  });

  it("paginates correctly when departures share the same start date", async () => {
    const destination = await createDestination("ties");
    const tourPackage = await createTourPackage(destination._id, "ties");
    const sharedDate = new Date("2026-04-01T00:00:00.000Z");
    const departures = await Promise.all([
      createDeparture(tourPackage._id, {
        startDate: sharedDate,
        suffix: "ties-a",
      }),
      createDeparture(tourPackage._id, {
        startDate: sharedDate,
        suffix: "ties-b",
      }),
      createDeparture(tourPackage._id, {
        startDate: sharedDate,
        suffix: "ties-c",
      }),
    ]);

    const authorization = await authorizationForRole(
      "administrador",
      "#100014",
    );
    const collected: string[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 3; page += 1) {
      const response = await getDepartures(authorization, {
        limit: "1",
        ...(cursor ? { cursor } : {}),
      });

      expect(response.status).toBe(200);
      collected.push(...response.body.data.items.map((item: { id: string }) => item.id));
      cursor = response.body.data.pagination.nextCursor ?? undefined;
    }

    expect(collected).toHaveLength(3);
    expect(new Set(collected).size).toBe(3);
    expect(new Set(collected)).toEqual(
      new Set(departures.map((departure) => departure._id.toString())),
    );
  });

  it("returns no-data for an empty summary and an empty list", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#100015",
    );
    const summaryResponse = await getSummary(authorization);
    const listResponse = await getDepartures(authorization);
    const summary = summaryResponse.body.data.summary;

    expect(summaryResponse.status).toBe(200);
    expect(summary.departures).toBe(0);
    expect(summary.tourists).toBe(0);
    expect(summary.bookings).toBe(0);
    expect(summary.averageGroupSize).toBeNull();
    expect(summary.averageGroupSizeStatus).toBe("no-bookings");
    expect(summary.capacityStatus).toBe("no-data");
    expect(summary.capacity).toBeNull();
    expect(summary.availableSlots).toBeNull();
    expect(summary.occupancy).toBeNull();
    expect(
      summaryResponse.body.warnings.some((warning: string) =>
        warning.startsWith("NO_DATA"),
      ),
    ).toBe(true);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items).toEqual([]);
    expect(listResponse.body.data.pagination).toEqual({
      limit: 20,
      hasMore: false,
      nextCursor: null,
    });
    expect(
      listResponse.body.warnings.some((warning: string) =>
        warning.startsWith("NO_DATA"),
      ),
    ).toBe(true);
  });

  it("returns 404 for a missing departure detail", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#100016",
    );
    const response = await getDepartureDetail(
      authorization,
      new Types.ObjectId().toString(),
    );

    expect(response.status).toBe(404);
    expect(response.body.data).toBeNull();
  });

  it("keeps summary, list and detail metrics consistent", async () => {
    const fixture = await createFixture("consistency");
    const secondDeparture = await createDeparture(fixture.tourPackage._id, {
      capacity: 8,
      suffix: "consistency-b",
    });

    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      touristCount: 3,
      totalPrice: 300,
    });
    await createBooking(secondDeparture._id, fixture.tourPackage._id, {
      touristCount: 2,
      totalPrice: 200,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100017",
    );
    const summaryResponse = await getSummary(authorization);
    const listResponse = await getDepartures(authorization, { limit: "100" });
    const detailResponse = await getDepartureDetail(
      authorization,
      fixture.departure._id.toString(),
    );
    const summary = summaryResponse.body.data.summary;
    const items = listResponse.body.data.items;
    const totals = items.reduce(
      (
        accumulator: {
          tourists: number;
          bookings: number;
          reservedRevenue: number;
          registeredPayments: number;
          availableSlots: number;
        },
        item: {
          tourists: number;
          bookings: number;
          reservedRevenue: number;
          registeredPayments: number;
          availableSlots: number;
        },
      ) => ({
        tourists: accumulator.tourists + item.tourists,
        bookings: accumulator.bookings + item.bookings,
        reservedRevenue: accumulator.reservedRevenue + item.reservedRevenue,
        registeredPayments:
          accumulator.registeredPayments + item.registeredPayments,
        availableSlots: accumulator.availableSlots + item.availableSlots,
      }),
      {
        tourists: 0,
        bookings: 0,
        reservedRevenue: 0,
        registeredPayments: 0,
        availableSlots: 0,
      },
    );

    expect(summary.tourists).toBe(totals.tourists);
    expect(summary.bookings).toBe(totals.bookings);
    expect(summary.reservedRevenue).toBe(totals.reservedRevenue);
    expect(summary.registeredPayments).toBe(totals.registeredPayments);
    expect(summary.availableSlots).toBe(totals.availableSlots);
    expect(detailResponse.body.data.departure).toMatchObject(
      items.find(
        (item: { id: string }) =>
          item.id === fixture.departure._id.toString(),
      ),
    );
  });

  it("does not expose personal or payment-proof fields", async () => {
    const fixture = await createFixture("privacy");
    await createBooking(fixture.departure._id, fixture.tourPackage._id, {
      touristCount: 2,
      totalPrice: 200,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100018",
    );
    const responses = await Promise.all([
      getSummary(authorization),
      getDepartures(authorization),
      getDepartureDetail(authorization, fixture.departure._id.toString()),
    ]);
    const serialized = JSON.stringify(
      responses.map((response) => response.body),
    );

    expect(serialized).not.toContain("paymentProof");
    expect(serialized).not.toContain("touristsIds");
    expect(serialized).not.toContain("sellerId");
    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("@");
  });

  it("includes departures whose start date equals the filter boundaries", async () => {
    const fixture = await createFixture("boundary");
    const boundaryDeparture = await createDeparture(fixture.tourPackage._id, {
      startDate: new Date("2026-05-01T00:00:00.000Z"),
      endDate: new Date("2026-05-02T00:00:00.000Z"),
      suffix: "boundary-b",
    });
    await createBooking(boundaryDeparture._id, fixture.tourPackage._id, {
      touristCount: 1,
      totalPrice: 100,
    });

    const authorization = await authorizationForRole(
      "administrador",
      "#100019",
    );
    const response = await getSummary(authorization, {
      from: "2026-05-01",
      to: "2026-05-01",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.summary.departures).toBe(1);
    expect(response.body.data.summary.tourists).toBe(1);
  });
});
