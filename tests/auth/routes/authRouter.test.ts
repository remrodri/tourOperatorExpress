import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../../../src/app";
import mongoose from "mongoose";
import { UserModel } from "../../../src/modules/model/user/userModel";

jest.unmock("@repository/authRepository.ts");

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await UserModel.create({
      email: "test@example.com",
      password: hashedPassword,
      deleted: false,
      role: new mongoose.Types.ObjectId(),
      ci: "123456789",
      phone: "5551234567",
      lastName: "Test",
      firstName: "User",
    });
    console.log("user::: ", user);
  });

  it("should return 200 and a token for valid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    console.log("response.body::: ", response.body);
    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });

  it("should return 401 for invalid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "wrongpassword" });
    expect(response.status).toBe(401);
  });
});
