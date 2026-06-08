import { technicianRepository } from '../repository/TechnicianRepository.js';
import { userRepository } from '@modules/users/repository/UserRepository.js';
import { AppError } from '@shared/errors/AppError.js';

export class TechnicianService {
  async list(filters: {
    category?: string;
    isAvailable?: boolean;
    isVerified?: boolean;
    query?: string;
  }): Promise<any[]> {
    const techUsers = await userRepository.listTechnicians(filters);
    
    // Parseamos Specialties JSON a Objeto para la respuesta limpia
    return techUsers.map((u) => {
      const { passwordHash: _, ...userWithoutPassword } = u as any;
      if (userWithoutPassword.technicianProfile) {
        try {
          userWithoutPassword.technicianProfile.specialties = JSON.parse(
            userWithoutPassword.technicianProfile.specialties
          );
        } catch (_) {
          userWithoutPassword.technicianProfile.specialties = [];
        }
        // Preservar la etiqueta de la categoría antes de sobrescribir
        userWithoutPassword.technicianProfile.categoryLabel = userWithoutPassword.technicianProfile.category?.label || userWithoutPassword.technicianProfile.categoryKey;
        userWithoutPassword.technicianProfile.category = userWithoutPassword.technicianProfile.categoryKey;
      }
      return userWithoutPassword;
    });
  }

  async getProfile(userId: string | number): Promise<any> {
    let profile = await technicianRepository.findProfileByUserId(userId);
    
    if (!profile) {
      // Autocuración: si el usuario es técnico pero no tiene perfil, lo inicializamos
      const user = await userRepository.findById(userId);
      if (user && user.role === 'TECHNICIAN') {
        profile = await technicianRepository.createProfile({
          user: { connect: { id: user.id } },
          category: { connect: { key: 'electricista' } },
          specialties: JSON.stringify([]),
          bio: 'Perfil profesional inicial',
          hourlyRate: 0,
        } as any);
      } else {
        throw AppError.notFound('Perfil de técnico no encontrado');
      }
    }

    const profileData = profile as any;
    try {
      profileData.specialties = typeof profileData.specialties === 'string' 
        ? JSON.parse(profileData.specialties) 
        : profileData.specialties;
    } catch (_) {
      profileData.specialties = [];
    }

    // Preservar la etiqueta de la categoría antes de sobrescribir
    profileData.categoryLabel = profileData.category?.label || profileData.categoryKey;
    profileData.category = profileData.categoryKey;
    return profileData;
  }

  async getProfileById(id: string): Promise<any> {
    const profile = await technicianRepository.findProfileById(id);
    if (!profile) {
      throw AppError.notFound('Perfil de técnico no encontrado');
    }

    const profileData = profile as any;
    try {
      profileData.specialties = JSON.parse(profileData.specialties);
    } catch (_) {
      profileData.specialties = [];
    }

    // Preservar la etiqueta de la categoría antes de sobrescribir
    profileData.categoryLabel = profileData.category?.label || profileData.categoryKey;
    profileData.category = profileData.categoryKey;
    return profileData;
  }

  async updateProfile(userId: string | number, data: any): Promise<any> {
    const profile = await technicianRepository.findProfileByUserId(userId);
    if (!profile) {
      throw AppError.notFound('Perfil de técnico no encontrado');
    }

    // Si hay datos del usuario base, los actualizamos
    if (data.name || data.phone || data.location) {
      await userRepository.update(userId, {
        name: data.name,
        phone: data.phone,
        location: data.location,
      });
    }

    // Actualizamos datos específicos del perfil de técnico
    const techUpdateData: any = {};
    if (data.category !== undefined) {
      techUpdateData.category = { connect: { key: data.category } };
    }
    if (data.bio !== undefined) techUpdateData.bio = data.bio;
    if (data.hourlyRate !== undefined) techUpdateData.hourlyRate = data.hourlyRate;
    if (data.isAvailable !== undefined) techUpdateData.isAvailable = data.isAvailable;
    if (data.responseTime !== undefined) techUpdateData.responseTime = data.responseTime;
    if (data.specialties !== undefined) {
      techUpdateData.specialties = JSON.stringify(data.specialties);
    }

    if (Object.keys(techUpdateData).length > 0) {
      await technicianRepository.updateProfile(userId, techUpdateData);
    }

    return this.getProfile(userId);
  }

  async addPortfolioItem(userId: string | number, data: any): Promise<any> {
    const profile = await technicianRepository.findProfileByUserId(userId);
    if (!profile) {
      throw AppError.notFound('Perfil de técnico no encontrado para agregar portafolio');
    }

    const item = await technicianRepository.addPortfolioItem({
      imageUrl: data.imageUrl,
      title: data.title,
      description: data.description,
      technician: { connect: { id: profile.id } },
    });

    return item;
  }

  async deletePortfolioItem(userId: string | number, id: string | number): Promise<void> {
    const profile = await technicianRepository.findProfileByUserId(userId);
    if (!profile) {
      throw AppError.notFound('Perfil de técnico no encontrado');
    }

    await technicianRepository.deletePortfolioItem(id, profile.id);
  }
}
export const technicianService = new TechnicianService();
