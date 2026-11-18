export type DateRangeDataOrigin = "legacy" | "simulated" | "manual";

const LEGACY_DATE_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export class DateRangeNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateRangeNormalizationError";
  }
}

export interface DateRangeBoundsInput {
  dates?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface DateRangeBounds {
  dates: string[];
  startDate: Date;
  endDate: Date;
}

export const parseLegacyDepartureDate = (value: string): Date | null => {
  const match = LEGACY_DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

export const formatLegacyDepartureDate = (date: Date): string => {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}-${month}-${year}`;
};

const toUtcStartOfDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const enumerateDates = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];

  for (
    let timestamp = startDate.getTime();
    timestamp <= endDate.getTime();
    timestamp += MILLISECONDS_PER_DAY
  ) {
    dates.push(formatLegacyDepartureDate(new Date(timestamp)));
  }

  return dates;
};

export const resolveDateRangeBounds = (
  input: DateRangeBoundsInput
): DateRangeBounds => {
  const hasDates = Array.isArray(input.dates) && input.dates.length > 0;

  if (hasDates) {
    const dates = input.dates as string[];
    const parsedDates = dates.map(parseLegacyDepartureDate);
    const invalidIndex = parsedDates.findIndex((date) => date === null);

    if (invalidIndex >= 0) {
      throw new DateRangeNormalizationError(
        `Fecha de salida inválida: ${dates[invalidIndex]}`
      );
    }

    const timestamps = parsedDates.map((date) => (date as Date).getTime());
    const startDate = new Date(Math.min(...timestamps));
    const endDate = new Date(Math.max(...timestamps));

    if (input.startDate && toUtcStartOfDay(input.startDate).getTime() !== startDate.getTime()) {
      throw new DateRangeNormalizationError(
        "La fecha inicial no coincide con las fechas de salida"
      );
    }

    if (input.endDate && toUtcStartOfDay(input.endDate).getTime() !== endDate.getTime()) {
      throw new DateRangeNormalizationError(
        "La fecha final no coincide con las fechas de salida"
      );
    }

    return { dates: [...dates], startDate, endDate };
  }

  if (!input.startDate || !input.endDate) {
    throw new DateRangeNormalizationError(
      "Se requiere dates o el par startDate/endDate"
    );
  }

  const startDate = toUtcStartOfDay(input.startDate);
  const endDate = toUtcStartOfDay(input.endDate);

  if (endDate.getTime() < startDate.getTime()) {
    throw new DateRangeNormalizationError(
      "La fecha final no puede ser anterior a la fecha inicial"
    );
  }

  return { dates: enumerateDates(startDate, endDate), startDate, endDate };
};

export const tryResolveDateRangeBounds = (
  input: DateRangeBoundsInput
): DateRangeBounds | null => {
  try {
    return resolveDateRangeBounds(input);
  } catch {
    return null;
  }
};
