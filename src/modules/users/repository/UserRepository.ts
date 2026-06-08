import { prisma } from "@shared/database/prisma.js";
import { User, Prisma } from "@prisma/client";
import { UserRole } from "@shared/types/roles-statuses.js";

export class UserRepository {
  async findById(id: string | number): Promise<User | null> {
    const numericId = typeof id === 'string' ? Number(id) : id;
    return prisma.user.findUnique({
      where: { id: numericId },
      include: {
        technicianProfile: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        technicianProfile: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async update(id: string | number, data: Prisma.UserUpdateInput): Promise<User> {
    const numericId = typeof id === 'string' ? Number(id) : id;
    return prisma.user.update({
      where: { id: numericId },
      data,
    });
  }

  async listTechnicians(filters: {
    category?: string;
    isAvailable?: boolean;
    isVerified?: boolean;
    query?: string;
  }): Promise<
    (User & {
      technicianProfile: any;
    })[]
  > {
    const whereClause: Prisma.UserWhereInput = {
      role: UserRole.TECHNICIAN,
      technicianProfile: {
        is: {
          categoryKey: {
            notIn: ["General", "general", "GENERAL", ""],
          },
          hourlyRate: {
            gt: 0,
          },
        },
      },
    };

    const techProfileFilters: any = {};
    let hasTechFilters = false;

    if (filters.category) {
      techProfileFilters.categoryKey = { equals: filters.category };
      hasTechFilters = true;
    }

    if (filters.isAvailable !== undefined) {
      techProfileFilters.isAvailable = filters.isAvailable;
      hasTechFilters = true;
    }

    if (filters.isVerified !== undefined) {
      techProfileFilters.isVerified = filters.isVerified;
      hasTechFilters = true;
    }

    if (hasTechFilters) {
      whereClause.technicianProfile = {
        is: {
          ...whereClause.technicianProfile?.is,
          ...techProfileFilters,
        },
      };
    }

    if (filters.query) {
      whereClause.OR = [
        { name: { contains: filters.query } },
        { location: { contains: filters.query } },
        {
          technicianProfile: {
            bio: { contains: filters.query },
          },
        },
      ];
    }

    return prisma.user.findMany({
      where: whereClause,
      include: {
        technicianProfile: {
          include: {
            portfolioItems: true,
            category: true,
          },
        },
      },
      orderBy: {
        technicianProfile: {
          rating: "desc",
        },
      },
    }) as any;
  }
}
export const userRepository = new UserRepository();
