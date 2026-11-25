import {
  buildRealisticPackageName,
  replaceVisibleSimulationLabel,
} from "../../src/database/simulation/visibleSimulationLabels";

describe("visible simulation labels", () => {
  it.each([
    ["incachaca-cultural", "Incachaca Cultural"],
    ["uyuni-aventura", "Aventura en Uyuni"],
    ["corani-eco", "Naturaleza en Laguna Corani"],
    ["tutawallpa-fotografico", "Circuito Fotográfico en Tuta Wallpa"],
    ["torotoro-aventura", "Aventura en Toro Toro"],
    ["villa-tunari-eco", "Naturaleza en Villa Tunari"],
    ["uyuni-cultural", "Uyuni Cultural"],
    ["villa-tunari-gastronomico", "Sabores de Villa Tunari"],
  ])("maps %s to a realistic visible name", (code, expected) => {
    expect(buildRealisticPackageName(code)).toBe(expected);
    expect(replaceVisibleSimulationLabel(`Paquete simulado ${code}`)).toBe(expected);
  });

  it("keeps academic traceability outside visible labels", () => {
    const source = { dataOrigin: "simulated", simulationId: "simulation-1" };
    expect(source).toEqual({ dataOrigin: "simulated", simulationId: "simulation-1" });
  });
});
