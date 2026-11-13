import { generateBookingCode } from "../src/modules/booking/service/BookingService";

describe("generateBookingCode", () => {
  it("generates unique reservation codes with the legacy shape", () => {
    const codes = new Set(
      Array.from({ length: 100 }, () => generateBookingCode())
    );

    expect(codes.size).toBe(100);
    for (const code of codes) {
      expect(code).toMatch(/^RSV-[A-Za-z0-9_-]{12}$/);
    }
  });
});
