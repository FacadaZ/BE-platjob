import { repositorioSolicitudServicio } from "../repository/ServiceRequestRepository.js";
import { repositorioTecnico } from "@modules/technicians/repository/TechnicianRepository.js";
import { AppError } from "@shared/errors/AppError.js";
import { EstadoSolicitud, RolUsuario } from "@shared/types/roles-statuses.js";

export class ServicioSolicitudServicio {
  async crear(idCliente: number, datos: any): Promise<any> {
    const technicianId = datos.technicianId || datos.idTecnico;
    const tecnico = await repositorioTecnico.encontrarPerfilPorId(
      technicianId,
    );

    if (!tecnico) {
      throw AppError.noEncontrado(
        "El perfil del técnico especificado no existe",
      );
    }

    if (!tecnico.isAvailable) {
      throw AppError.solicitudIncorrecta(
        "El técnico no se encuentra disponible actualmente",
      );
    }

    const scheduledDateVal = datos.scheduledDate || datos.fechaProgramada;
    const budgetVal = datos.budget !== undefined ? datos.budget : datos.presupuesto;

    const solicitud = await repositorioSolicitudServicio.crear({
      client: { connect: { id: idCliente } },
      technician: { connect: { id: tecnico.id } },
      category: datos.category || datos.categoria,
      title: datos.title || datos.titulo,
      description: datos.description || datos.descripcion,
      address: datos.address || datos.direccion,
      scheduledDate: scheduledDateVal ? new Date(scheduledDateVal) : null,
      budget: budgetVal !== undefined ? budgetVal : null,
      status: EstadoSolicitud.PENDING,
    });

    return solicitud;
  }

  async obtenerPorId(id: number, idUsuario: number): Promise<any> {
    const solicitud = await repositorioSolicitudServicio.encontrarPorId(id);

    if (!solicitud) {
      throw AppError.noEncontrado("Solicitud de servicio no encontrada");
    }

    // Seguridad: Verificar que el usuario es parte de la solicitud (Cliente o Técnico)
    const esCliente = solicitud.clientId === idUsuario;
    const esTecnico = solicitud.technician.userId === idUsuario;

    if (!esCliente && !esTecnico) {
      throw AppError.prohibido(
        "No tienes permiso para visualizar esta solicitud",
      );
    }

    return solicitud;
  }

  async listar(
    idUsuario: number,
    rol: RolUsuario,
    estado?: EstadoSolicitud,
  ): Promise<any[]> {
    let filtros: {
      idCliente?: number;
      idTecnico?: number;
      estado?: EstadoSolicitud;
    } = { estado };

    if (rol === RolUsuario.CLIENT) {
      filtros.idCliente = idUsuario;
    } else if (rol === RolUsuario.TECHNICIAN) {
      const perfil =
        await repositorioTecnico.encontrarPerfilPorIdUsuario(idUsuario);
      if (!perfil) {
        throw AppError.noEncontrado("Perfil de técnico no encontrado");
      }
      filtros.idTecnico = perfil.id;
    }

    return repositorioSolicitudServicio.listar(filtros);
  }

  async actualizarEstado(
    idSolicitud: number,
    idUsuario: number,
    nuevoEstado: EstadoSolicitud,
    tarifaAcordada?: number,
  ): Promise<any> {
    const solicitud =
      await repositorioSolicitudServicio.encontrarPorId(idSolicitud);

    if (!solicitud) {
      throw AppError.noEncontrado("Solicitud de servicio no encontrada");
    }

    const esCliente = solicitud.clientId === idUsuario;
    const esTecnico = solicitud.technician.userId === idUsuario;

    if (!esCliente && !esTecnico) {
      throw AppError.prohibido(
        "No tienes permisos para modificar esta solicitud",
      );
    }

    const estadoActual = solicitud.status as EstadoSolicitud;

    // Reglas de negocio para cambios de estado
    if (nuevoEstado === estadoActual) {
      return solicitud;
    }

    const datosActualizacion: any = { status: nuevoEstado };

    switch (estadoActual) {
      case EstadoSolicitud.PENDING:
        if (nuevoEstado === EstadoSolicitud.ACCEPTED) {
          if (!esTecnico) {
            throw AppError.prohibido(
              "Solo el técnico puede aceptar una solicitud pendiente",
            );
          }
          // El técnico puede fijar la tarifa acordada, pero respetamos si ya se negoció en el chat
          datosActualizacion.agreedRate =
            tarifaAcordada ||
            solicitud.agreedRate ||
            solicitud.budget ||
            solicitud.technician.hourlyRate;
        } else if (nuevoEstado === EstadoSolicitud.CANCELLED) {
          // Ambos pueden cancelar en estado pendiente
        } else {
          throw AppError.solicitudIncorrecta(
            `Transición de estado inválida: de ${estadoActual} a ${nuevoEstado}`,
          );
        }
        break;

      case EstadoSolicitud.ACCEPTED:
        if (nuevoEstado === EstadoSolicitud.IN_PROGRESS) {
          if (!esTecnico) {
            throw AppError.prohibido(
              "Solo el técnico puede iniciar el trabajo de la solicitud",
            );
          }
        } else if (nuevoEstado === EstadoSolicitud.CANCELLED) {
          // Ambos pueden cancelar en estado aceptado
        } else {
          throw AppError.solicitudIncorrecta(
            `Transición de estado inválida: de ${estadoActual} a ${nuevoEstado}`,
          );
        }
        break;

      case EstadoSolicitud.IN_PROGRESS:
        if (nuevoEstado === EstadoSolicitud.COMPLETED) {
          if (!esTecnico) {
            throw AppError.prohibido(
              "Solo el técnico puede marcar la solicitud como completada",
            );
          }
          datosActualizacion.completedDate = new Date();

          // Incrementar los trabajos completados del técnico automáticamente
          await repositorioTecnico.actualizarPerfil(
            solicitud.technician.userId,
            {
              jobsCompleted: {
                increment: 1,
              },
            },
          );
        } else if (nuevoEstado === EstadoSolicitud.CANCELLED) {
          if (!esTecnico && !esCliente) {
            throw AppError.prohibido("No autorizado");
          }
        } else {
          throw AppError.solicitudIncorrecta(
            `Transición de estado inválida: de ${estadoActual} a ${nuevoEstado}`,
          );
        }
        break;

      case EstadoSolicitud.COMPLETED:
      case EstadoSolicitud.CANCELLED:
        throw AppError.solicitudIncorrecta(
          `No se puede modificar una solicitud en estado finalizado o cancelado`,
        );
    }

    const solicitudActualizada = await repositorioSolicitudServicio.actualizar(
      idSolicitud,
      datosActualizacion,
    );
    return solicitudActualizada;
  }

  // English aliases
  async create(clientId: number, data: any): Promise<any> {
    return this.crear(clientId, data);
  }

  async getById(id: string | number, userId: number): Promise<any> {
    return this.obtenerPorId(Number(id), userId);
  }

  async list(userId: number, role: RolUsuario, status?: EstadoSolicitud): Promise<any[]> {
    return this.listar(userId, role, status);
  }

  async updateStatus(id: string | number, userId: number, status: EstadoSolicitud, agreedRate?: number): Promise<any> {
    return this.actualizarEstado(Number(id), userId, status, agreedRate);
  }
}
export const servicioSolicitudServicio = new ServicioSolicitudServicio();
export const serviceRequestService = servicioSolicitudServicio;

