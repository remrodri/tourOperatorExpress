import {
  DateRangeNormalizationError,
  formatLegacyDepartureDate,
  parseLegacyDepartureDate,
  resolveDateRangeBounds,
  tryResolveDateRangeBounds,
} from "../../src/modules/dateRange/domain/dateRangeNormalization";

describe("dateRangeNormalization", () => {
  it("parses strict DD-MM-YYYY dates and rejects impossible calendar days", () => {
    expect(parseLegacyDepartureDate("15-01-2026")?.toISOString()).toBe(
      "2026-01-15T00:00:00.000Z"
    );
    expect(parseLegacyDepartureDate("29-02-2028")).not.toBeNull();
    expect(parseLegacyDepartureDate("31-02-2026")).toBeNull();
    expect(parseLegacyDepartureDate("2026-01-15")).toBeNull();
  });

  it("derives ordered bounds from legacy dates without reordering the payload", () => {
    const bounds = resolveDateRangeBounds({
      dates: ["17-01-2026", "15-01-2026", "16-01-2026"],
    });

    expect(bounds.dates).toEqual(["17-01-2026", "15-01-2026", "16-01-2026"]);
    expect(formatLegacyDepartureDate(bounds.startDate)).toBe("15-01-2026");
    expect(formatLegacyDepartureDate(bounds.endDate)).toBe("17-01-2026");
  });

  it("builds legacy dates from explicit start and end bounds", () => {
    const bounds = resolveDateRangeBounds({
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-03T00:00:00.000Z"),
    });

    expect(bounds.dates).toEqual(["01-03-2026", "02-03-2026", "03-03-2026"]);
  });

  it("rejects inverted bounds and dates inconsistent with explicit bounds", () => {
    expect(() =>
      resolveDateRangeBounds({
        startDate: new Date("2026-03-03T00:00:00.000Z"),
        endDate: new Date("2026-03-01T00:00:00.000Z"),
      })
    ).toThrow(DateRangeNormalizationError);

    expect(() =>
      resolveDateRangeBounds({
        dates: ["01-03-2026"],
        endDate: new Date("2026-03-02T00:00:00.000Z"),
      })
    ).toThrow(DateRangeNormalizationError);
  });

  it("returns null when stored legacy dates cannot be normalized", () => {
    expect(tryResolveDateRangeBounds({ dates: ["31-02-2026"] })).toBeNull();
  });
});
