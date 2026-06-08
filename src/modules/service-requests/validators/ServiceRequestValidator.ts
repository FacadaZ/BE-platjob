import { z } from "zod";
import { EstadoSolicitud } from "@shared/types/roles-statuses.js";

export const createRequestSchema = z.object({
  body: z.object({
    technicianId: z.number({
      required_error: "El ID del técnico es requerido",
    }),
    category: z.string({ required_error: "La categoría es requerida" }),
    title: z
      .string({ required_error: "El título es requerido" })
      .min(5, "El título debe tener al menos 5 caracteres"),
    description: z
      .string({ required_error: "La descripción es requerida" })
      .min(10, "La descripción debe tener al menos 10 caracteres"),
    address: z.string({ required_error: "La dirección es requerida" }),
    scheduledDate: z
      .string()
      .datetime("Formato de fecha programada inválido (ISO Date)")
      .optional(),
    budget: z
      .number()
      .nonnegative("El presupuesto debe ser un número no negativo")
      .optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "El ID de la solicitud es requerido" }),
  }),
  body: z.object({
    status: z.nativeEnum(EstadoSolicitud, {
      required_error: "El estado es requerido",
    }),
    agreedRate: z
      .number()
      .nonnegative("La tarifa acordada debe ser un número no negativo")
      .optional(),
  }),
});
