import { Router } from 'express';
import { authController } from '../controller/AuthController.js';
import { validateRequest } from '@shared/middlewares/ValidationMiddleware.js';
import { registerSchema, loginSchema } from '../validators/AuthValidator.js';
import { isAuthenticated } from '@shared/middlewares/AuthMiddleware.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.get('/me', isAuthenticated, authController.me);

export const authRoutes = router;
