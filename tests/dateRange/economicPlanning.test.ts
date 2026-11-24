import {
  ECONOMIC_PLAN_VERSION,
  evaluateEconomicPlan,
  type EconomicPlan,
} from "../../src/modules/dateRange/domain/economicPlanning";

const plan = (overrides: Partial<EconomicPlan> = {}): EconomicPlan => ({
  currency: "BOB",
  fixedCosts: {
    transportation: 2000,
    guide: 500,
    administration: 300,
    fixedLodging: 0,
    other: 0,
  },
  variableCostsPerTourist: {
    food: 100,
    tickets: 50,
    lodging: 0,
    insurance: 0,
    other: 0,
  },
  pricePerTourist: 500,
  planningStartedAt: new Date("2026-01-01T00:00:00.000Z"),
  decisionDeadline: new Date("2026-02-01T00:00:00.000Z"),
  source: "manual",
  version: ECONOMIC_PLAN_VERSION,
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

describe("economic planning T-1202", () => {
  it("reproduces the approved break-even control example", () => {
    expect(evaluateEconomicPlan(plan(), 20)).toEqual({
      status: "available",
      fixedCostsTotal: 2800,
      variableCostPerTourist: 150,
      contributionMarginPerTourist: 350,
      economicMinimum: 8,
      operationalMinimum: null,
      finalMinimum: 8,
    });
  });

  it("rounds upward and lets the operational minimum raise the final value", () => {
    const result = evaluateEconomicPlan(
      plan({
        fixedCosts: { ...plan().fixedCosts, transportation: 2100 },
        operationalMinimum: 10,
      }),
      20,
    );
    expect(result.economicMinimum).toBe(9);
    expect(result.finalMinimum).toBe(10);
  });

  it("does not publish a minimum when contribution is not positive", () => {
    const result = evaluateEconomicPlan(plan({ pricePerTourist: 150 }), 20);
    expect(result.status).toBe("non-positive-contribution");
    expect(result.economicMinimum).toBeNull();
    expect(result.finalMinimum).toBeNull();
  });

  it("preserves a minimum above capacity as an explicit state", () => {
    const result = evaluateEconomicPlan(plan(), 7);
    expect(result.status).toBe("capacity-insufficient");
    expect(result.finalMinimum).toBe(8);
  });

  it("keeps legacy departures compatible without inventing values", () => {
    expect(evaluateEconomicPlan(undefined, 20)).toEqual({
      status: "economic-data-missing",
      fixedCostsTotal: null,
      variableCostPerTourist: null,
      contributionMarginPerTourist: null,
      economicMinimum: null,
      operationalMinimum: null,
      finalMinimum: null,
    });
  });
});

