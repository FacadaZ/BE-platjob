import { prisma } from "@shared/database/prisma.js";
import { Review, Prisma } from "@prisma/client";

export class RepositorioResena {
  async crear(data: Prisma.ReviewCreateInput): Promise<Review> {
    return prisma.review.create({
      data,
    });
  }

  async encontrarPorId(id: number): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        request: true,
      },
    });
  }

  async encontrarPorIdSolicitud(requestId: number): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { requestId },
    });
  }

  async listarPorIdTecnico(technicianId: number): Promise<Review[]> {
    return prisma.review.findMany({
      where: { technicianId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async listarPorIdCliente(clientId: number): Promise<Review[]> {
    return prisma.review.findMany({
      where: { clientId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
export const repositorioResena = new RepositorioResena();
