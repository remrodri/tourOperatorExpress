export const ANALYTICS_MODULE_NAME = "analytics";
export const ANALYTICS_CONTRACT_VERSION = "1.0.0";
export const ANALYTICS_RELEASE = "t808-v1";

export const ANALYTICS_ALLOWED_ROLES = [
  "administrador",
  "operador de ventas",
] as const;

export type AnalyticsAllowedRole = (typeof ANALYTICS_ALLOWED_ROLES)[number];

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  tourPackageId?: string;
  destinationId?: string;
  dateRangeId?: string;
}

export interface AnalyticsCapability {
  status: "planned";
  task: string;
  description: string;
}

export interface AnalyticsModuleMetadata {
  module: typeof ANALYTICS_MODULE_NAME;
  contractVersion: string;
  release: string;
  status: "foundation";
  generatedAt: string;
  scope: string;
}

export interface AnalyticsAccessPolicy {
  roles: readonly AnalyticsAllowedRole[];
}

export interface AnalyticsPrivacyPolicy {
  dataOrigin: "simulated";
  aggregatesOnly: true;
  includesPii: false;
  calculationLayer: "backend";
}

export interface AnalyticsMeta extends AnalyticsModuleMetadata {
  period: {
    from: string | null;
    to: string | null;
  };
  filters: AnalyticsFilters;
}

export interface AnalyticsFoundationData {
  filters: AnalyticsFilters;
  capabilities: {
    descriptive: AnalyticsCapability;
    predictive: AnalyticsCapability;
  };
  access: AnalyticsAccessPolicy;
  privacy: AnalyticsPrivacyPolicy;
}

export interface AnalyticsFoundation {
  data: AnalyticsFoundationData;
  meta: AnalyticsMeta;
  warnings: string[];
}
