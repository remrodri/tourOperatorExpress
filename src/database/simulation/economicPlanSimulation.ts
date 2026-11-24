import { createHash } from "node:crypto";
import {
  ECONOMIC_PLAN_VERSION,
  evaluateEconomicPlan,
  type EconomicPlan,
} from "../../modules/dateRange/domain/economicPlanning";

export const ECONOMIC_SIMULATION_VERSION = "t1204-v1";

export interface EconomicDepartureInput {
  id: string;
  startDate: Date;
  endDate?: Date;
  capacity: number;
  packagePrice?: number;
  packageDuration?: number;
}

const fraction = (seed: string, key: string): number => {
  const hex = createHash("sha256").update(`${seed}|${key}`).digest("hex").slice(0, 8);
  return Number.parseInt(hex, 16) / 0xffffffff;
};

const roundMoney = (value: number): number => Math.round(value * 100) / 100;
const roundToTen = (value: number): number => Math.max(10, Math.round(value / 10) * 10);

export const buildSimulatedEconomicPlan = (
  input: EconomicDepartureInput,
  seed = "tour-operator-economic-2026",
): EconomicPlan => {
  if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
    throw new Error("La capacidad debe ser un entero positivo");
  }
  const duration = Math.max(1, Math.round(input.packageDuration ?? 1));
  const basePrice = input.packagePrice && input.packagePrice > 0
    ? input.packagePrice
    : 350 + duration * 120;
  const pricePerTourist = roundToTen(basePrice * (0.9 + fraction(seed, `${input.id}:price`) * 0.2));
  const variableRatio = 0.28 + fraction(seed, `${input.id}:variable`) * 0.17;
  const variableTotal = roundToTen(pricePerTourist * variableRatio);
  const food = roundToTen(variableTotal * 0.45);
  const tickets = roundToTen(variableTotal * 0.25);
  const lodging = duration > 1 ? roundToTen(variableTotal * 0.2) : 0;
  const insurance = roundToTen(variableTotal * 0.05);
  const otherVariable = Math.max(0, variableTotal - food - tickets - lodging - insurance);
  const margin = pricePerTourist - variableTotal;
  const targetMinimum = Math.max(1, Math.min(input.capacity, Math.round(input.capacity * (0.42 + fraction(seed, `${input.id}:minimum`) * 0.23))));
  const fixedTotal = roundMoney(margin * targetMinimum);
  const transportation = roundToTen(fixedTotal * 0.58);
  const guide = roundToTen(fixedTotal * 0.2);
  const administration = roundToTen(fixedTotal * 0.1);
  const fixedLodging = duration > 1 ? roundToTen(fixedTotal * 0.07) : 0;
  const otherFixed = Math.max(0, roundMoney(fixedTotal - transportation - guide - administration - fixedLodging));
  const deadlineDays = duration === 1 ? 3 : duration <= 3 ? 7 : 14;
  const decisionDeadline = new Date(input.startDate);
  decisionDeadline.setUTCDate(decisionDeadline.getUTCDate() - deadlineDays);
  const planningStartedAt = new Date(decisionDeadline);
  planningStartedAt.setUTCDate(planningStartedAt.getUTCDate() - (duration === 1 ? 30 : duration <= 3 ? 45 : 60));
  const operationalMinimum = fraction(seed, `${input.id}:operational`) < 0.35
    ? Math.max(1, Math.round(input.capacity * 0.4))
    : undefined;
  const plan: EconomicPlan = {
    currency: "BOB",
    fixedCosts: { transportation, guide, administration, fixedLodging, other: otherFixed },
    variableCostsPerTourist: { food, tickets, lodging, insurance, other: otherVariable },
    pricePerTourist,
    ...(operationalMinimum ? { operationalMinimum } : {}),
    planningStartedAt,
    decisionDeadline,
    source: "simulated",
    version: ECONOMIC_PLAN_VERSION,
    updatedAt: planningStartedAt,
  };
  const evaluation = evaluateEconomicPlan(plan, input.capacity);
  if (evaluation.status !== "available") {
    throw new Error(`Plan económico incoherente para ${input.id}: ${evaluation.status}`);
  }
  return plan;
};

export const economicPlanHash = (plans: Array<{ id: string; plan: EconomicPlan }>): string =>
  createHash("sha256")
    .update(JSON.stringify(plans.map(({ id, plan }) => ({ id, ...plan }))))
    .digest("hex");
