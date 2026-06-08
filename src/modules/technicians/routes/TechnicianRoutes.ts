import { Router } from 'express';
import { technicianController } from '../controller/TechnicianController.js';
import { isAuthenticated, isAuthorized } from '@shared/middlewares/AuthMiddleware.js';
import { validateRequest } from '@shared/middlewares/ValidationMiddleware.js';
import { updateProfileSchema, addPortfolioItemSchema } from '../validators/TechnicianValidator.js';
import { UserRole } from '@shared/types/roles-statuses.js';

const router = Router();

// Rutas Públicas
router.get('/categories', technicianController.getCategories);
router.get('/', technicianController.list);
router.get('/:id', technicianController.getProfileById);

// Rutas de Técnico Protegidas
router.get(
  '/profile/me',
  isAuthenticated,
  isAuthorized([UserRole.TECHNICIAN]),
  technicianController.getProfile
);
router.put(
  '/profile/me',
  isAuthenticated,
  isAuthorized([UserRole.TECHNICIAN]),
  validateRequest(updateProfileSchema),
  technicianController.update
);
router.post(
  '/portfolio',
  isAuthenticated,
  isAuthorized([UserRole.TECHNICIAN]),
  validateRequest(addPortfolioItemSchema),
  technicianController.addPortfolio
);
router.delete(
  '/portfolio/:id',
  isAuthenticated,
  isAuthorized([UserRole.TECHNICIAN]),
  technicianController.deletePortfolio
);

export const technicianRoutes = router;
