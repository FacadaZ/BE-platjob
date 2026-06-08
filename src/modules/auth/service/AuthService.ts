import { userRepository } from '@modules/users/repository/UserRepository.js';
import { technicianRepository } from '@modules/technicians/repository/TechnicianRepository.js';
import { HashProvider } from '@shared/providers/HashProvider.js';
import { TokenProvider } from '@shared/providers/TokenProvider.js';
import { AppError } from '@shared/errors/AppError.js';
import { UserRole } from '@shared/types/roles-statuses.js';
import { prisma } from '@shared/database/prisma.js';

export class AuthService {
  async register(data: any): Promise<{ user: any; token: string }> {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw AppError.conflict('El correo electrónico ya está registrado');
    }

    const hashedPassword = await HashProvider.generateHash(data.password);

    const userRole = String(data.role || 'CLIENT').toUpperCase();

    // Creamos el usuario base
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: userRole,
      phone: data.phone,
      location: data.location,
      avatarUrl: data.avatarUrl,
    });

    // Si es técnico, creamos su perfil técnico
    if (userRole === UserRole.TECHNICIAN) {
      const keyMapping: Record<string, string> = {
        electrician: 'electricista',
        plumber: 'plomero',
        carpenter: 'carpintero',
        mason: 'albanil',
        painter: 'pintor',
        locksmith: 'cerrajero',
        hvac: 'climatizacion',
        cleaner: 'limpieza',
        gardener: 'jardinero',
        welder: 'soldador',
      };

      const rawCategory = data.category ? String(data.category).trim().toLowerCase() : '';
      const mappedCategoryKey = keyMapping[rawCategory] || rawCategory || 'electricista';

      // Validamos si la categoría existe en la base de datos para prevenir fallas de clave foránea
      const categoryExists = await prisma.category.findUnique({
        where: { key: mappedCategoryKey },
      });

      const finalCategoryKey = categoryExists ? mappedCategoryKey : 'electricista';

      await technicianRepository.createProfile({
        user: { connect: { id: user.id } },
        category: { connect: { key: finalCategoryKey } },
        specialties: JSON.stringify(data.specialties || []),
        bio: data.bio || null,
        hourlyRate: data.hourlyRate || 0,
      } as any);
    }

    // Generamos el token JWT
    const token = TokenProvider.generateToken({
      sub: String(user.id),
      email: user.email,
      role: user.role as any,
    });

    const { passwordHash: _, ...userWithoutPassword } = user as any;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(credentials: any): Promise<{ user: any; token: string }> {
    const user = await userRepository.findByEmail(credentials.email);

    if (!user) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    if (user.status === 'BLOCKED') {
      const anyUser = user as any;
      if (anyUser.suspendedUntil && new Date(anyUser.suspendedUntil) < new Date()) {
        // Auto unblock
        await (prisma.user.update as any)({
          where: { id: user.id },
          data: {
            status: 'ACTIVE',
            suspensionReason: null,
            suspendedUntil: null
          }
        });
        user.status = 'ACTIVE';
      } else {
        throw new AppError('Tu cuenta ha sido suspendida', 403, [{
          code: 'USER_SUSPENDED',
          reason: anyUser.suspensionReason || 'Por favor, ponte en contacto con soporte.',
          suspendedUntil: anyUser.suspendedUntil
        }]);
      }
    }

    const passwordMatch = await HashProvider.compareHash(credentials.password, user.passwordHash);

    if (!passwordMatch) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    // Generamos token
    const token = TokenProvider.generateToken({
      sub: String(user.id),
      email: user.email,
      role: user.role as any,
    });

    const { passwordHash: _, ...userWithoutPassword } = user as any;

    return {
      user: userWithoutPassword,
      token,
    };
  }
}
export const authService = new AuthService();
