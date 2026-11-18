import { createHash } from "node:crypto";

export const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const stableStringify = (value: unknown): string => {
  if (value === undefined) {
    return "null";
  }

  if (value === null) {
    return "null";
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`);

  return `{${entries.join(",")}}`;
};

export const stableObjectId = (
  seed: string | number,
  naturalKey: string
): string => {
  const hash = sha256Hex(`${seed}|${naturalKey}`);
  return hash.slice(0, 24);
};

export interface RandomSource {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: T[]) => T;
  chance: (probability: number) => boolean;
}

export const createRandom = (seed: string | number): RandomSource => {
  const hash = sha256Hex(String(seed));
  let state = Number.parseInt(hash.slice(0, 8), 16) >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number =>
    Math.floor(next() * (max - min + 1)) + min;

  const pick = <T>(items: T[]): T => items[int(0, items.length - 1)];

  const chance = (probability: number): boolean => next() < probability;

  return { next, int, pick, chance };
};
