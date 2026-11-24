import {
  evaluateEconomicPlan,
  type EconomicPlan,
} from "../../dateRange/domain/economicPlanning";

export type EconomicViabilityStatus =
  | "economic-data-missing"
  | "non-positive-contribution"
  | "capacity-insufficient"
  | "below-break-even"
  | "expected-viable"
  | "break-even-reached";

export interface EconomicViabilityResult {
  status: EconomicViabilityStatus;
  currency: "BOB" | null;
  confirmedTourists: number;
  predictedFinalTourists: number | null;
  fixedCostsTotal: number | null;
  variableCostPerTourist: number | null;
  contributionMarginPerTourist: number | null;
  economicMinimum: number | null;
  operationalMinimum: number | null;
  finalMinimum: number | null;
  missingConfirmedTourists: number | null;
  confirmedResult: number | null;
  estimatedResult: number | null;
  predictionUsed: boolean;
}

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const calculateEconomicViability = (
  plan: EconomicPlan | null | undefined,
  capacity: number | null,
  confirmedTourists: number,
  predictedFinalTourists: number | null,
): EconomicViabilityResult => {
  const confirmed = Math.max(0, Math.trunc(confirmedTourists));
  const predicted = predictedFinalTourists === null
    ? null
    : Math.max(confirmed, Math.trunc(predictedFinalTourists));
  const evaluation = evaluateEconomicPlan(plan, capacity ?? undefined);
  const base = {
    currency: plan?.currency ?? null,
    confirmedTourists: confirmed,
    predictedFinalTourists: predicted,
    fixedCostsTotal: evaluation.fixedCostsTotal,
    variableCostPerTourist: evaluation.variableCostPerTourist,
    contributionMarginPerTourist: evaluation.contributionMarginPerTourist,
    economicMinimum: evaluation.economicMinimum,
    operationalMinimum: evaluation.operationalMinimum,
    finalMinimum: evaluation.finalMinimum,
    missingConfirmedTourists: evaluation.finalMinimum === null
      ? null
      : Math.max(evaluation.finalMinimum - confirmed, 0),
    confirmedResult: evaluation.contributionMarginPerTourist === null || evaluation.fixedCostsTotal === null
      ? null
      : round2(confirmed * evaluation.contributionMarginPerTourist - evaluation.fixedCostsTotal),
    estimatedResult: predicted === null || evaluation.contributionMarginPerTourist === null || evaluation.fixedCostsTotal === null
      ? null
      : round2(predicted * evaluation.contributionMarginPerTourist - evaluation.fixedCostsTotal),
    predictionUsed: predicted !== null,
  };
  if (evaluation.status !== "available") return { ...base, status: evaluation.status };
  if ((evaluation.finalMinimum ?? Infinity) <= confirmed) return { ...base, status: "break-even-reached" };
  if (predicted !== null && (evaluation.finalMinimum ?? Infinity) <= predicted) return { ...base, status: "expected-viable" };
  return { ...base, status: "below-break-even" };
};
