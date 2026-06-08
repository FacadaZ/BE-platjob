import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/AuthService.js';
import { ApiResponse } from '@shared/utils/ApiResponse.js';
import { AppError } from '@shared/errors/AppError.js';
import { userRepository } from '@modules/users/repository/UserRepository.js';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      ApiResponse.created(res, 'Usuario registrado con éxito', result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      ApiResponse.success(res, 'Sesión iniciada con éxito', result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const userProfile = await userRepository.findById(req.user.id);
      if (!userProfile) {
        throw AppError.notFound('Usuario no encontrado');
      }
      const { passwordHash: _, ...userWithoutPassword } = userProfile as any;
      ApiResponse.success(res, 'Perfil del usuario obtenido con éxito', userWithoutPassword);
    } catch (err) {
      next(err);
    }
  };
}
export const authController = new AuthController();
