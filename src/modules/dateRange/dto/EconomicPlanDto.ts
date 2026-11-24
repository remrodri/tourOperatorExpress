import { z } from "zod";
import { ECONOMIC_PLAN_VERSION } from "../domain/economicPlanning";

const money = z.number().finite().nonnegative().multipleOf(0.01);

export const EconomicPlanDto = z.object({
  currency: z.literal("BOB").default("BOB"),
  fixedCosts: z.object({
    transportation: money,
    guide: money,
    administration: money.default(0),
    fixedLodging: money.default(0),
    other: money.default(0),
  }),
  variableCostsPerTourist: z.object({
    food: money,
    tickets: money,
    lodging: money.default(0),
    insurance: money.default(0),
    other: money.default(0),
  }),
  pricePerTourist: z.number().finite().positive().multipleOf(0.01),
  operationalMinimum: z.number().int().positive().optional(),
  planningStartedAt: z.coerce.date(),
  decisionDeadline: z.coerce.date(),
  source: z.enum(["manual", "simulated"]).default("manual"),
  version: z.literal(ECONOMIC_PLAN_VERSION).default(ECONOMIC_PLAN_VERSION),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type EconomicPlanDto = z.infer<typeof EconomicPlanDto>;

