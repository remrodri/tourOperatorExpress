import type { EconomicPlan } from "../../dateRange/domain/economicPlanning";
import type { EconomicViabilityResult } from "./economicViability";

export const DEFAULT_MONITOR_THRESHOLD = 0.5;
export const DEFAULT_PRIORITY_THRESHOLD = 0.25;

export type EconomicUrgency =
  | "not-applicable"
  | "achieved"
  | "monitor"
  | "commercial-action"
  | "priority-action"
  | "decision-required";

export interface EconomicRecommendation {
  urgency: EconomicUrgency;
  asOf: string;
  planningStartedAt: string | null;
  decisionDeadline: string | null;
  timeFractionRemaining: number | null;
  title: string;
  explanation: string;
  actionsToEvaluate: string[];
  automaticDecision: false;
  thresholds: { monitor: number; priority: number };
}

const round4 = (value: number): number => Math.round(value * 10_000) / 10_000;

export const buildEconomicRecommendation = (
  plan: EconomicPlan | null | undefined,
  viability: EconomicViabilityResult,
  asOf: Date,
  thresholds = {
    monitor: DEFAULT_MONITOR_THRESHOLD,
    priority: DEFAULT_PRIORITY_THRESHOLD,
  },
): EconomicRecommendation => {
  if (
    thresholds.priority <= 0 ||
    thresholds.monitor >= 1 ||
    thresholds.priority >= thresholds.monitor
  ) {
    throw new Error("Los umbrales deben cumplir 0 < priority < monitor < 1");
  }
  const base = {
    asOf: asOf.toISOString(),
    planningStartedAt: plan?.planningStartedAt?.toISOString() ?? null,
    decisionDeadline: plan?.decisionDeadline?.toISOString() ?? null,
    thresholds,
    automaticDecision: false as const,
  };
  if (!plan || !viability.finalMinimum || ["economic-data-missing", "non-positive-contribution", "capacity-insufficient"].includes(viability.status)) {
    return {
      ...base, urgency: "not-applicable", timeFractionRemaining: null,
      title: "Revisión de datos requerida",
      explanation: "No se puede emitir una orientación temporal hasta contar con un plan económico viable.",
      actionsToEvaluate: ["Revisar precio, costos, capacidad y fechas del plan."],
    };
  }
  if (viability.status === "break-even-reached") {
    return {
      ...base, urgency: "achieved", timeFractionRemaining: null,
      title: "Punto de equilibrio alcanzado",
      explanation: `La demanda confirmada alcanzó el mínimo final de ${viability.finalMinimum} turistas.`,
      actionsToEvaluate: ["Continuar el seguimiento de reservas y costos planificados."],
    };
  }
  const total = plan.decisionDeadline.getTime() - plan.planningStartedAt.getTime();
  const remaining = plan.decisionDeadline.getTime() - asOf.getTime();
  if (total <= 0) {
    return {
      ...base, urgency: "not-applicable", timeFractionRemaining: null,
      title: "Revisión de fechas requerida",
      explanation: "Las fechas del seguimiento no permiten calcular el tiempo disponible.",
      actionsToEvaluate: ["Corregir el inicio del seguimiento y la fecha límite."],
    };
  }
  const fraction = round4(Math.min(Math.max(remaining / total, 0), 1));
  if (remaining <= 0) {
    return {
      ...base, urgency: "decision-required", timeFractionRemaining: Math.max(fraction, 0),
      title: "Decisión requerida",
      explanation: `Se alcanzó la fecha límite y aún faltan ${viability.missingConfirmedTourists ?? 0} turistas para el mínimo final.`,
      actionsToEvaluate: ["Evaluar mantener, reprogramar o cancelar la salida con la información disponible."],
    };
  }
  if (fraction > thresholds.monitor) {
    return {
      ...base, urgency: "monitor", timeFractionRemaining: fraction,
      title: "Seguimiento recomendado",
      explanation: "Queda más de la mitad del tiempo de seguimiento antes de la fecha límite.",
      actionsToEvaluate: ["Observar la evolución de reservas y revisar nuevamente en el próximo control."],
    };
  }
  if (fraction > thresholds.priority) {
    return {
      ...base, urgency: "commercial-action", timeFractionRemaining: fraction,
      title: "Acción comercial recomendada",
      explanation: "Queda entre una cuarta parte y la mitad del tiempo antes de la fecha límite.",
      actionsToEvaluate: ["Evaluar reforzar la difusión y revisar reservas pendientes."],
    };
  }
  return {
    ...base, urgency: "priority-action", timeFractionRemaining: fraction,
    title: "Acción prioritaria recomendada",
    explanation: "Queda como máximo una cuarta parte del tiempo antes de la fecha límite.",
    actionsToEvaluate: ["Revisar de inmediato demanda, costos y alternativas antes de decidir."],
  };
};
