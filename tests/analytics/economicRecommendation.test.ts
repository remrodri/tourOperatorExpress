import { buildEconomicRecommendation } from "../../src/modules/analytics/domain/economicRecommendation";
import { calculateEconomicViability } from "../../src/modules/analytics/domain/economicViability";
import type { EconomicPlan } from "../../src/modules/dateRange/domain/economicPlanning";

const plan: EconomicPlan = {
  currency: "BOB",
  fixedCosts: { transportation: 2000, guide: 500, administration: 300, fixedLodging: 0, other: 0 },
  variableCostsPerTourist: { food: 100, tickets: 50, lodging: 0, insurance: 0, other: 0 },
  pricePerTourist: 500,
  planningStartedAt: new Date("2026-01-01T00:00:00.000Z"),
  decisionDeadline: new Date("2026-01-11T00:00:00.000Z"),
  source: "simulated", version: "t1202-v1", updatedAt: new Date("2026-01-01"),
};
const viability = calculateEconomicViability(plan, 20, 6, 9);

describe("T-1206 gradual economic recommendation", () => {
  it("uses monitor above 50 percent remaining", () => {
    expect(buildEconomicRecommendation(plan, viability, new Date("2026-01-05")).urgency).toBe("monitor");
  });
  it("uses commercial action from 25 to 50 percent", () => {
    expect(buildEconomicRecommendation(plan, viability, new Date("2026-01-07")).urgency).toBe("commercial-action");
  });
  it("uses priority action at 25 percent or less", () => {
    expect(buildEconomicRecommendation(plan, viability, new Date("2026-01-09")).urgency).toBe("priority-action");
  });
  it("requires a human decision at or after the deadline", () => {
    const result = buildEconomicRecommendation(plan, viability, new Date("2026-01-11"));
    expect(result.urgency).toBe("decision-required");
    expect(result.automaticDecision).toBe(false);
    expect(result.actionsToEvaluate.join(" ")).toMatch(/evaluar/i);
  });
  it("uses correct singular wording when one tourist is missing", () => {
    const oneMissing = calculateEconomicViability(plan, 20, 7, null);
    const result = buildEconomicRecommendation(plan, oneMissing, new Date("2026-01-11"));
    expect(result.explanation).toContain("falta 1 turista");
    expect(result.explanation).not.toContain("faltan 1 turistas");
  });
  it("lets achieved demand prevail over time", () => {
    const achieved = calculateEconomicViability(plan, 20, 8, null);
    expect(buildEconomicRecommendation(plan, achieved, new Date("2026-01-12")).urgency).toBe("achieved");
  });
  it("does not recommend actions with missing or invalid economics", () => {
    const missing = calculateEconomicViability(undefined, 20, 6, null);
    expect(buildEconomicRecommendation(undefined, missing, new Date("2026-01-07")).urgency).toBe("not-applicable");
    const invalidPlan = { ...plan, pricePerTourist: 150 };
    const invalid = calculateEconomicViability(invalidPlan, 20, 6, null);
    expect(buildEconomicRecommendation(invalidPlan, invalid, new Date("2026-01-07")).urgency).toBe("not-applicable");
  });
  it("supports configured thresholds", () => {
    const configured = buildEconomicRecommendation(plan, viability, new Date("2026-01-07"), { monitor: 0.7, priority: 0.4 });
    expect(configured.urgency).toBe("priority-action");
    expect(configured.thresholds).toEqual({ monitor: 0.7, priority: 0.4 });
  });
  it("rejects contradictory configured thresholds", () => {
    expect(() => buildEconomicRecommendation(plan, viability, new Date("2026-01-07"), { monitor: 0.4, priority: 0.5 })).toThrow(/umbrales/i);
    expect(() => buildEconomicRecommendation(plan, viability, new Date("2026-01-07"), { monitor: 1, priority: 0.25 })).toThrow(/umbrales/i);
  });
  it("publishes a bounded fraction before tracking starts", () => {
    const result = buildEconomicRecommendation(plan, viability, new Date("2025-12-20"));
    expect(result.urgency).toBe("monitor");
    expect(result.timeFractionRemaining).toBe(1);
  });
});
