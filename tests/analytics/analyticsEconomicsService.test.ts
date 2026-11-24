import { AnalyticsService } from "../../src/modules/analytics/service/AnalyticsService";
import type { IAnalyticsRepository, AnalyticsDepartureRaw } from "../../src/modules/analytics/repository/IAnalyticsRepository";

const raw: AnalyticsDepartureRaw = {
  id: "507f1f77bcf86cd799439011",
  startDate: new Date("2026-03-15"), endDate: new Date("2026-03-15"),
  state: "pending", dataOrigin: "simulated", capacity: 20,
  tourists: 6, bookings: 2, reservedRevenue: 3000, registeredPayments: 1000,
  tourPackage: null, destination: null,
  economicPlan: {
    currency: "BOB",
    fixedCosts: { transportation: 2000, guide: 500, administration: 300, fixedLodging: 0, other: 0 },
    variableCostsPerTourist: { food: 100, tickets: 50, lodging: 0, insurance: 0, other: 0 },
    pricePerTourist: 500,
    planningStartedAt: new Date("2026-01-01"), decisionDeadline: new Date("2026-03-08"),
    source: "simulated", version: "t1202-v1", updatedAt: new Date("2026-01-01"),
  },
};

const repository = {
  findDepartureById: jest.fn(),
} as unknown as IAnalyticsRepository;

describe("T-1205 AnalyticsService economics orchestration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("combines current confirmed demand with an available final estimate", async () => {
    repository.findDepartureById = jest.fn().mockResolvedValue(raw);
    const response = await new AnalyticsService(repository).getDepartureEconomics(raw.id, 14, "available", 9);
    expect(response.data).toMatchObject({
      confirmedTourists: 6, predictedFinalTourists: 9,
      status: "expected-viable", confirmedResult: -700, estimatedResult: 350,
    });
  });

  it("does not replace an unavailable prediction with zero", async () => {
    repository.findDepartureById = jest.fn().mockResolvedValue(raw);
    const response = await new AnalyticsService(repository).getDepartureEconomics(raw.id, 14, "stale-model", 9);
    expect(response.data).toMatchObject({
      confirmedTourists: 6, predictedFinalTourists: null,
      status: "below-break-even", estimatedResult: null, predictionUsed: false,
    });
    expect(response.warnings.join(" ")).toMatch(/PREDICTION_NOT_USED/);
  });
});
