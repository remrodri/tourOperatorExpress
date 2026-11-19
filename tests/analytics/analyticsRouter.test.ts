import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { generateToken } from "../../src/utils/jwt";
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
    lastName: "Analítica",
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
    imageFolder: `destino-${suffix}`,
    images: [],
    deleted: false,
  });

const createTourPackage = (
  destinationId: mongoose.Types.ObjectId,
  suffix: string,
) =>
  TourPackageModel.create({
    name: `Paquete ${suffix}`,
    tourType: new mongoose.Types.ObjectId(),
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
  tourPackageId: mongoose.Types.ObjectId,
  suffix: string,
) =>
  DateRangeModel.create({
    dates: [],
    startDate: new Date("2026-02-10T00:00:00.000Z"),
    endDate: new Date("2026-02-12T00:00:00.000Z"),
    capacity: 20,
    state: "pending",
    guides: [],
    tourPackageId: tourPackageId.toString(),
    dataOrigin: "simulated",
    simulationId: `departure-${suffix}`,
  });

describe("Analytics foundation contract", () => {
  it("rejects requests without a token", async () => {
    const response = await request(app).get("/api/v1/analytics");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      statusCode: 401,
      message: "No se encontro el token de autenticacion",
      data: null,
    });
  });

  it("rejects guia de turismo with a controlled error", async () => {
    const authorization = await authorizationForRole(
      "guia de turismo",
      "#000001",
    );

    const response = await request(app)
      .get("/api/v1/analytics")
      .set("Authorization", authorization);

    expect(response.status).toBe(403);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toContain("permisos");
  });

  it("returns the foundation contract for administrador without filters", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#000002",
    );

    const response = await request(app)
      .get("/api/v1/analytics")
      .set("Authorization", authorization);

    expect(response.status).toBe(200);
    expect(response.body.statusCode).toBe(200);
    expect(response.body.meta).toMatchObject({
      module: "analytics",
      contractVersion: "1.0.0",
      release: "t808-v1",
      status: "foundation",
      period: { from: null, to: null },
      filters: {},
    });
    expect(response.body.data.filters).toEqual({});
    expect(response.body.data.capabilities.descriptive.status).toBe("planned");
    expect(response.body.data.capabilities.predictive.status).toBe("planned");
    expect(response.body.data.access.roles).toEqual([
      "administrador",
      "operador de ventas",
    ]);
    expect(response.body.data.privacy).toEqual({
      dataOrigin: "simulated",
      aggregatesOnly: true,
      includesPii: false,
      calculationLayer: "backend",
    });
    expect(response.body.data.metadata).toBeUndefined();
    expect(response.body.data.warnings).toBeUndefined();
    expect(response.body.warnings).toHaveLength(2);
    expect(JSON.stringify(response.body)).not.toContain("email");
    expect(JSON.stringify(response.body)).not.toContain("tourists");
  });

  it("normalizes dates and echoes valid filters for operador de ventas", async () => {
    const authorization = await authorizationForRole(
      "operador de ventas",
      "#000003",
    );
    const destination = await createDestination("a");
    const tourPackage = await createTourPackage(destination._id, "a");
    const departure = await createDeparture(tourPackage._id, "a");

    const response = await request(app)
      .get("/api/v1/analytics")
      .query({
        from: "2026-01-01",
        to: "2026-01-31",
        tourPackageId: tourPackage._id.toString(),
        destinationId: destination._id.toString(),
        dateRangeId: departure._id.toString(),
      })
      .set("Authorization", authorization);

    const expectedFilters = {
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T00:00:00.000Z",
      tourPackageId: tourPackage._id.toString(),
      destinationId: destination._id.toString(),
      dateRangeId: departure._id.toString(),
    };

    expect(response.status).toBe(200);
    expect(response.body.data.filters).toEqual(expectedFilters);
    expect(response.body.meta.filters).toEqual(expectedFilters);
    expect(response.body.meta.period).toEqual({
      from: expectedFilters.from,
      to: expectedFilters.to,
    });
  });

  it.each([
    [{ from: "2026-01-01" }, "to"],
    [{ from: "2026-02-01", to: "2026-01-01" }, "from"],
    [{ tourPackageId: "no-es-object-id" }, "tourPackageId"],
    [{ limit: "10" }, ""],
  ])("rejects invalid filter %j", async (query, field) => {
    const authorization = await authorizationForRole(
      "administrador",
      `#0000${field.length}`,
    );

    const response = await request(app)
      .get("/api/v1/analytics")
      .query(query)
      .set("Authorization", authorization);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Datos inválidos enviados");
    expect(
      response.body.data.some(
        (issue: { field: string }) => issue.field === field,
      ),
    ).toBe(true);
  });

  it("returns 404 when a filtered reference does not exist", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#000005",
    );

    const response = await request(app)
      .get("/api/v1/analytics")
      .query({ tourPackageId: new mongoose.Types.ObjectId().toString() })
      .set("Authorization", authorization);

    expect(response.status).toBe(404);
    expect(response.body.data).toBeNull();
  });

  it("returns 404 when a filtered destination does not exist", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#000008",
    );

    const response = await request(app)
      .get("/api/v1/analytics")
      .query({ destinationId: new mongoose.Types.ObjectId().toString() })
      .set("Authorization", authorization);

    expect(response.status).toBe(404);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toContain("destino");
  });

  it("returns 404 when a filtered departure does not exist", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#000009",
    );

    const response = await request(app)
      .get("/api/v1/analytics")
      .query({ dateRangeId: new mongoose.Types.ObjectId().toString() })
      .set("Authorization", authorization);

    expect(response.status).toBe(404);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toContain("salida");
  });

  it("omits blank identifiers instead of echoing them as filters", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#000010",
    );

    const response = await request(app)
      .get("/api/v1/analytics")
      .query({ tourPackageId: "", destinationId: "   " })
      .set("Authorization", authorization);

    expect(response.status).toBe(200);
    expect(response.body.data.filters).toEqual({});
    expect(response.body.meta.filters).toEqual({});
  });

  it("rejects a package that does not belong to the destination", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#000006",
    );
    const destinationA = await createDestination("b");
    const destinationB = await createDestination("c");
    const tourPackage = await createTourPackage(destinationA._id, "b");

    const response = await request(app)
      .get("/api/v1/analytics")
      .query({
        tourPackageId: tourPackage._id.toString(),
        destinationId: destinationB._id.toString(),
      })
      .set("Authorization", authorization);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("no pertenece al destino");
  });

  it("rejects a departure that does not belong to the package", async () => {
    const authorization = await authorizationForRole(
      "administrador",
      "#000007",
    );
    const destination = await createDestination("d");
    const firstPackage = await createTourPackage(destination._id, "d");
    const secondPackage = await createTourPackage(destination._id, "e");
    const departure = await createDeparture(firstPackage._id, "b");

    const response = await request(app)
      .get("/api/v1/analytics")
      .query({
        tourPackageId: secondPackage._id.toString(),
        dateRangeId: departure._id.toString(),
      })
      .set("Authorization", authorization);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("no pertenece al paquete");
  });
});
