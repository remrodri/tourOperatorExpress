import mongoose from "mongoose";
import { BookingModel } from "../../src/modules/booking/model/BookingModel";
import { DateRangeModel } from "../../src/modules/dateRange/model/DateRangeModel";
import { PaymentModel } from "../../src/modules/payment/model/PaymentModel";
import { TouristModel } from "../../src/modules/tourist/model/TouristModel";
import { TourPackageModel } from "../../src/modules/tourPackage/model/TourPackageModel";
import {
  DEFAULT_SIMULATION_CONFIG,
  SimulationConfig,
} from "../../src/database/simulation/simulationConfig";
import { SimulationReferenceData } from "../../src/database/simulation/simulationPlan";

const objectId = (value: number): string =>
  value.toString(16).padStart(24, "0");

export const LEGACY_DATE_RANGE_IDS = [
  "691248c54a93776353e4bcc8",
  "6912c5fe4a93776353e4d1ad",
  "6912c7cd4a93776353e4d1cc",
  "691e4ff3916130b27141e083",
  "691f8152f02763fee2ba4d39",
  "691f8204f02763fee2ba4dda",
];

const LEGACY_PACKAGE_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const LEGACY_DESTINATION_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const LEGACY_TOUR_TYPE_ID = "cccccccccccccccccccccccc";
const LEGACY_SELLER_ID = "dddddddddddddddddddddddd";
const LEGACY_TOURIST_ID = "eeeeeeeeeeeeeeeeeeeeeeee";
const LEGACY_BOOKING_ID = "ffffffffffffffffffffffff";
const LEGACY_PAYMENT_ID = "111111111111111111111111";

const LEGACY_CREATED_AT = new Date("2025-11-01T00:00:00.000Z");
const LEGACY_UPDATED_AT = new Date("2025-11-02T00:00:00.000Z");

export const makeReferenceData = (): SimulationReferenceData => ({
  destinations: [
    "Incachaca",
    "Salar de Uyuni",
    "Laguna Corani",
    "Cañon de Tuta Wallpa",
    "Toro Toro",
    "Villa Tunari",
  ].map((name, index) => ({ id: objectId(index + 1), name })),
  tourTypes: [
    "Tour cultural",
    "Tour gastronómico",
    "Tour de aventura",
    "Tour ecoturístico",
    "Tour religioso",
    "City tour",
    "Tour fotográfico",
    "Tour agroturismo",
  ].map((name, index) => ({ id: objectId(index + 20), name })),
  sellers: [{ id: objectId(100) }, { id: objectId(101) }],
  guides: [{ id: objectId(200) }, { id: objectId(201) }],
});

export const makeSmallConfig = (
  overrides: Partial<SimulationConfig> = {}
): SimulationConfig => ({
  ...DEFAULT_SIMULATION_CONFIG,
  seed: 12345,
  periodStart: "2025-01-01",
  periodEnd: "2025-06-30",
  asOf: "2025-04-15",
  departureIntervalDays: 45,
  ...overrides,
});

export const insertLegacyDocuments = async (): Promise<void> => {
  await DateRangeModel.collection.insertMany(
    LEGACY_DATE_RANGE_IDS.map((id) => ({
      _id: new mongoose.Types.ObjectId(id),
      dates: ["30-11-2025"],
      startDate: new Date("2025-11-30T00:00:00.000Z"),
      endDate: new Date("2025-11-30T00:00:00.000Z"),
      capacity: 20,
      dataOrigin: "legacy",
      state: "completed",
      guides: [],
      tourPackageId: new mongoose.Types.ObjectId(LEGACY_PACKAGE_ID),
      createdAt: LEGACY_CREATED_AT,
      updatedAt: LEGACY_UPDATED_AT,
    }))
  );

  await TourPackageModel.collection.insertOne({
    _id: new mongoose.Types.ObjectId(LEGACY_PACKAGE_ID),
    name: "Paquete legado de prueba",
    tourType: new mongoose.Types.ObjectId(LEGACY_TOUR_TYPE_ID),
    touristDestination: new mongoose.Types.ObjectId(LEGACY_DESTINATION_ID),
    duration: 1,
    dateRanges: LEGACY_DATE_RANGE_IDS.map(
      (id) => new mongoose.Types.ObjectId(id)
    ),
    price: 100,
    itinerary: { days: [{ dayNumber: 1, activities: [] }] },
    status: "active",
    deleted: false,
    createdAt: LEGACY_CREATED_AT,
    updatedAt: LEGACY_UPDATED_AT,
  });

  await TouristModel.collection.insertOne({
    _id: new mongoose.Types.ObjectId(LEGACY_TOURIST_ID),
    firstName: "Turista",
    lastName: "Legado",
    phone: "70000000",
    email: "legado@example.com",
    nationality: "Boliviana",
    documentType: "CI",
    ci: "1234567",
    passportNumber: "",
    dateOfBirth: "1990-01-01",
    bookingIds: [LEGACY_BOOKING_ID],
    createdAt: LEGACY_CREATED_AT,
    updatedAt: LEGACY_UPDATED_AT,
  });

  await BookingModel.collection.insertOne({
    _id: new mongoose.Types.ObjectId(LEGACY_BOOKING_ID),
    touristsIds: [new mongoose.Types.ObjectId(LEGACY_TOURIST_ID)],
    dateRangeId: new mongoose.Types.ObjectId(LEGACY_DATE_RANGE_IDS[0]),
    notes: "Reserva legada de prueba",
    paymentIds: [new mongoose.Types.ObjectId(LEGACY_PAYMENT_ID)],
    sellerId: new mongoose.Types.ObjectId(LEGACY_SELLER_ID),
    status: "pending",
    totalPrice: 100,
    tourPackageId: new mongoose.Types.ObjectId(LEGACY_PACKAGE_ID),
    paymentProofFolder: "legacy",
    attendance: [],
    cancellationFee: 0,
    refundAmount: 0,
    refundedAt: null,
    bookingCode: "RSV-LEGACY000001",
    createdAt: LEGACY_CREATED_AT,
    updatedAt: LEGACY_UPDATED_AT,
  });

  await PaymentModel.collection.insertOne({
    _id: new mongoose.Types.ObjectId(LEGACY_PAYMENT_ID),
    amount: 50,
    paymentDate: "2025-11-01",
    paymentMethod: "cash",
    bookingId: LEGACY_BOOKING_ID,
    paymentProofImage: "",
    sellerId: LEGACY_SELLER_ID,
    touristId: LEGACY_TOURIST_ID,
    createdAt: LEGACY_CREATED_AT,
    updatedAt: LEGACY_UPDATED_AT,
  });
};
