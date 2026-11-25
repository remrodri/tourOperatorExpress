const PACKAGE_NAMES: Readonly<Record<string, string>> = {
  "incachaca-cultural": "Incachaca Cultural",
  "uyuni-aventura": "Aventura en Uyuni",
  "corani-eco": "Naturaleza en Laguna Corani",
  "tutawallpa-fotografico": "Circuito Fotográfico en Tuta Wallpa",
  "torotoro-aventura": "Aventura en Toro Toro",
  "villa-tunari-eco": "Naturaleza en Villa Tunari",
  "uyuni-cultural": "Uyuni Cultural",
  "villa-tunari-gastronomico": "Sabores de Villa Tunari",
};

export const buildRealisticPackageName = (code: string): string =>
  PACKAGE_NAMES[code] ?? code
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

export const replaceVisibleSimulationLabel = (value: string): string => {
  const packageMatch = value.match(/^Paquete simulado\s+(.+)$/i);
  if (packageMatch) return buildRealisticPackageName(packageMatch[1].trim().toLowerCase());
  return value
    .replace(/Reserva simulada/gi, "Reserva registrada mediante canal web")
    .replace(/Actividad simulada/gi, "Actividad programada");
};

