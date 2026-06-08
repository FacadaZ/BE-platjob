import { Router } from 'express';
import { serviceRequestController } from '../controller/ServiceRequestController.js';
import { isAuthenticated, isAuthorized } from '@shared/middlewares/AuthMiddleware.js';
import { validateRequest } from '@shared/middlewares/ValidationMiddleware.js';
import { createRequestSchema, updateStatusSchema } from '../validators/ServiceRequestValidator.js';
import { UserRole } from '@shared/types/roles-statuses.js';

const router = Router();

router.use(isAuthenticated);

router.post(
  '/',
  isAuthorized([UserRole.CLIENT]),
  validateRequest(createRequestSchema),
  serviceRequestController.create
);

router.get('/', serviceRequestController.list);
router.get('/:id', serviceRequestController.getById);

router.patch(
  '/:id/status',
  validateRequest(updateStatusSchema),
  serviceRequestController.updateStatus
);

export const serviceRequestRoutes = router;
