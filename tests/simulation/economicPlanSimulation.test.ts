import { buildSimulatedEconomicPlan, economicPlanHash } from "../../src/database/simulation/economicPlanSimulation";
import { evaluateEconomicPlan } from "../../src/modules/dateRange/domain/economicPlanning";

const input = {
  id: "507f1f77bcf86cd799439011",
  startDate: new Date("2026-08-20T00:00:00.000Z"),
  capacity: 20,
  packagePrice: 500,
  packageDuration: 1,
};

describe("T-1204 economic plan simulation", () => {
  it("is deterministic for the same seed and input", () => {
    expect(buildSimulatedEconomicPlan(input, "seed-1")).toEqual(buildSimulatedEconomicPlan(input, "seed-1"));
  });

  it("changes deterministically with another seed", () => {
    expect(buildSimulatedEconomicPlan(input, "seed-1")).not.toEqual(buildSimulatedEconomicPlan(input, "seed-2"));
  });

  it("produces valid dates, source and version", () => {
    const plan = buildSimulatedEconomicPlan(input);
    expect(plan.source).toBe("simulated");
    expect(plan.version).toBe("t1202-v1");
    expect(plan.planningStartedAt < plan.decisionDeadline).toBe(true);
    expect(plan.decisionDeadline < input.startDate).toBe(true);
  });

  it("produces a positive margin and feasible minimum", () => {
    const evaluation = evaluateEconomicPlan(buildSimulatedEconomicPlan(input), input.capacity);
    expect(evaluation.status).toBe("available");
    expect(evaluation.contributionMarginPerTourist).toBeGreaterThan(0);
    expect(evaluation.finalMinimum).toBeLessThanOrEqual(input.capacity);
  });

  it("produces stable hashes", () => {
    const plan = buildSimulatedEconomicPlan(input);
    expect(economicPlanHash([{ id: input.id, plan }])).toBe(economicPlanHash([{ id: input.id, plan }]));
  });

  it("rejects invalid capacity", () => {
    expect(() => buildSimulatedEconomicPlan({ ...input, capacity: 0 })).toThrow(/capacidad/i);
  });
});
