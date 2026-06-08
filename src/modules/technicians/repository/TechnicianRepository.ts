import { prisma } from "@shared/database/prisma.js";
import { TechnicianProfile, PortfolioItem, Prisma } from "@prisma/client";

export class RepositorioTecnico {
  async encontrarPerfilPorIdUsuario(
    userId: number,
  ): Promise<TechnicianProfile | null> {
    return prisma.technicianProfile.findUnique({
      where: { userId },
      include: {
        portfolioItems: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async encontrarPerfilPorId(id: number): Promise<TechnicianProfile | null> {
    return prisma.technicianProfile.findUnique({
      where: { id },
      include: {
        portfolioItems: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async crearPerfil(
    data: Prisma.TechnicianProfileCreateInput,
  ): Promise<TechnicianProfile> {
    return prisma.technicianProfile.create({
      data,
    });
  }

  async actualizarPerfil(
    userId: number,
    data: Prisma.TechnicianProfileUpdateInput,
  ): Promise<TechnicianProfile> {
    return prisma.technicianProfile.update({
      where: { userId },
      data,
    });
  }

  async agregarElementoPortafolio(
    data: Prisma.PortfolioItemCreateInput,
  ): Promise<PortfolioItem> {
    return prisma.portfolioItem.create({
      data,
    });
  }

  async eliminarElementoPortafolio(
    id: number,
    technicianId: number,
  ): Promise<PortfolioItem> {
    return prisma.portfolioItem.delete({
      where: {
        id,
        technicianId,
      },
    });
  }
}
export const repositorioTecnico = new RepositorioTecnico();

export const technicianRepository = {
  async findProfileByUserId(userId: string | number): Promise<TechnicianProfile | null> {
    return repositorioTecnico.encontrarPerfilPorIdUsuario(Number(userId));
  },
  
  async findProfileById(id: string | number): Promise<TechnicianProfile | null> {
    return repositorioTecnico.encontrarPerfilPorId(Number(id));
  },
  
  async createProfile(data: Prisma.TechnicianProfileCreateInput): Promise<TechnicianProfile> {
    return repositorioTecnico.crearPerfil(data);
  },
  
  async updateProfile(userId: string | number, data: Prisma.TechnicianProfileUpdateInput): Promise<TechnicianProfile> {
    return repositorioTecnico.actualizarPerfil(Number(userId), data);
  },
  
  async addPortfolioItem(data: Prisma.PortfolioItemCreateInput): Promise<PortfolioItem> {
    return repositorioTecnico.agregarElementoPortafolio(data);
  },
  
  async deletePortfolioItem(id: string | number, technicianId: string | number): Promise<PortfolioItem> {
    return repositorioTecnico.eliminarElementoPortafolio(Number(id), Number(technicianId));
  }
};

