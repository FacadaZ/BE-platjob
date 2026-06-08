import { prisma } from "@shared/database/prisma.js";
import { ServiceRequest, Prisma } from "@prisma/client";
import { EstadoSolicitud } from "@shared/types/roles-statuses.js";

export class RepositorioSolicitudServicio {
  async crear(data: Prisma.ServiceRequestCreateInput): Promise<ServiceRequest> {
    return prisma.serviceRequest.create({
      data,
    });
  }

  async encontrarPorId(id: number): Promise<any> {
    return prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
        review: true,
      },
    });
  }

  async actualizar(
    id: number,
    data: Prisma.ServiceRequestUpdateInput,
  ): Promise<ServiceRequest> {
    return prisma.serviceRequest.update({
      where: { id },
      data,
    });
  }

  async listar(filtros: {
    idCliente?: number;
    idTecnico?: number;
    estado?: EstadoSolicitud;
  }): Promise<any[]> {
    const whereClause: Prisma.ServiceRequestWhereInput = {};

    if (filtros.idCliente) {
      whereClause.clientId = filtros.idCliente;
    }

    if (filtros.idTecnico) {
      whereClause.technicianId = filtros.idTecnico;
    }

    if (filtros.estado) {
      whereClause.status = filtros.estado;
    }

    return prisma.serviceRequest.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
        review: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
export const repositorioSolicitudServicio = new RepositorioSolicitudServicio();
