import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { TouristModel } from "../../src/modules/tourist/model/TouristModel";

const objectId = () => new mongoose.Types.ObjectId();

const createTourist = async (
  index: number,
  overrides: Record<string, unknown> = {}
) =>
  TouristModel.collection.insertOne({
    firstName: `Turista${index}`,
    lastName: "Prueba",
    phone: `7000${index}`,
    email: `turista${index}@example.test`,
    nationality: "Boliviana",
    documentType: "ci",
    ci: `CI-${index}`,
    passportNumber: `P-${index}`,
    dateOfBirth: "1990-01-01",
    bookingIds: [],
    createdAt: new Date(
      new Date("2026-04-01T00:00:00.000Z").getTime() + index * 1000
    ),
    updatedAt: new Date(),
    ...overrides,
  });

describe("Tourist feed contract", () => {
  it("paginates 50 by default and returns the remainder", async () => {
    for (let index = 0; index < 55; index++) {
      await createTourist(index);
    }

    const first = await request(app).get("/api/v1/tourists/feed");
    expect(first.status).toBe(200);
    expect(first.body.data.items).toHaveLength(50);
    expect(first.body.data.pagination.hasMore).toBe(true);

    const second = await request(app)
      .get("/api/v1/tourists/feed")
      .query({ cursor: first.body.data.pagination.nextCursor });
    expect(second.status).toBe(200);
    expect(second.body.data.items).toHaveLength(5);
    expect(second.body.data.pagination.hasMore).toBe(false);

    const ids = [
      ...first.body.data.items.map((item: { id: string }) => item.id),
      ...second.body.data.items.map((item: { id: string }) => item.id),
    ];
    expect(new Set(ids).size).toBe(55);
  });

  it("searches by document, name and email on the server", async () => {
    await createTourist(1, {
      firstName: "Lucía",
      ci: "998877",
      email: "lucia@example.test",
    });
    await createTourist(2, {
      firstName: "Mario",
      ci: "112233",
      email: "mario@example.test",
    });

    const byCi = await request(app)
      .get("/api/v1/tourists/feed")
      .query({ search: "998877" });
    expect(byCi.body.data.items).toHaveLength(1);
    expect(byCi.body.data.items[0].firstName).toBe("Lucía");

    const byName = await request(app)
      .get("/api/v1/tourists/feed")
      .query({ search: "mario" });
    expect(byName.body.data.items).toHaveLength(1);
    expect(byName.body.data.items[0].email).toBe("mario@example.test");

    const byEmail = await request(app)
      .get("/api/v1/tourists/feed")
      .query({ search: "lucia@example.test" });
    expect(byEmail.body.data.items).toHaveLength(1);
  });

  it("returns tourists by ids and the total count", async () => {
    const firstId = objectId();
    const secondId = objectId();
    await createTourist(1, { _id: firstId });
    await createTourist(2, { _id: secondId });
    await createTourist(3);

    const byIds = await request(app)
      .get("/api/v1/tourists/by-ids")
      .query({ ids: `${firstId},${secondId}` });
    expect(byIds.status).toBe(200);
    expect(byIds.body.data).toHaveLength(2);
    expect(byIds.body.data.map((item: { id: string }) => item.id).sort()).toEqual(
      [firstId.toString(), secondId.toString()].sort()
    );

    const count = await request(app).get("/api/v1/tourists/count");
    expect(count.status).toBe(200);
    expect(count.body.data.total).toBe(3);
  });

  it("rejects invalid cursors", async () => {
    const response = await request(app)
      .get("/api/v1/tourists/feed")
      .query({ cursor: "invalido" });
    expect(response.status).toBe(400);
  });
});
