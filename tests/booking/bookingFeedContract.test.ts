import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { BookingModel } from "../../src/modules/booking/model/BookingModel";
import { TouristModel } from "../../src/modules/tourist/model/TouristModel";
import { PaymentModel } from "../../src/modules/payment/model/PaymentModel";

const objectId = () => new mongoose.Types.ObjectId();

const createBooking = async (overrides: Record<string, unknown> = {}) =>
  BookingModel.collection.insertOne({
    touristsIds: [],
    dateRangeId: objectId(),
    notes: "Reserva de prueba",
    paymentIds: [],
    sellerId: objectId(),
    status: "pending",
    totalPrice: 100,
    tourPackageId: objectId(),
    paymentProofFolder: "tests",
    attendance: [],
    cancellationFee: 0,
    refundAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe("Booking feed contract", () => {
  it("paginates 25 by default without duplicates and in stable order", async () => {
    const base = new Date("2026-01-01T00:00:00.000Z").getTime();
    for (let index = 0; index < 30; index++) {
      await createBooking({
        createdAt: new Date(base + index * 1000),
        bookingCode: `RSV-${index}`,
      });
    }

    const first = await request(app).get("/api/v1/bookings/feed");
    expect(first.status).toBe(200);
    expect(first.body.data.items).toHaveLength(25);
    expect(first.body.data.pagination.hasMore).toBe(true);
    expect(first.body.data.pagination.nextCursor).toEqual(expect.any(String));

    const second = await request(app)
      .get("/api/v1/bookings/feed")
      .query({ cursor: first.body.data.pagination.nextCursor });
    expect(second.status).toBe(200);
    expect(second.body.data.items).toHaveLength(5);
    expect(second.body.data.pagination.hasMore).toBe(false);
    expect(second.body.data.pagination.nextCursor).toBeNull();

    const firstIds = first.body.data.items.map(
      (item: { id: string }) => item.id
    );
    const secondIds = second.body.data.items.map(
      (item: { id: string }) => item.id
    );
    expect(new Set([...firstIds, ...secondIds]).size).toBe(30);
    expect(first.body.data.items[0].bookingCode).toBe("RSV-29");
    expect(second.body.data.items.at(-1).bookingCode).toBe("RSV-0");
  });

  it("rejects invalid cursors and applies filters on the server", async () => {
    await createBooking({
      bookingCode: "RSV-ALPHA",
      status: "confirmed",
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    });
    await createBooking({
      bookingCode: "RSV-BETA",
      status: "cancelled",
      createdAt: new Date("2026-02-02T00:00:00.000Z"),
    });

    const invalid = await request(app)
      .get("/api/v1/bookings/feed")
      .query({ cursor: "no-es-un-cursor" });
    expect(invalid.status).toBe(400);

    const byStatus = await request(app)
      .get("/api/v1/bookings/feed")
      .query({ status: "confirmed", limit: 100 });
    expect(byStatus.body.data.items).toHaveLength(1);
    expect(byStatus.body.data.items[0].bookingCode).toBe("RSV-ALPHA");

    const byCode = await request(app)
      .get("/api/v1/bookings/feed")
      .query({ bookingCode: "rsv-beta" });
    expect(byCode.body.data.items).toHaveLength(1);
    expect(byCode.body.data.items[0].status).toBe("cancelled");
  });

  it("returns booking detail with tourists and payments", async () => {
    const touristId = objectId();
    const bookingId = objectId();
    const paymentId = objectId();

    await TouristModel.collection.insertOne({
      _id: touristId,
      firstName: "Ana",
      lastName: "Pérez",
      phone: "70000000",
      email: "ana@example.test",
      nationality: "Boliviana",
      documentType: "ci",
      ci: "1234567",
      bookingIds: [bookingId.toString()],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await BookingModel.collection.insertOne({
      _id: bookingId,
      touristsIds: [touristId],
      dateRangeId: objectId(),
      notes: "Detalle",
      paymentIds: [paymentId],
      sellerId: objectId(),
      status: "confirmed",
      totalPrice: 250,
      tourPackageId: objectId(),
      paymentProofFolder: "tests",
      attendance: [{ touristId, status: "absent" }],
      cancellationFee: 0,
      refundAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await PaymentModel.collection.insertOne({
      _id: paymentId,
      amount: 100,
      paymentDate: "2026-01-01",
      paymentMethod: "cash",
      bookingId: bookingId.toString(),
      paymentProofImage: "",
      sellerId: objectId().toString(),
      touristId: touristId.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app).get(
      `/api/v1/bookings/${bookingId}/detail`
    );

    expect(response.status).toBe(200);
    expect(response.body.data.booking.id).toBe(bookingId.toString());
    expect(response.body.data.booking.payments).toHaveLength(1);
    expect(response.body.data.tourists).toHaveLength(1);
    expect(response.body.data.tourists[0].firstName).toBe("Ana");
  });

  it("returns report and departure summaries without exposing bookings", async () => {
    const dateRangeId = objectId();
    const tourPackageId = objectId();
    const sellerId = objectId();

    await createBooking({
      dateRangeId,
      tourPackageId,
      sellerId,
      status: "confirmed",
      totalPrice: 200,
      touristsIds: [objectId(), objectId()],
      createdAt: new Date("2026-03-15T00:00:00.000Z"),
    });
    await createBooking({
      dateRangeId,
      tourPackageId,
      sellerId,
      status: "cancelled",
      totalPrice: 500,
      cancellationFee: 50,
      touristsIds: [objectId()],
      createdAt: new Date("2026-03-16T00:00:00.000Z"),
    });

    const report = await request(app).get("/api/v1/bookings/report-summary");
    expect(report.status).toBe(200);
    expect(report.body.data.totalBookings).toBe(2);
    expect(report.body.data.totalRevenue).toBe(250);
    expect(report.body.data.years).toContain(2026);
    expect(report.body.data.byTourPackageMonth).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tourPackageId: tourPackageId.toString(),
          year: 2026,
          month: 3,
          count: 2,
        }),
      ])
    );
    expect(report.body.data.bySellerTourPackage[0]).toEqual(
      expect.objectContaining({
        sellerId: sellerId.toString(),
        tourPackageId: tourPackageId.toString(),
        count: 2,
      })
    );

    const departure = await request(app)
      .get("/api/v1/bookings/date-range-summary")
      .query({ dateRangeId: dateRangeId.toString() });
    expect(departure.status).toBe(200);
    expect(departure.body.data).toEqual({
      bookingCount: 2,
      touristCount: 3,
    });
  });
});
