import { Router } from 'express';
import { adminController } from '../controller/AdminController.js';
import { isAuthenticated, isAuthorized } from '@shared/middlewares/AuthMiddleware.js';
import { UserRole } from '@shared/types/roles-statuses.js';

const router = Router();

// Todas las rutas de administración requieren autenticación y rol de ADMIN
router.use(isAuthenticated, isAuthorized([UserRole.ADMIN]));

// Rutas de Categorías Administrativas
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Rutas de Usuarios Administrativas
router.get('/users', adminController.listUsers);
router.patch('/users/:id/block', adminController.toggleUserBlock);

export const adminRoutes = router;
