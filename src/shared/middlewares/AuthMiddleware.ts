import { Request, Response, NextFunction } from 'express';
import { TokenProvider } from '@shared/providers/TokenProvider.js';
import { AppError } from '@shared/errors/AppError.js';
import { UserRole } from '@shared/types/roles-statuses.js';
import { prisma } from '@shared/database/prisma.js';

export const isAuthenticated = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(AppError.unauthorized('Token no proporcionado'));
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(AppError.unauthorized('Formato de token inválido. Debe ser Bearer <token>'));
  }

  try {
    const decoded = TokenProvider.verifyToken(token);
    const userId = Number(decoded.sub);

    // Verificamos si el usuario está bloqueado en la base de datos
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(AppError.unauthorized('Usuario no encontrado'));
    }

    if (user.status === 'BLOCKED') {
      return next(AppError.unauthorized('Tu cuenta ha sido suspendida. Por favor, ponte en contacto con soporte.'));
    }

    req.user = {
      id: userId,
      email: decoded.email,
      role: decoded.role as UserRole,
    };
    next();
  } catch (err) {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
};

export const isAuthorized = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Usuario no autenticado');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden('No tienes permiso para acceder a este recurso');
    }

    next();
  };
};
