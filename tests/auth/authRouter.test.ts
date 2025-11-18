import request from "supertest";
// import app from '../../src/app';
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import app from "../../src/app";
import { UserModel } from '../../src/modules/user/model/userModel';

describe("Auth Routes", () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    await UserModel.create({
      email: "test@example.com",
      password: hashedPassword,
      deleted: false,
      role: new mongoose.Types.ObjectId(),
      ci: "123456789",
      phone: "5551234567",
      lastName: "Test",
      firstName: "User",
      address: "123 Test Street",
      imagePath: "test.jpg",
    });
  });

  it("POST /api/v1/auth/login should return 200 and token for valid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });

  it("POST /api/v1/auth/login should return 401 for invalid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });

    expect(response.status).toBe(401);
  });
});
