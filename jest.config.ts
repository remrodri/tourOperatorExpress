import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], // Corregido
  testMatch: ["<rootDir>/tests/**/*.test.ts"], // Ruta para tus pruebas
  moduleFileExtensions: ["ts", "js", "json"],
  testPathIgnorePatterns: ["/node_modules/"],
  moduleNameMapper: {
    // Agrega tus alias aquí
    "^@repository/(.*)$": "<rootDir>/src/modules/auth/repository/$1",
    "^@service/(.*)$": "<rootDir>/src/modules/auth/service/$1",
    "^@controller/(.*)$": "<rootDir>/src/modules/auth/controller/$1",
  },
};

export default config;
