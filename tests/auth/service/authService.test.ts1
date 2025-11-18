import bcrypt from "bcryptjs";
// import { AuthService } from "../../../src/modules/auth/service/authService.ts";
import { AuthService } from "../../../src/modules/auth/service/authService";
import { AuthRepository } from "@repository/authRepository";

jest.mock("@repository/authRepository.ts");

describe("AuthService", () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    authRepository = new AuthRepository() as jest.Mocked<AuthRepository>;
    authService = new AuthService(authRepository);
  });

  it("should return a token for valid credentials", async () => {
    authRepository.findByEmail.mockResolvedValue({
      _id: "userId",
      email: "test@Example.com",
      password: await bcrypt.hash("password123", 10),
      deleted: false,
      role: "userRole",
    } as any);

    const token = await authService.login({
      email: "test@Example.com",
      password: "password123",
    });
    expect(token).toBeDefined();
  });

  it("should throw an error for invalid credentials", async () => {
    authRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: "wrong@example.com", password: "password123" })
    ).rejects.toThrow("Credenciales Invalidas");
  });
});
