import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shared/database/prisma.js';
import { ApiResponse } from '@shared/utils/ApiResponse.js';
import { AppError } from '@shared/errors/AppError.js';

export class AdminController {
  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { key, label } = req.body;

      if (!key || !label) {
        throw AppError.badRequest('La clave (key) y la etiqueta (label) son campos obligatorios');
      }

      // Aseguramos que la llave esté en minúsculas y limpia de espacios
      const normalizedKey = String(key).trim().toLowerCase();

      const existingCategory = await prisma.category.findUnique({
        where: { key: normalizedKey },
      });

      if (existingCategory) {
        throw AppError.conflict('Ya existe una categoría con esta clave (key)');
      }

      const category = await prisma.category.create({
        data: {
          key: normalizedKey,
          label: String(label).trim(),
        },
      });

      ApiResponse.created(res, 'Categoría creada con éxito', category);
    } catch (err) {
      next(err);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        throw AppError.badRequest('El ID de categoría proporcionado no es válido');
      }

      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw AppError.notFound('La categoría solicitada no existe');
      }

      await prisma.category.delete({
        where: { id },
      });

      ApiResponse.success(res, 'Categoría eliminada con éxito');
    } catch (err) {
      next(err);
    }
  };
  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { key, label } = req.body;

      if (isNaN(id)) {
        throw AppError.badRequest('El ID de categoría proporcionado no es válido');
      }

      if (!key && !label) {
        throw AppError.badRequest('Se requiere al menos un campo (key o label) para actualizar');
      }

      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        throw AppError.notFound('La categoría solicitada no existe');
      }

      const updateData: any = {};
      
      if (key !== undefined) {
        const normalizedKey = String(key).trim().toLowerCase();
        
        // Verificar si la nueva clave ya está en uso por otra categoría
        if (normalizedKey !== category.key) {
          const existingCategory = await prisma.category.findUnique({
            where: { key: normalizedKey },
          });
          
          if (existingCategory) {
            throw AppError.conflict('Ya existe otra categoría con esta clave (key)');
          }
        }
        updateData.key = normalizedKey;
      }

      if (label !== undefined) {
        updateData.label = String(label).trim();
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: updateData,
      });

      ApiResponse.success(res, 'Categoría actualizada con éxito', updatedCategory);
    } catch (err) {
      next(err);
    }
  };

  toggleUserBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { status, suspensionReason, suspendedUntil } = req.body;

      if (isNaN(id)) {
        throw AppError.badRequest('El ID de usuario proporcionado no es válido');
      }

      if (!status || (status !== 'ACTIVE' && status !== 'BLOCKED')) {
        throw AppError.badRequest('El estado (status) proporcionado no es válido. Debe ser ACTIVE o BLOCKED');
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw AppError.notFound('El usuario solicitado no existe');
      }

      if (user.role === 'ADMIN') {
        throw AppError.forbidden('No es posible bloquear o suspender a otro administrador del sistema');
      }

      const dataToUpdate: any = { status };
      
      if (status === 'BLOCKED') {
        dataToUpdate.suspensionReason = suspensionReason || null;
        dataToUpdate.suspendedUntil = suspendedUntil ? new Date(suspendedUntil) : null;
      } else {
        dataToUpdate.suspensionReason = null;
        dataToUpdate.suspendedUntil = null;
      }

      const updatedUser = await (prisma.user.update as any)({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          suspensionReason: true,
          suspendedUntil: true,
          updatedAt: true,
        },
      });

      ApiResponse.success(res, 'Estado del usuario actualizado con éxito', updatedUser);
    } catch (err) {
      next(err);
    }
  };

  listUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { id: 'asc' },
      });

      ApiResponse.success(res, 'Usuarios listados con éxito', users);
    } catch (err) {
      next(err);
    }
  };
}

export const adminController = new AdminController();
