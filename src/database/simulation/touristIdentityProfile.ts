import { createRandom, sha256Hex } from "./simulationRandom";

const FIRST_NAMES = [
  "Alejandro", "Ana", "Andrea", "Brenda", "Camila", "Carlos", "Carolina",
  "Daniel", "Daniela", "Diego", "Eduardo", "Elena", "Fernanda", "Gabriel",
  "Gabriela", "Javier", "José", "Juan", "Laura", "Lucía", "Luis", "María",
  "Mariana", "Mateo", "Miguel", "Natalia", "Paola", "Rodrigo", "Sofía", "Valeria",
] as const;

const LAST_NAMES = [
  "Aguilar", "Alarcón", "Arce", "Cabrera", "Camacho", "Castillo", "Chávez",
  "Condori", "Flores", "García", "Gómez", "Gonzales", "Gutiérrez", "López",
  "Mamani", "Mendoza", "Morales", "Paredes", "Pérez", "Quispe", "Ramírez",
  "Rojas", "Romero", "Salazar", "Sánchez", "Silva", "Torrico", "Vargas",
  "Vega", "Zeballos",
] as const;

const NATIONALITIES = [
  "Bolivia", "Bolivia", "Bolivia", "Bolivia", "Bolivia", "Argentina",
  "Brasil", "Chile", "Perú", "Paraguay",
] as const;

export interface RealisticTouristIdentity {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationality: string;
  documentType: "ci" | "passport";
  ci: string;
  passportNumber: string;
  dateOfBirth: string;
}

const ascii = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const buildRealisticTouristIdentity = (
  stableId: string,
): RealisticTouristIdentity => {
  const random = createRandom(`tourist-identity-v1|${stableId}`);
  const firstName = random.pick(FIRST_NAMES);
  const lastName = `${random.pick(LAST_NAMES)} ${random.pick(LAST_NAMES)}`;
  const nationality = random.pick(NATIONALITIES);
  const documentType = random.chance(0.86) ? "ci" : "passport";
  const numeric = Number.parseInt(sha256Hex(stableId).slice(0, 12), 16);
  const ci = String(10_000_000 + (numeric % 80_000_000));
  const passportNumber = `${String.fromCharCode(65 + random.int(0, 25))}${String.fromCharCode(65 + random.int(0, 25))}${String(1_000_000 + (numeric % 9_000_000))}`;
  const year = random.int(1950, 2006);
  const month = random.int(1, 12);
  const day = random.int(1, 28);
  const dateOfBirth = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const phone = `${random.chance(0.72) ? 7 : 6}${String(10_000_000 + (numeric % 90_000_000)).slice(1)}`;
  const emailCode = sha256Hex(`email|${stableId}`).slice(0, 6);
  const email = `${ascii(firstName)}.${ascii(lastName.split(" ")[0])}.${emailCode}@example.com`;

  return {
    firstName,
    lastName,
    phone,
    email,
    nationality,
    documentType,
    ci: documentType === "ci" ? ci : "",
    passportNumber: documentType === "passport" ? passportNumber : "",
    dateOfBirth,
  };
};
