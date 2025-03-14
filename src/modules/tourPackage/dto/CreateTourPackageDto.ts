import { z } from "zod";

const ActivitySchema = z.object({
  description: z.string().min(3, "La descripcion es requerido"),
  time: z.string().min(1, "La hora es requerida"),
});

const DaySchema = z.object({
  dayNumber: z.number().positive("El numero de dia debe ser positivo"),
  activities: z
    .array(ActivitySchema)
    .min(1, "Se requiere al menos una actividad"),
});

const ItinerarySchema = z.object({
  days: z.array(DaySchema).min(1, "Se requiere al menos un dia"),
});

export const TourPackageDto = z.object({
  name: z.string().min(3, "El nombre es requerido"),
  tourType: z.string().min(1, "El tipo de tour es requerido"),
  cancellationPolicy: z
    .string()
    .min(1, "La politica de cancelacion es requerida"),
  touristDestination: z.string().min(1, "El destino turistico es requerido"),
  duration: z.number().positive("La duracion debe ser positiva"),
  selectedDates: z.array(z.string()).min(1, "Se requiere al menos una fecha"),
  price: z.number().positive("El precio deber ser positivo"),
  itinerary: ItinerarySchema,
  status: z.string().default("active"),
});

export type TourPackageDto = z.infer<typeof TourPackageDto>;
