import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    requestId: z.coerce.number({ required_error: 'El ID de solicitud es requerido' }),
    rating: z
      .number({ required_error: 'La calificación es requerida' })
      .int()
      .min(1, 'La calificación mínima es 1 estrella')
      .max(5, 'La calificación máxima es 5 estrellas'),
    comment: z
      .string({ required_error: 'El comentario es requerido' })
      .min(5, 'El comentario debe tener al menos 5 caracteres'),
  }),
});
