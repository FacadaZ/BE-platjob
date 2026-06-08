import { Request, Response, NextFunction } from 'express';
import { serviceRequestService } from '../service/ServiceRequestService.js';
import { ApiResponse } from '@shared/utils/ApiResponse.js';
import { AppError } from '@shared/errors/AppError.js';
import { RequestStatus } from '@shared/types/roles-statuses.js';

export class ServiceRequestController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const request = await serviceRequestService.create(req.user.id, req.body);
      ApiResponse.created(res, 'Solicitud de servicio creada con éxito', request);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id } = req.params;
      const request = await serviceRequestService.getById(id, req.user.id);
      ApiResponse.success(res, 'Solicitud de servicio obtenida con éxito', request);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { status } = req.query;
      const requestStatus = status ? (status as RequestStatus) : undefined;
      
      const requests = await serviceRequestService.list(req.user.id, req.user.role, requestStatus);
      ApiResponse.success(res, 'Solicitudes de servicio listadas con éxito', requests);
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('No autenticado');
      }
      const { id } = req.params;
      const { status, agreedRate } = req.body;

      const request = await serviceRequestService.updateStatus(id, req.user.id, status, agreedRate);
      ApiResponse.success(res, `Estado de solicitud actualizado a '${status}' con éxito`, request);
    } catch (err) {
      next(err);
    }
  };
}
export const serviceRequestController = new ServiceRequestController();
