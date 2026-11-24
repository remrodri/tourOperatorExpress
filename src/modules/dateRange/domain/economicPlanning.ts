export const ECONOMIC_PLAN_VERSION = "t1202-v1" as const;

export interface EconomicCostBreakdown {
  transportation: number;
  guide: number;
  administration: number;
  fixedLodging: number;
  other: number;
}

export interface EconomicVariableCostBreakdown {
  food: number;
  tickets: number;
  lodging: number;
  insurance: number;
  other: number;
}

export interface EconomicPlan {
  currency: "BOB";
  fixedCosts: EconomicCostBreakdown;
  variableCostsPerTourist: EconomicVariableCostBreakdown;
  pricePerTourist: number;
  operationalMinimum?: number;
  planningStartedAt: Date;
  decisionDeadline: Date;
  source: "manual" | "simulated";
  version: typeof ECONOMIC_PLAN_VERSION;
  updatedAt: Date;
}

export type EconomicEvaluationStatus =
  | "available"
  | "economic-data-missing"
  | "non-positive-contribution"
  | "capacity-insufficient";

export interface EconomicEvaluation {
  status: EconomicEvaluationStatus;
  fixedCostsTotal: number | null;
  variableCostPerTourist: number | null;
  contributionMarginPerTourist: number | null;
  economicMinimum: number | null;
  operationalMinimum: number | null;
  finalMinimum: number | null;
}

const sum = (values: number[]) =>
  Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;

export const evaluateEconomicPlan = (
  plan: EconomicPlan | null | undefined,
  capacity?: number,
): EconomicEvaluation => {
  if (!plan) {
    return {
      status: "economic-data-missing",
      fixedCostsTotal: null,
      variableCostPerTourist: null,
      contributionMarginPerTourist: null,
      economicMinimum: null,
      operationalMinimum: null,
      finalMinimum: null,
    };
  }

  const fixedCostsTotal = sum(Object.values(plan.fixedCosts));
  const variableCostPerTourist = sum(
    Object.values(plan.variableCostsPerTourist),
  );
  const contributionMarginPerTourist =
    Math.round((plan.pricePerTourist - variableCostPerTourist) * 100) / 100;
  const operationalMinimum = plan.operationalMinimum ?? null;

  if (contributionMarginPerTourist <= 0) {
    return {
      status: "non-positive-contribution",
      fixedCostsTotal,
      variableCostPerTourist,
      contributionMarginPerTourist,
      economicMinimum: null,
      operationalMinimum,
      finalMinimum: null,
    };
  }

  const economicMinimum = Math.ceil(
    fixedCostsTotal / contributionMarginPerTourist,
  );
  const finalMinimum = Math.max(economicMinimum, operationalMinimum ?? 0);

  return {
    status:
      typeof capacity === "number" && finalMinimum > capacity
        ? "capacity-insufficient"
        : "available",
    fixedCostsTotal,
    variableCostPerTourist,
    contributionMarginPerTourist,
    economicMinimum,
    operationalMinimum,
    finalMinimum,
  };
};

export const assertEconomicPlanDates = (
  plan: EconomicPlan,
  startDate: Date | undefined,
) => {
  if (!startDate) {
    throw new Error("La salida necesita fecha inicial para registrar el plan económico");
  }
  if (!(plan.planningStartedAt < plan.decisionDeadline)) {
    throw new Error("El inicio del seguimiento debe ser anterior a la fecha límite");
  }
  if (!(plan.decisionDeadline < startDate)) {
    throw new Error("La fecha límite debe ser anterior al inicio de la salida");
  }
};

