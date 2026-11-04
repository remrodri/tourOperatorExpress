import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// nanoid v5 publica ESM y la suite actual se ejecuta como CommonJS.
// El mock mantiene esta compatibilidad limitada al entorno de pruebas.
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "test-booking-code"),
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = await mongoose.connection.db?.collections();
  for (const collection of collections!) {
    await collection.deleteMany({});
  }
});
