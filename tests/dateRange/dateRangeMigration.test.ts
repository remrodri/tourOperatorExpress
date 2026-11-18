import { buildDateRangeMigrationPlan } from "../../src/database/migrations/dateRangeMigration";

const id = "691248c54a93776353e4bcc8";
const capacities = { [id]: 20 };

describe("date range migration", () => {
  it("plans explicit normalized fields without changing legacy identity", () => {
    const plan = buildDateRangeMigrationPlan(
      [{ _id: id, dates: ["30-11-2025"] }],
      capacities
    );

    expect(plan.issues).toHaveLength(0);
    expect(plan.updates).toEqual([
      expect.objectContaining({
        id,
        startDate: new Date("2025-11-30T00:00:00.000Z"),
        endDate: new Date("2025-11-30T00:00:00.000Z"),
        capacity: 20,
        dataOrigin: "legacy",
      }),
    ]);
  });

  it("is idempotent when the expected fields are already present", () => {
    const plan = buildDateRangeMigrationPlan(
      [
        {
          _id: id,
          dates: ["30-11-2025"],
          startDate: new Date("2025-11-30T00:00:00.000Z"),
          endDate: new Date("2025-11-30T00:00:00.000Z"),
          capacity: 20,
          dataOrigin: "legacy",
        },
      ],
      capacities
    );

    expect(plan.updates).toHaveLength(0);
    expect(plan.issues).toHaveLength(0);
    expect(plan.unchanged).toEqual([id]);
  });

  it("stops on missing capacity, invalid dates or conflicting normalized data", () => {
    const missingCapacity = buildDateRangeMigrationPlan(
      [{ _id: id, dates: ["30-11-2025"] }],
      {}
    );
    const invalidDate = buildDateRangeMigrationPlan(
      [{ _id: id, dates: ["31-11-2025"] }],
      capacities
    );
    const conflict = buildDateRangeMigrationPlan(
      [{ _id: id, dates: ["30-11-2025"], capacity: 12 }],
      capacities
    );

    expect(missingCapacity.issues[0].reason).toMatch(/Capacidad/);
    expect(invalidDate.issues[0].reason).toMatch(/inválida/);
    expect(conflict.issues[0].reason).toMatch(/no coinciden/);
  });

  it("reports configured IDs that do not exist in the collection", () => {
    const plan = buildDateRangeMigrationPlan([], capacities);

    expect(plan.updates).toHaveLength(0);
    expect(plan.issues).toEqual([
      { id, reason: "ID configurado ausente en la colección" },
    ]);
  });
});
