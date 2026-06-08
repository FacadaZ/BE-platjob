import { Router } from 'express';
import { reviewController } from '../controller/ReviewController.js';
import { isAuthenticated, isAuthorized } from '@shared/middlewares/AuthMiddleware.js';
import { validateRequest } from '@shared/middlewares/ValidationMiddleware.js';
import { createReviewSchema } from '../validators/ReviewValidator.js';
import { UserRole } from '@shared/types/roles-statuses.js';

const router = Router();

router.post(
  '/',
  isAuthenticated,
  isAuthorized([UserRole.CLIENT]),
  validateRequest(createReviewSchema),
  reviewController.create
);

router.get('/technician/:technicianId', reviewController.listByTechnicianId);

router.get('/client/:clientId', isAuthenticated, reviewController.listByClientId);

export const reviewRoutes = router;
