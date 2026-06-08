import { z } from "zod";
import { RolUsuario } from "@shared/types/roles-statuses.js";

export const esquemaRegistro = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "El nombre es requerido" })
        .min(2, "El nombre debe tener al menos 2 caracteres"),
      email: z
        .string({ required_error: "El email es requerido" })
        .email("Formato de email inválido"),
      password: z
        .string({ required_error: "La contraseña es requerida" })
        .min(6, "La contraseña debe tener al menos 6 caracteres"),
      role: z.nativeEnum(RolUsuario).default(RolUsuario.CLIENT),
      phone: z.string().optional(),
      location: z.string().optional(),
      avatarUrl: z.string().url("Formato de URL de avatar inválido").optional(),

      // Si el rol es Técnico, estos campos son opcionales durante el registro
      category: z.string().optional(),
      specialties: z.array(z.string()).default([]),
      bio: z.string().optional(),
      hourlyRate: z.coerce
        .number()
        .nonnegative("La tarifa horaria debe ser un valor no negativo")
        .optional(),
    }),
});

export const esquemaLogin = z.object({
  body: z.object({
    email: z
      .string({ required_error: "El email es requerido" })
      .email("Formato de email inválido"),
    password: z.string({ required_error: "La contraseña es requerida" }),
  }),
});

export const registerSchema = esquemaRegistro;
export const loginSchema = esquemaLogin;

