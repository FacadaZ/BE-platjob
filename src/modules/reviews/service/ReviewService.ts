import { repositorioResena } from "../repository/ReviewRepository.js";
import { repositorioSolicitudServicio } from "@modules/service-requests/repository/ServiceRequestRepository.js";
import { repositorioTecnico } from "@modules/technicians/repository/TechnicianRepository.js";
import { AppError } from "@shared/errors/AppError.js";
import { EstadoSolicitud } from "@shared/types/roles-statuses.js";
import { prisma } from "@shared/database/prisma.js";

export class ServicioResena {
  async crear(idCliente: number, datos: any): Promise<any> {
    const solicitud = await repositorioSolicitudServicio.encontrarPorId(
      datos.requestId,
    );

    if (!solicitud) {
      throw AppError.noEncontrado("Solicitud de servicio no encontrada");
    }

    // Validar propiedad de la reseña
    if (solicitud.clientId !== idCliente) {
      throw AppError.prohibido(
        "Solo el cliente que solicitó el servicio puede dejar una reseña",
      );
    }

    // Validar estado del servicio
    if (solicitud.status !== EstadoSolicitud.COMPLETED) {
      throw AppError.solicitudIncorrecta(
        "Solo se pueden reseñar servicios que hayan sido marcados como COMPLETADOS",
      );
    }

    // Validar si ya existe una reseña
    const resenaExistente = await repositorioResena.encontrarPorIdSolicitud(
      datos.requestId,
    );
    if (resenaExistente) {
      throw AppError.conflicto("Ya has calificado este servicio anteriormente");
    }

    // Ejecutar creación y recálculo en transacción de base de datos
    return prisma.$transaction(async (transaccion) => {
      // 1. Crear la reseña
      const resena = await transaccion.review.create({
        data: {
          rating: datos.rating,
          comment: datos.comment,
          request: { connect: { id: datos.requestId } },
          client: { connect: { id: idCliente } },
          technician: { connect: { id: solicitud.technicianId } },
        },
      });

      // 2. Obtener perfil de técnico actual para recálculo
      const perfilTecnico = await transaccion.technicianProfile.findUnique({
        where: { id: solicitud.technicianId },
      });

      if (perfilTecnico) {
        const cuentaActual = perfilTecnico.reviewCount;
        const calificacionActual = perfilTecnico.rating;

        // Recálculo del promedio ponderado
        const nuevaCuenta = cuentaActual + 1;
        const nuevaCalificacion =
          (calificacionActual * cuentaActual + datos.rating) / nuevaCuenta;

        // Redondear a 2 decimales
        const calificacionRedondeada =
          Math.round(nuevaCalificacion * 100) / 100;

        // 3. Actualizar reputación del técnico
        await transaccion.technicianProfile.update({
          where: { id: solicitud.technicianId },
          data: {
            rating: calificacionRedondeada,
            reviewCount: nuevaCuenta,
          },
        });
      }

      return resena;
    });
  }

  async listarPorIdTecnico(idTecnico: number): Promise<any[]> {
    const tecnico = await repositorioTecnico.encontrarPerfilPorId(idTecnico);
    if (!tecnico) {
      throw AppError.noEncontrado("Perfil de técnico no encontrado");
    }
    return repositorioResena.listarPorIdTecnico(idTecnico);
  }

  async listarPorIdCliente(idCliente: number): Promise<any[]> {
    return repositorioResena.listarPorIdCliente(idCliente);
  }

  // English aliases
  async create(clientId: number, data: any): Promise<any> {
    return this.crear(clientId, data);
  }

  async listByTechnicianId(technicianId: any): Promise<any[]> {
    return this.listarPorIdTecnico(Number(technicianId));
  }

  async listByClientId(clientId: any): Promise<any[]> {
    return this.listarPorIdCliente(Number(clientId));
  }
}
export const servicioResena = new ServicioResena();
export const reviewService = servicioResena;

