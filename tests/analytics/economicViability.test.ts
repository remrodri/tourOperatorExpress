import { calculateEconomicViability } from "../../src/modules/analytics/domain/economicViability";
import type { EconomicPlan } from "../../src/modules/dateRange/domain/economicPlanning";

const plan: EconomicPlan = {
  currency: "BOB",
  fixedCosts: { transportation: 2000, guide: 500, administration: 300, fixedLodging: 0, other: 0 },
  variableCostsPerTourist: { food: 100, tickets: 50, lodging: 0, insurance: 0, other: 0 },
  pricePerTourist: 500,
  planningStartedAt: new Date("2026-01-01"),
  decisionDeadline: new Date("2026-03-01"),
  source: "simulated",
  version: "t1202-v1",
  updatedAt: new Date("2026-01-01"),
};

describe("T-1205 economic viability", () => {
  it("calculates confirmed deficit and result", () => {
    expect(calculateEconomicViability(plan, 20, 6, null)).toMatchObject({
      status: "below-break-even", finalMinimum: 8, missingConfirmedTourists: 2,
      confirmedResult: -700, estimatedResult: null, predictionUsed: false,
    });
  });
  it("distinguishes expected viability from confirmed demand", () => {
    expect(calculateEconomicViability(plan, 20, 6, 9)).toMatchObject({
      status: "expected-viable", confirmedTourists: 6, predictedFinalTourists: 9,
      confirmedResult: -700, estimatedResult: 350, predictionUsed: true,
    });
  });
  it("marks break-even reached from confirmed tourists", () => {
    expect(calculateEconomicViability(plan, 20, 8, 9).status).toBe("break-even-reached");
  });
  it("does not invent economics when the plan is absent", () => {
    expect(calculateEconomicViability(undefined, 20, 6, 9)).toMatchObject({
      status: "economic-data-missing", finalMinimum: null, confirmedResult: null,
    });
  });
  it("does not publish a minimum for a non-positive margin", () => {
    const invalid = { ...plan, pricePerTourist: 150 };
    expect(calculateEconomicViability(invalid, 20, 6, 9)).toMatchObject({
      status: "non-positive-contribution", finalMinimum: null, estimatedResult: -2800,
    });
  });
  it("preserves capacity-insufficient status", () => {
    expect(calculateEconomicViability(plan, 7, 6, 9).status).toBe("capacity-insufficient");
  });
  it("never lowers an estimate below confirmed demand", () => {
    expect(calculateEconomicViability(plan, 20, 9, 4)).toMatchObject({
      predictedFinalTourists: 9, status: "break-even-reached",
    });
  });
});
