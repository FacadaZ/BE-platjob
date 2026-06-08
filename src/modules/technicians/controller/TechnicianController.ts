import { Request, Response, NextFunction } from 'express';
import { technicianService } from '../service/TechnicianService.js';
import { ApiResponse } from '@shared/utils/ApiResponse.js';
import { AppError } from '@shared/errors/AppError.js';
import { prisma } from '@shared/database/prisma.js';

export class TechnicianController {
  getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { id: 'asc' },
      });
      ApiResponse.success(res, 'Categorias obtenidas con exito', categories);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category, isAvailable, isVerified, query } = req.query;
      
      const filters = {
        category: category as string,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        query: query as string,
      };

      const technicians = await technicianService.list(filters);
      ApiResponse.success(res, 'Técnicos listados con éxito', technicians);
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const profile = await technicianService.getProfile(req.user.id);
      ApiResponse.success(res, 'Perfil técnico obtenido con éxito', profile);
    } catch (err) {
      next(err);
    }
  };

  getProfileById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const profile = await technicianService.getProfileById(id);
      ApiResponse.success(res, 'Perfil técnico por ID obtenido con éxito', profile);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const updated = await technicianService.updateProfile(req.user.id, req.body);
      ApiResponse.success(res, 'Perfil técnico actualizado con éxito', updated);
    } catch (err) {
      next(err);
    }
  };

  addPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const item = await technicianService.addPortfolioItem(req.user.id, req.body);
      ApiResponse.created(res, 'Elemento agregado al portafolio con éxito', item);
    } catch (err) {
      next(err);
    }
  };

  deletePortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id } = req.params;
      await technicianService.deletePortfolioItem(req.user.id, id);
      ApiResponse.success(res, 'Elemento del portafolio eliminado con éxito');
    } catch (err) {
      next(err);
    }
  };
}
export const technicianController = new TechnicianController();
