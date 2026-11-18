export type SimulationScenario = "baseline" | "test-over-capacity";

export interface SimulationPackageProfile {
  code: string;
  destinationName: string;
  tourTypeName: string;
  durationDays: number;
  price: number;
  popularity: number;
  capacityBias: number;
}

export interface SimulationConfig {
  version: string;
  seed: number;
  periodStart: string;
  periodEnd: string;
  asOf: string;
  scenario: SimulationScenario;
  departureIntervalDays: number;
  packageProfiles: SimulationPackageProfile[];
  capacity: {
    min: number;
    max: number;
  };
  demand: {
    baseOccupancy: number;
    seasonalityAmplitude: number;
    weekendBoost: number;
    noiseAmplitude: number;
    noDemandRate: number;
    highOccupancyRate: number;
  };
  booking: {
    minGroupSize: number;
    maxGroupSize: number;
    minAnticipationDays: number;
    maxAnticipationDays: number;
    cancelledRatePast: number;
    pendingRateFuture: number;
    confirmedRateFuture: number;
  };
  payment: {
    methods: string[];
    maxInstallments: number;
    minFirstRatio: number;
    maxFirstRatio: number;
  };
  allowOverCapacityForTesting?: boolean;
}

export const SIMULATION_DATABASE = "tourOperatorAPIDB";

export const SIMULATION_COLLECTIONS = [
  "Date_Ranges",
  "Tour_Packages",
  "Tourists",
  "Bookings",
  "Payments",
] as const;

export type SimulationCollectionName = (typeof SIMULATION_COLLECTIONS)[number];

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  version: "t807-v1",
  seed: 20261113,
  periodStart: "2024-01-01",
  periodEnd: "2026-12-31",
  asOf: "2026-11-13",
  scenario: "baseline",
  departureIntervalDays: 21,
  packageProfiles: [
    {
      code: "incachaca-cultural",
      destinationName: "Incachaca",
      tourTypeName: "Tour cultural",
      durationDays: 1,
      price: 180,
      popularity: 0.95,
      capacityBias: 2,
    },
    {
      code: "uyuni-aventura",
      destinationName: "Salar de Uyuni",
      tourTypeName: "Tour de aventura",
      durationDays: 3,
      price: 950,
      popularity: 1.05,
      capacityBias: 4,
    },
    {
      code: "corani-eco",
      destinationName: "Laguna Corani",
      tourTypeName: "Tour ecoturístico",
      durationDays: 2,
      price: 420,
      popularity: 0.85,
      capacityBias: 0,
    },
    {
      code: "tutawallpa-fotografico",
      destinationName: "Cañon de Tuta Wallpa",
      tourTypeName: "Tour fotográfico",
      durationDays: 1,
      price: 260,
      popularity: 0.8,
      capacityBias: 0,
    },
    {
      code: "torotoro-aventura",
      destinationName: "Toro Toro",
      tourTypeName: "Tour de aventura",
      durationDays: 3,
      price: 780,
      popularity: 1,
      capacityBias: 2,
    },
    {
      code: "villa-tunari-eco",
      destinationName: "Villa Tunari",
      tourTypeName: "Tour ecoturístico",
      durationDays: 2,
      price: 480,
      popularity: 0.95,
      capacityBias: 2,
    },
    {
      code: "uyuni-cultural",
      destinationName: "Salar de Uyuni",
      tourTypeName: "Tour cultural",
      durationDays: 2,
      price: 700,
      popularity: 0.9,
      capacityBias: 0,
    },
    {
      code: "villa-tunari-gastronomico",
      destinationName: "Villa Tunari",
      tourTypeName: "Tour gastronómico",
      durationDays: 1,
      price: 300,
      popularity: 0.75,
      capacityBias: 0,
    },
  ],
  capacity: {
    min: 12,
    max: 30,
  },
  demand: {
    baseOccupancy: 0.62,
    seasonalityAmplitude: 0.14,
    weekendBoost: 0.1,
    noiseAmplitude: 0.08,
    noDemandRate: 0.06,
    highOccupancyRate: 0.12,
  },
  booking: {
    minGroupSize: 1,
    maxGroupSize: 4,
    minAnticipationDays: 2,
    maxAnticipationDays: 75,
    cancelledRatePast: 0.12,
    pendingRateFuture: 0.4,
    confirmedRateFuture: 0.35,
  },
  payment: {
    methods: ["cash", "bank_transfer"],
    maxInstallments: 2,
    minFirstRatio: 0.3,
    maxFirstRatio: 0.6,
  },
  allowOverCapacityForTesting: false,
};
