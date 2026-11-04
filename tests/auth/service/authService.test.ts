import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { AuthService } from "../../../src/modules/auth/service/authService";
import { IAuthRepository } from "../../../src/modules/auth/repository/IAuthRepository";

describe("AuthService", () => {
  const findByEmail = jest.fn();
  const authRepository: IAuthRepository = { findByEmail };
  const authService = new AuthService(authRepository);

  beforeEach(() => {
    findByEmail.mockReset();
  });

  it("returns a token for valid credentials", async () => {
    findByEmail.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      firstName: "Service",
      lastName: "User",
      phone: "5551234567",
      email: "service@example.com",
      password: await bcrypt.hash("password123", 10),
      deleted: false,
      firstLogin: false,
      role: new mongoose.Types.ObjectId(),
      ci: "service-ci",
      address: "Test address",
    });

    await expect(
      authService.login({
        email: "service@example.com",
        password: "password123",
      })
    ).resolves.toEqual(expect.any(String));
  });

  it("throws for invalid credentials", async () => {
    findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: "wrong@example.com",
        password: "password123",
      })
    ).rejects.toThrow("Credenciales Invalidas");
  });
});
