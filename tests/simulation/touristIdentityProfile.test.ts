import { buildRealisticTouristIdentity } from "../../src/database/simulation/touristIdentityProfile";

describe("realistic tourist identity profile", () => {
  it("is deterministic and contains no visible simulation markers", () => {
    const first = buildRealisticTouristIdentity("0123456789abcdef01234567");
    const second = buildRealisticTouristIdentity("0123456789abcdef01234567");

    expect(first).toEqual(second);
    expect(JSON.stringify(first)).not.toMatch(/simulad|registro|SIM-CI|SIM-PP|\.invalid/i);
    expect(first.email).toMatch(/@example\.com$/);
    expect(first.phone).toMatch(/^[67]\d{7}$/);
    expect(first.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("produces varied identities while preserving valid document contracts", () => {
    const identities = Array.from({ length: 100 }, (_, index) =>
      buildRealisticTouristIdentity(index.toString(16).padStart(24, "0")),
    );

    expect(new Set(identities.map((item) => item.firstName)).size).toBeGreaterThan(10);
    expect(new Set(identities.map((item) => item.dateOfBirth)).size).toBeGreaterThan(80);
    identities.forEach((identity) => {
      if (identity.documentType === "ci") {
        expect(identity.ci).toMatch(/^\d{7,8}$/);
        expect(identity.passportNumber).toBe("");
      } else {
        expect(identity.passportNumber).toMatch(/^[A-Z]{2}\d{7}$/);
        expect(identity.ci).toBe("");
      }
    });
  });
});
