import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../service/ReviewService.js';
import { ApiResponse } from '@shared/utils/ApiResponse.js';
import { AppError } from '@shared/errors/AppError.js';

export class ReviewController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const review = await reviewService.create(req.user.id, req.body);
      ApiResponse.created(res, 'Reseña publicada con éxito', review);
    } catch (err) {
      next(err);
    }
  };

  listByTechnicianId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { technicianId } = req.params;
      const reviews = await reviewService.listByTechnicianId(technicianId);
      ApiResponse.success(res, 'Reseñas obtenidas con éxito', reviews);
    } catch (err) {
      next(err);
    }
  };

  listByClientId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId } = req.params;
      const reviews = await reviewService.listByClientId(clientId);
      ApiResponse.success(res, 'Reseñas obtenidas con éxito', reviews);
    } catch (err) {
      next(err);
    }
  };
}
export const reviewController = new ReviewController();
