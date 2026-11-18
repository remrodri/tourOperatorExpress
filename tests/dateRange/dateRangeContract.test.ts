import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { BookingModel } from "../../src/modules/booking/model/BookingModel";
import { DateRangeModel } from "../../src/modules/dateRange/model/DateRangeModel";
import { TourPackageModel } from "../../src/modules/tourPackage/model/TourPackageModel";

const objectId = () => new mongoose.Types.ObjectId();

const createTourPackage = async () =>
  TourPackageModel.create({
    name: "Salida ficticia de prueba",
    tourType: objectId(),
    touristDestination: objectId(),
    duration: 2,
    dateRanges: [],
    price: 100,
    itinerary: { days: [{ dayNumber: 1, activities: [] }] },
    status: "active",
  });

describe("DateRange departure contract", () => {
  it("creates a departure with normalized fields and keeps dateRangeId consumers working", async () => {
    const tourPackage = await createTourPackage();

    const response = await request(app).post("/api/v1/date-range").send({
      dates: ["15-01-2026", "16-01-2026"],
      capacity: 12,
      guides: [],
      tourPackageId: tourPackage._id.toString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.data.dates).toEqual(["15-01-2026", "16-01-2026"]);
    expect(response.body.data.startDate).toBe("2026-01-15T00:00:00.000Z");
    expect(response.body.data.endDate).toBe("2026-01-16T00:00:00.000Z");
    expect(response.body.data.capacity).toBe(12);
    expect(response.body.data.dataOrigin).toBe("manual");
    expect(response.body.data.state).toBe("pending");
    expect(response.body.data.tourPackageId).toBe(
      tourPackage._id.toString()
    );
    expect(response.body.data.createdAt).toBeDefined();
    expect(response.body.data.updatedAt).toBeDefined();

    const storedDateRange = await DateRangeModel.findById(
      response.body.data.id
    );
    expect(storedDateRange?.startDate?.toISOString()).toBe(
      "2026-01-15T00:00:00.000Z"
    );
    expect(storedDateRange?.endDate?.toISOString()).toBe(
      "2026-01-16T00:00:00.000Z"
    );
    expect(storedDateRange?.capacity).toBe(12);
    expect(storedDateRange?.state).toBe("pending");
    expect(storedDateRange?.createdAt).toBeDefined();
    expect(storedDateRange?.updatedAt).toBeDefined();

    const updatedTourPackage = await TourPackageModel.findById(tourPackage._id);
    expect(updatedTourPackage?.dateRanges.map(String)).toContain(
      response.body.data.id
    );

    const booking = await BookingModel.create({
      touristsIds: [],
      dateRangeId: response.body.data.id,
      sellerId: objectId(),
      status: "pending",
      totalPrice: 100,
      tourPackageId: tourPackage._id,
      paymentProofFolder: "simulated",
    });

    const resolvedDateRange = await DateRangeModel.findById(booking.dateRangeId);
    expect(resolvedDateRange?._id.toString()).toBe(response.body.data.id);
  });

  it("projects legacy records with derived bounds and without invented capacity", async () => {
    const tourPackageId = objectId();
    await DateRangeModel.collection.insertOne({
      dates: ["01-02-2026", "02-02-2026"],
      state: "pending",
      guides: [],
      tourPackageId,
    });

    const response = await request(app).get("/api/v1/date-range");

    expect(response.status).toBe(200);
    const legacyRange = response.body.data.find(
      (range: { dates: string[] }) =>
        range.dates.includes("01-02-2026") && range.dates.includes("02-02-2026")
    );

    expect(legacyRange).toBeDefined();
    expect(legacyRange.startDate).toBe("2026-02-01T00:00:00.000Z");
    expect(legacyRange.endDate).toBe("2026-02-02T00:00:00.000Z");
    expect(legacyRange.capacity).toBeUndefined();
    expect(legacyRange.dataOrigin).toBe("legacy");
  });

  it("rejects new departures without a positive integer capacity", async () => {
    const tourPackage = await createTourPackage();

    const response = await request(app).post("/api/v1/date-range").send({
      dates: ["15-01-2026"],
      capacity: 0,
      guides: [],
      tourPackageId: tourPackage._id.toString(),
    });

    expect(response.status).toBe(400);
  });

  it("rejects impossible legacy dates before persisting a departure", async () => {
    const tourPackage = await createTourPackage();

    const response = await request(app).post("/api/v1/date-range").send({
      dates: ["31-02-2026"],
      capacity: 10,
      guides: [],
      tourPackageId: tourPackage._id.toString(),
    });

    expect(response.status).toBe(400);
  });

  it("rederives bounds when legacy dates change through the update route", async () => {
    const tourPackage = await createTourPackage();

    const created = await request(app).post("/api/v1/date-range").send({
      dates: ["10-04-2026", "11-04-2026"],
      capacity: 8,
      guides: [],
      tourPackageId: tourPackage._id.toString(),
    });

    const response = await request(app)
      .put(`/api/v1/date-range/${created.body.data.id}`)
      .send({ dates: ["20-04-2026", "22-04-2026"] });

    expect(response.status).toBe(200);
    expect(response.body.data.dates).toEqual(["20-04-2026", "22-04-2026"]);
    expect(response.body.data.startDate).toBe("2026-04-20T00:00:00.000Z");
    expect(response.body.data.endDate).toBe("2026-04-22T00:00:00.000Z");
    expect(response.body.data.capacity).toBe(8);
  });
});
