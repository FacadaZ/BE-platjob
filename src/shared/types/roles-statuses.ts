export enum RolUsuario {
  CLIENT = "CLIENT",
  TECHNICIAN = "TECHNICIAN",
  ADMIN = "ADMIN",
}

export enum EstadoSolicitud {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export { RolUsuario as UserRole, EstadoSolicitud as RequestStatus };
