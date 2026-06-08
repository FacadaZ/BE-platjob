import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    category: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    bio: z.string().optional(),
    hourlyRate: z.number().nonnegative('La tarifa horaria debe ser no negativa').optional(),
    isAvailable: z.boolean().optional(),
    responseTime: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const addPortfolioItemSchema = z.object({
  body: z.object({
    imageUrl: z.string({ required_error: 'La URL de la imagen es requerida' }).url('Formato de URL inválido'),
    title: z.string({ required_error: 'El título del proyecto es requerido' }).min(3, 'El título debe tener al menos 3 caracteres'),
    description: z.string().optional(),
  }),
});
