import request from "supertest";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import app from "../../../src/app";
import { UserModel } from "../../../src/modules/user/model/userModel";

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await UserModel.create({
      email: "route@example.com",
      password: await bcrypt.hash("password123", 10),
      deleted: false,
      role: new mongoose.Types.ObjectId(),
      ci: "route-ci",
      phone: "5551234567",
      lastName: "Route",
      firstName: "User",
      address: "Test address",
    });
  });

  it("returns 200 and a token for valid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "route@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });

  it("returns 401 for invalid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "route@example.com", password: "wrongpassword" });

    expect(response.status).toBe(401);
  });
});
