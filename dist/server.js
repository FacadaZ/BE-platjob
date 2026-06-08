// src/server.ts
import { createServer } from "http";

// src/app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// src/routes/index.ts
import { Router as Router7 } from "express";

// src/modules/auth/routes/AuthRoutes.ts
import { Router } from "express";

// src/shared/database/prisma.ts
import { PrismaClient } from "@prisma/client";

// src/config/environment.ts
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
var envSchema = z.object({
  PORT: z.coerce.number().default(3e3),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL env variable is required"
  }),
  JWT_SECRET: z.string({
    required_error: "JWT_SECRET env variable is required"
  }),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*")
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274C Invalid environment variables:", parsed.error.format());
  process.exit(1);
}
var env = parsed.data;

// src/shared/database/prisma.ts
var prisma = globalThis.prisma || new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});
if (env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// src/shared/types/roles-statuses.ts
var RolUsuario = /* @__PURE__ */ ((RolUsuario2) => {
  RolUsuario2["CLIENT"] = "CLIENT";
  RolUsuario2["TECHNICIAN"] = "TECHNICIAN";
  RolUsuario2["ADMIN"] = "ADMIN";
  return RolUsuario2;
})(RolUsuario || {});
var EstadoSolicitud = /* @__PURE__ */ ((EstadoSolicitud2) => {
  EstadoSolicitud2["PENDING"] = "PENDING";
  EstadoSolicitud2["ACCEPTED"] = "ACCEPTED";
  EstadoSolicitud2["IN_PROGRESS"] = "IN_PROGRESS";
  EstadoSolicitud2["COMPLETED"] = "COMPLETED";
  EstadoSolicitud2["CANCELLED"] = "CANCELLED";
  return EstadoSolicitud2;
})(EstadoSolicitud || {});

// src/modules/users/repository/UserRepository.ts
var UserRepository = class {
  async findById(id) {
    const numericId = typeof id === "string" ? Number(id) : id;
    return prisma.user.findUnique({
      where: { id: numericId },
      include: {
        technicianProfile: true
      }
    });
  }
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        technicianProfile: true
      }
    });
  }
  async create(data) {
    return prisma.user.create({
      data
    });
  }
  async update(id, data) {
    const numericId = typeof id === "string" ? Number(id) : id;
    return prisma.user.update({
      where: { id: numericId },
      data
    });
  }
  async listTechnicians(filters) {
    const whereClause = {
      role: "TECHNICIAN" /* TECHNICIAN */,
      technicianProfile: {
        is: {
          categoryKey: {
            notIn: ["General", "general", "GENERAL", ""]
          },
          hourlyRate: {
            gt: 0
          }
        }
      }
    };
    const techProfileFilters = {};
    let hasTechFilters = false;
    if (filters.category) {
      techProfileFilters.categoryKey = { equals: filters.category };
      hasTechFilters = true;
    }
    if (filters.isAvailable !== void 0) {
      techProfileFilters.isAvailable = filters.isAvailable;
      hasTechFilters = true;
    }
    if (filters.isVerified !== void 0) {
      techProfileFilters.isVerified = filters.isVerified;
      hasTechFilters = true;
    }
    if (hasTechFilters) {
      whereClause.technicianProfile = {
        is: {
          ...whereClause.technicianProfile?.is,
          ...techProfileFilters
        }
      };
    }
    if (filters.query) {
      whereClause.OR = [
        { name: { contains: filters.query } },
        { location: { contains: filters.query } },
        {
          technicianProfile: {
            bio: { contains: filters.query }
          }
        }
      ];
    }
    return prisma.user.findMany({
      where: whereClause,
      include: {
        technicianProfile: {
          include: {
            portfolioItems: true
          }
        }
      },
      orderBy: {
        technicianProfile: {
          rating: "desc"
        }
      }
    });
  }
};
var userRepository = new UserRepository();

// src/modules/technicians/repository/TechnicianRepository.ts
var RepositorioTecnico = class {
  async encontrarPerfilPorIdUsuario(userId) {
    return prisma.technicianProfile.findUnique({
      where: { userId },
      include: {
        portfolioItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async encontrarPerfilPorId(id) {
    return prisma.technicianProfile.findUnique({
      where: { id },
      include: {
        portfolioItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async crearPerfil(data) {
    return prisma.technicianProfile.create({
      data
    });
  }
  async actualizarPerfil(userId, data) {
    return prisma.technicianProfile.update({
      where: { userId },
      data
    });
  }
  async agregarElementoPortafolio(data) {
    return prisma.portfolioItem.create({
      data
    });
  }
  async eliminarElementoPortafolio(id, technicianId) {
    return prisma.portfolioItem.delete({
      where: {
        id,
        technicianId
      }
    });
  }
};
var repositorioTecnico = new RepositorioTecnico();
var technicianRepository = {
  async findProfileByUserId(userId) {
    return repositorioTecnico.encontrarPerfilPorIdUsuario(Number(userId));
  },
  async findProfileById(id) {
    return repositorioTecnico.encontrarPerfilPorId(Number(id));
  },
  async createProfile(data) {
    return repositorioTecnico.crearPerfil(data);
  },
  async updateProfile(userId, data) {
    return repositorioTecnico.actualizarPerfil(Number(userId), data);
  },
  async addPortfolioItem(data) {
    return repositorioTecnico.agregarElementoPortafolio(data);
  },
  async deletePortfolioItem(id, technicianId) {
    return repositorioTecnico.eliminarElementoPortafolio(Number(id), Number(technicianId));
  }
};

// src/shared/providers/HashProvider.ts
import bcrypt from "bcrypt";
var HashProvider = class {
  static SALT_ROUNDS = 10;
  static async generateHash(payload) {
    return bcrypt.hash(payload, this.SALT_ROUNDS);
  }
  static async compareHash(payload, hashed) {
    return bcrypt.compare(payload, hashed);
  }
};

// src/shared/providers/TokenProvider.ts
import jwt from "jsonwebtoken";
var TokenProvider = class {
  static generateToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });
  }
  static verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
  }
};

// src/shared/errors/AppError.ts
var AppError = class _AppError extends Error {
  statusCode;
  isOperational;
  errors;
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
  static solicitudIncorrecta(message, errors = []) {
    return new _AppError(message, 400, errors);
  }
  static badRequest(message, errors = []) {
    return this.solicitudIncorrecta(message, errors);
  }
  static noAutorizado(message) {
    return new _AppError(message, 401);
  }
  static unauthorized(message) {
    return this.noAutorizado(message);
  }
  static prohibido(message) {
    return new _AppError(message, 403);
  }
  static forbidden(message) {
    return this.prohibido(message);
  }
  static noEncontrado(message) {
    return new _AppError(message, 404);
  }
  static notFound(message) {
    return this.noEncontrado(message);
  }
  static conflicto(message) {
    return new _AppError(message, 409);
  }
  static conflict(message) {
    return this.conflicto(message);
  }
  static interno(message) {
    return new _AppError(message, 500);
  }
  static internal(message) {
    return this.interno(message);
  }
};

// src/modules/auth/service/AuthService.ts
var AuthService = class {
  async register(data) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw AppError.conflict("El correo electr\xF3nico ya est\xE1 registrado");
    }
    const hashedPassword = await HashProvider.generateHash(data.password);
    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      role: data.role,
      phone: data.phone,
      location: data.location,
      avatarUrl: data.avatarUrl
    });
    if (data.role === "TECHNICIAN" /* TECHNICIAN */) {
      await technicianRepository.createProfile({
        user: { connect: { id: user.id } },
        category: data.category || "General",
        specialties: JSON.stringify(data.specialties || []),
        bio: data.bio || null,
        hourlyRate: data.hourlyRate || 0
      });
    }
    const token = TokenProvider.generateToken({
      sub: String(user.id),
      email: user.email,
      role: user.role
    });
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }
  async login(credentials) {
    const user = await userRepository.findByEmail(credentials.email);
    if (!user) {
      throw AppError.unauthorized("Credenciales incorrectas");
    }
    if (user.status === "BLOCKED") {
      throw AppError.forbidden("Tu cuenta ha sido suspendida. Por favor, ponte en contacto con soporte.");
    }
    const passwordMatch = await HashProvider.compareHash(credentials.password, user.passwordHash);
    if (!passwordMatch) {
      throw AppError.unauthorized("Credenciales incorrectas");
    }
    const token = TokenProvider.generateToken({
      sub: String(user.id),
      email: user.email,
      role: user.role
    });
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }
};
var authService = new AuthService();

// src/shared/utils/ApiResponse.ts
var ApiResponse = class {
  static success(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
  static created(res, message, data) {
    return this.success(res, message, data, 201);
  }
};

// src/modules/auth/controller/AuthController.ts
var AuthController = class {
  register = async (req, res) => {
    const result = await authService.register(req.body);
    ApiResponse.created(res, "Usuario registrado con \xE9xito", result);
  };
  login = async (req, res) => {
    const result = await authService.login(req.body);
    ApiResponse.success(res, "Sesi\xF3n iniciada con \xE9xito", result);
  };
  me = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const userProfile = await userRepository.findById(req.user.id);
    if (!userProfile) {
      throw AppError.notFound("Usuario no encontrado");
    }
    const { passwordHash: _, ...userWithoutPassword } = userProfile;
    ApiResponse.success(res, "Perfil del usuario obtenido con \xE9xito", userWithoutPassword);
  };
};
var authController = new AuthController();

// src/shared/utils/AsyncHandler.ts
var asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// src/shared/middlewares/ValidationMiddleware.ts
var validateRequest = (schema) => {
  return asyncHandler(async (req, _res, next) => {
    const validated = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    req.body = validated.body;
    req.query = validated.query;
    req.params = validated.params;
    next();
  });
};

// src/modules/auth/validators/AuthValidator.ts
import { z as z2 } from "zod";
var esquemaRegistro = z2.object({
  body: z2.object({
    name: z2.string({ required_error: "El nombre es requerido" }).min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z2.string({ required_error: "El email es requerido" }).email("Formato de email inv\xE1lido"),
    password: z2.string({ required_error: "La contrase\xF1a es requerida" }).min(6, "La contrase\xF1a debe tener al menos 6 caracteres"),
    role: z2.nativeEnum(RolUsuario).default("CLIENT" /* CLIENT */),
    phone: z2.string().optional(),
    location: z2.string().optional(),
    avatarUrl: z2.string().url("Formato de URL de avatar inv\xE1lido").optional(),
    // Si el rol es Técnico, estos campos son opcionales durante el registro
    category: z2.string().optional(),
    specialties: z2.array(z2.string()).default([]),
    bio: z2.string().optional(),
    hourlyRate: z2.coerce.number().nonnegative("La tarifa horaria debe ser un valor no negativo").optional()
  })
});
var esquemaLogin = z2.object({
  body: z2.object({
    email: z2.string({ required_error: "El email es requerido" }).email("Formato de email inv\xE1lido"),
    password: z2.string({ required_error: "La contrase\xF1a es requerida" })
  })
});
var registerSchema = esquemaRegistro;
var loginSchema = esquemaLogin;

// src/shared/middlewares/AuthMiddleware.ts
var isAuthenticated = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(AppError.unauthorized("Token no proporcionado"));
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(AppError.unauthorized("Formato de token inv\xE1lido. Debe ser Bearer <token>"));
  }
  try {
    const decoded = TokenProvider.verifyToken(token);
    const userId = Number(decoded.sub);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(AppError.unauthorized("Usuario no encontrado"));
    }
    if (user.status === "BLOCKED") {
      return next(AppError.unauthorized("Tu cuenta ha sido suspendida. Por favor, ponte en contacto con soporte."));
    }
    req.user = {
      id: userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    next(AppError.unauthorized("Token inv\xE1lido o expirado"));
  }
};
var isAuthorized = (allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw AppError.unauthorized("Usuario no autenticado");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden("No tienes permiso para acceder a este recurso");
    }
    next();
  };
};

// src/modules/auth/routes/AuthRoutes.ts
var router = Router();
router.post("/register", validateRequest(registerSchema), authController.register);
router.post("/login", validateRequest(loginSchema), authController.login);
router.get("/me", isAuthenticated, authController.me);
var authRoutes = router;

// src/modules/technicians/routes/TechnicianRoutes.ts
import { Router as Router2 } from "express";

// src/modules/technicians/service/TechnicianService.ts
var TechnicianService = class {
  async list(filters) {
    const techUsers = await userRepository.listTechnicians(filters);
    return techUsers.map((u) => {
      const { passwordHash: _, ...userWithoutPassword } = u;
      if (userWithoutPassword.technicianProfile) {
        try {
          userWithoutPassword.technicianProfile.specialties = JSON.parse(
            userWithoutPassword.technicianProfile.specialties
          );
        } catch (_2) {
          userWithoutPassword.technicianProfile.specialties = [];
        }
      }
      return userWithoutPassword;
    });
  }
  async getProfile(userId) {
    const profile = await technicianRepository.findProfileByUserId(userId);
    if (!profile) {
      throw AppError.notFound("Perfil de t\xE9cnico no encontrado");
    }
    const profileData = profile;
    try {
      profileData.specialties = JSON.parse(profileData.specialties);
    } catch (_) {
      profileData.specialties = [];
    }
    return profileData;
  }
  async getProfileById(id) {
    const profile = await technicianRepository.findProfileById(id);
    if (!profile) {
      throw AppError.notFound("Perfil de t\xE9cnico no encontrado");
    }
    const profileData = profile;
    try {
      profileData.specialties = JSON.parse(profileData.specialties);
    } catch (_) {
      profileData.specialties = [];
    }
    return profileData;
  }
  async updateProfile(userId, data) {
    const profile = await technicianRepository.findProfileByUserId(userId);
    if (!profile) {
      throw AppError.notFound("Perfil de t\xE9cnico no encontrado");
    }
    if (data.name || data.phone || data.location) {
      await userRepository.update(userId, {
        name: data.name,
        phone: data.phone,
        location: data.location
      });
    }
    const techUpdateData = {};
    if (data.category !== void 0) techUpdateData.category = data.category;
    if (data.bio !== void 0) techUpdateData.bio = data.bio;
    if (data.hourlyRate !== void 0) techUpdateData.hourlyRate = data.hourlyRate;
    if (data.isAvailable !== void 0) techUpdateData.isAvailable = data.isAvailable;
    if (data.responseTime !== void 0) techUpdateData.responseTime = data.responseTime;
    if (data.specialties !== void 0) {
      techUpdateData.specialties = JSON.stringify(data.specialties);
    }
    if (Object.keys(techUpdateData).length > 0) {
      await technicianRepository.updateProfile(userId, techUpdateData);
    }
    return this.getProfile(userId);
  }
  async addPortfolioItem(userId, data) {
    const profile = await technicianRepository.findProfileByUserId(userId);
    if (!profile) {
      throw AppError.notFound("Perfil de t\xE9cnico no encontrado para agregar portafolio");
    }
    const item = await technicianRepository.addPortfolioItem({
      imageUrl: data.imageUrl,
      title: data.title,
      description: data.description,
      technician: { connect: { id: profile.id } }
    });
    return item;
  }
  async deletePortfolioItem(userId, id) {
    const profile = await technicianRepository.findProfileByUserId(userId);
    if (!profile) {
      throw AppError.notFound("Perfil de t\xE9cnico no encontrado");
    }
    await technicianRepository.deletePortfolioItem(id, profile.id);
  }
};
var technicianService = new TechnicianService();

// src/modules/technicians/controller/TechnicianController.ts
var TechnicianController = class {
  getCategories = async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" }
    });
    ApiResponse.success(res, "Categorias obtenidas con exito", categories);
  };
  list = async (req, res) => {
    const { category, isAvailable, isVerified, query } = req.query;
    const filters = {
      category,
      isAvailable: isAvailable === "true" ? true : isAvailable === "false" ? false : void 0,
      isVerified: isVerified === "true" ? true : isVerified === "false" ? false : void 0,
      query
    };
    const technicians = await technicianService.list(filters);
    ApiResponse.success(res, "T\xE9cnicos listados con \xE9xito", technicians);
  };
  getProfile = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const profile = await technicianService.getProfile(req.user.id);
    ApiResponse.success(res, "Perfil t\xE9cnico obtenido con \xE9xito", profile);
  };
  getProfileById = async (req, res) => {
    const { id } = req.params;
    const profile = await technicianService.getProfileById(id);
    ApiResponse.success(res, "Perfil t\xE9cnico por ID obtenido con \xE9xito", profile);
  };
  update = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const updated = await technicianService.updateProfile(req.user.id, req.body);
    ApiResponse.success(res, "Perfil t\xE9cnico actualizado con \xE9xito", updated);
  };
  addPortfolio = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const item = await technicianService.addPortfolioItem(req.user.id, req.body);
    ApiResponse.created(res, "Elemento agregado al portafolio con \xE9xito", item);
  };
  deletePortfolio = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const { id } = req.params;
    await technicianService.deletePortfolioItem(req.user.id, id);
    ApiResponse.success(res, "Elemento del portafolio eliminado con \xE9xito");
  };
};
var technicianController = new TechnicianController();

// src/modules/technicians/validators/TechnicianValidator.ts
import { z as z3 } from "zod";
var updateProfileSchema = z3.object({
  body: z3.object({
    category: z3.string().optional(),
    specialties: z3.array(z3.string()).optional(),
    bio: z3.string().optional(),
    hourlyRate: z3.number().nonnegative("La tarifa horaria debe ser no negativa").optional(),
    isAvailable: z3.boolean().optional(),
    responseTime: z3.string().optional(),
    name: z3.string().optional(),
    phone: z3.string().optional(),
    location: z3.string().optional()
  })
});
var addPortfolioItemSchema = z3.object({
  body: z3.object({
    imageUrl: z3.string({ required_error: "La URL de la imagen es requerida" }).url("Formato de URL inv\xE1lido"),
    title: z3.string({ required_error: "El t\xEDtulo del proyecto es requerido" }).min(3, "El t\xEDtulo debe tener al menos 3 caracteres"),
    description: z3.string().optional()
  })
});

// src/modules/technicians/routes/TechnicianRoutes.ts
var router2 = Router2();
router2.get("/categories", technicianController.getCategories);
router2.get("/", technicianController.list);
router2.get("/:id", technicianController.getProfileById);
router2.get(
  "/profile/me",
  isAuthenticated,
  isAuthorized(["TECHNICIAN" /* TECHNICIAN */]),
  technicianController.getProfile
);
router2.put(
  "/profile/me",
  isAuthenticated,
  isAuthorized(["TECHNICIAN" /* TECHNICIAN */]),
  validateRequest(updateProfileSchema),
  technicianController.update
);
router2.post(
  "/portfolio",
  isAuthenticated,
  isAuthorized(["TECHNICIAN" /* TECHNICIAN */]),
  validateRequest(addPortfolioItemSchema),
  technicianController.addPortfolio
);
router2.delete(
  "/portfolio/:id",
  isAuthenticated,
  isAuthorized(["TECHNICIAN" /* TECHNICIAN */]),
  technicianController.deletePortfolio
);
var technicianRoutes = router2;

// src/modules/service-requests/routes/ServiceRequestRoutes.ts
import { Router as Router3 } from "express";

// src/modules/service-requests/repository/ServiceRequestRepository.ts
var RepositorioSolicitudServicio = class {
  async crear(data) {
    return prisma.serviceRequest.create({
      data
    });
  }
  async encontrarPorId(id) {
    return prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true
          }
        },
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true
              }
            }
          }
        },
        review: true
      }
    });
  }
  async actualizar(id, data) {
    return prisma.serviceRequest.update({
      where: { id },
      data
    });
  }
  async listar(filtros) {
    const whereClause = {};
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
            avatarUrl: true
          }
        },
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true
              }
            }
          }
        },
        review: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};
var repositorioSolicitudServicio = new RepositorioSolicitudServicio();

// src/modules/service-requests/service/ServiceRequestService.ts
var ServicioSolicitudServicio = class {
  async crear(idCliente, datos) {
    const technicianId = datos.technicianId || datos.idTecnico;
    const tecnico = await repositorioTecnico.encontrarPerfilPorId(
      technicianId
    );
    if (!tecnico) {
      throw AppError.noEncontrado(
        "El perfil del t\xE9cnico especificado no existe"
      );
    }
    if (!tecnico.isAvailable) {
      throw AppError.solicitudIncorrecta(
        "El t\xE9cnico no se encuentra disponible actualmente"
      );
    }
    const scheduledDateVal = datos.scheduledDate || datos.fechaProgramada;
    const budgetVal = datos.budget !== void 0 ? datos.budget : datos.presupuesto;
    const solicitud = await repositorioSolicitudServicio.crear({
      client: { connect: { id: idCliente } },
      technician: { connect: { id: tecnico.id } },
      category: datos.category || datos.categoria,
      title: datos.title || datos.titulo,
      description: datos.description || datos.descripcion,
      address: datos.address || datos.direccion,
      scheduledDate: scheduledDateVal ? new Date(scheduledDateVal) : null,
      budget: budgetVal !== void 0 ? budgetVal : null,
      status: "PENDING" /* PENDING */
    });
    return solicitud;
  }
  async obtenerPorId(id, idUsuario) {
    const solicitud = await repositorioSolicitudServicio.encontrarPorId(id);
    if (!solicitud) {
      throw AppError.noEncontrado("Solicitud de servicio no encontrada");
    }
    const esCliente = solicitud.clientId === idUsuario;
    const esTecnico = solicitud.technician.userId === idUsuario;
    if (!esCliente && !esTecnico) {
      throw AppError.prohibido(
        "No tienes permiso para visualizar esta solicitud"
      );
    }
    return solicitud;
  }
  async listar(idUsuario, rol, estado) {
    let filtros = { estado };
    if (rol === "CLIENT" /* CLIENT */) {
      filtros.idCliente = idUsuario;
    } else if (rol === "TECHNICIAN" /* TECHNICIAN */) {
      const perfil = await repositorioTecnico.encontrarPerfilPorIdUsuario(idUsuario);
      if (!perfil) {
        throw AppError.noEncontrado("Perfil de t\xE9cnico no encontrado");
      }
      filtros.idTecnico = perfil.id;
    }
    return repositorioSolicitudServicio.listar(filtros);
  }
  async actualizarEstado(idSolicitud, idUsuario, nuevoEstado, tarifaAcordada) {
    const solicitud = await repositorioSolicitudServicio.encontrarPorId(idSolicitud);
    if (!solicitud) {
      throw AppError.noEncontrado("Solicitud de servicio no encontrada");
    }
    const esCliente = solicitud.clientId === idUsuario;
    const esTecnico = solicitud.technician.userId === idUsuario;
    if (!esCliente && !esTecnico) {
      throw AppError.prohibido(
        "No tienes permisos para modificar esta solicitud"
      );
    }
    const estadoActual = solicitud.status;
    if (nuevoEstado === estadoActual) {
      return solicitud;
    }
    const datosActualizacion = { status: nuevoEstado };
    switch (estadoActual) {
      case "PENDING" /* PENDING */:
        if (nuevoEstado === "ACCEPTED" /* ACCEPTED */) {
          if (!esTecnico) {
            throw AppError.prohibido(
              "Solo el t\xE9cnico puede aceptar una solicitud pendiente"
            );
          }
          datosActualizacion.agreedRate = tarifaAcordada || solicitud.budget || solicitud.technician.hourlyRate;
        } else if (nuevoEstado === "CANCELLED" /* CANCELLED */) {
        } else {
          throw AppError.solicitudIncorrecta(
            `Transici\xF3n de estado inv\xE1lida: de ${estadoActual} a ${nuevoEstado}`
          );
        }
        break;
      case "ACCEPTED" /* ACCEPTED */:
        if (nuevoEstado === "IN_PROGRESS" /* IN_PROGRESS */) {
          if (!esTecnico) {
            throw AppError.prohibido(
              "Solo el t\xE9cnico puede iniciar el trabajo de la solicitud"
            );
          }
        } else if (nuevoEstado === "CANCELLED" /* CANCELLED */) {
        } else {
          throw AppError.solicitudIncorrecta(
            `Transici\xF3n de estado inv\xE1lida: de ${estadoActual} a ${nuevoEstado}`
          );
        }
        break;
      case "IN_PROGRESS" /* IN_PROGRESS */:
        if (nuevoEstado === "COMPLETED" /* COMPLETED */) {
          if (!esTecnico) {
            throw AppError.prohibido(
              "Solo el t\xE9cnico puede marcar la solicitud como completada"
            );
          }
          datosActualizacion.completedDate = /* @__PURE__ */ new Date();
          await repositorioTecnico.actualizarPerfil(
            solicitud.technician.userId,
            {
              jobsCompleted: {
                increment: 1
              }
            }
          );
        } else if (nuevoEstado === "CANCELLED" /* CANCELLED */) {
          if (!esTecnico && !esCliente) {
            throw AppError.prohibido("No autorizado");
          }
        } else {
          throw AppError.solicitudIncorrecta(
            `Transici\xF3n de estado inv\xE1lida: de ${estadoActual} a ${nuevoEstado}`
          );
        }
        break;
      case "COMPLETED" /* COMPLETED */:
      case "CANCELLED" /* CANCELLED */:
        throw AppError.solicitudIncorrecta(
          `No se puede modificar una solicitud en estado finalizado o cancelado`
        );
    }
    const solicitudActualizada = await repositorioSolicitudServicio.actualizar(
      idSolicitud,
      datosActualizacion
    );
    return solicitudActualizada;
  }
  // English aliases
  async create(clientId, data) {
    return this.crear(clientId, data);
  }
  async getById(id, userId) {
    return this.obtenerPorId(Number(id), userId);
  }
  async list(userId, role, status) {
    return this.listar(userId, role, status);
  }
  async updateStatus(id, userId, status, agreedRate) {
    return this.actualizarEstado(Number(id), userId, status, agreedRate);
  }
};
var servicioSolicitudServicio = new ServicioSolicitudServicio();
var serviceRequestService = servicioSolicitudServicio;

// src/modules/service-requests/controller/ServiceRequestController.ts
var ServiceRequestController = class {
  create = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const request = await serviceRequestService.create(req.user.id, req.body);
    ApiResponse.created(res, "Solicitud de servicio creada con \xE9xito", request);
  };
  getById = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const { id } = req.params;
    const request = await serviceRequestService.getById(id, req.user.id);
    ApiResponse.success(res, "Solicitud de servicio obtenida con \xE9xito", request);
  };
  list = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const { status } = req.query;
    const requestStatus = status ? status : void 0;
    const requests = await serviceRequestService.list(req.user.id, req.user.role, requestStatus);
    ApiResponse.success(res, "Solicitudes de servicio listadas con \xE9xito", requests);
  };
  updateStatus = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const { id } = req.params;
    const { status, agreedRate } = req.body;
    const request = await serviceRequestService.updateStatus(id, req.user.id, status, agreedRate);
    ApiResponse.success(res, `Estado de solicitud actualizado a '${status}' con \xE9xito`, request);
  };
};
var serviceRequestController = new ServiceRequestController();

// src/modules/service-requests/validators/ServiceRequestValidator.ts
import { z as z4 } from "zod";
var createRequestSchema = z4.object({
  body: z4.object({
    technicianId: z4.number({
      required_error: "El ID del t\xE9cnico es requerido"
    }),
    category: z4.string({ required_error: "La categor\xEDa es requerida" }),
    title: z4.string({ required_error: "El t\xEDtulo es requerido" }).min(5, "El t\xEDtulo debe tener al menos 5 caracteres"),
    description: z4.string({ required_error: "La descripci\xF3n es requerida" }).min(10, "La descripci\xF3n debe tener al menos 10 caracteres"),
    address: z4.string({ required_error: "La direcci\xF3n es requerida" }),
    scheduledDate: z4.string().datetime("Formato de fecha programada inv\xE1lido (ISO Date)").optional(),
    budget: z4.number().nonnegative("El presupuesto debe ser un n\xFAmero no negativo").optional()
  })
});
var updateStatusSchema = z4.object({
  body: z4.object({
    status: z4.nativeEnum(EstadoSolicitud, {
      required_error: "El estado es requerido"
    }),
    agreedRate: z4.number().nonnegative("La tarifa acordada debe ser un n\xFAmero no negativo").optional()
  })
});

// src/modules/service-requests/routes/ServiceRequestRoutes.ts
var router3 = Router3();
router3.use(isAuthenticated);
router3.post(
  "/",
  isAuthorized(["CLIENT" /* CLIENT */]),
  validateRequest(createRequestSchema),
  serviceRequestController.create
);
router3.get("/", serviceRequestController.list);
router3.get("/:id", serviceRequestController.getById);
router3.patch(
  "/:id/status",
  validateRequest(updateStatusSchema),
  serviceRequestController.updateStatus
);
var serviceRequestRoutes = router3;

// src/modules/reviews/routes/ReviewRoutes.ts
import { Router as Router4 } from "express";

// src/modules/reviews/repository/ReviewRepository.ts
var RepositorioResena = class {
  async crear(data) {
    return prisma.review.create({
      data
    });
  }
  async encontrarPorId(id) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        request: true
      }
    });
  }
  async encontrarPorIdSolicitud(requestId) {
    return prisma.review.findUnique({
      where: { requestId }
    });
  }
  async listarPorIdTecnico(technicianId) {
    return prisma.review.findMany({
      where: { technicianId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};
var repositorioResena = new RepositorioResena();

// src/modules/reviews/service/ReviewService.ts
var ServicioResena = class {
  async crear(idCliente, datos) {
    const solicitud = await repositorioSolicitudServicio.encontrarPorId(
      datos.requestId
    );
    if (!solicitud) {
      throw AppError.noEncontrado("Solicitud de servicio no encontrada");
    }
    if (solicitud.clientId !== idCliente) {
      throw AppError.prohibido(
        "Solo el cliente que solicit\xF3 el servicio puede dejar una rese\xF1a"
      );
    }
    if (solicitud.status !== "COMPLETED" /* COMPLETED */) {
      throw AppError.solicitudIncorrecta(
        "Solo se pueden rese\xF1ar servicios que hayan sido marcados como COMPLETADOS"
      );
    }
    const resenaExistente = await repositorioResena.encontrarPorIdSolicitud(
      datos.requestId
    );
    if (resenaExistente) {
      throw AppError.conflicto("Ya has calificado este servicio anteriormente");
    }
    return prisma.$transaction(async (transaccion) => {
      const resena = await transaccion.review.create({
        data: {
          rating: datos.rating,
          comment: datos.comment,
          request: { connect: { id: datos.requestId } },
          client: { connect: { id: idCliente } },
          technician: { connect: { id: solicitud.technicianId } }
        }
      });
      const perfilTecnico = await transaccion.technicianProfile.findUnique({
        where: { id: solicitud.technicianId }
      });
      if (perfilTecnico) {
        const cuentaActual = perfilTecnico.reviewCount;
        const calificacionActual = perfilTecnico.rating;
        const nuevaCuenta = cuentaActual + 1;
        const nuevaCalificacion = (calificacionActual * cuentaActual + datos.rating) / nuevaCuenta;
        const calificacionRedondeada = Math.round(nuevaCalificacion * 100) / 100;
        await transaccion.technicianProfile.update({
          where: { id: solicitud.technicianId },
          data: {
            rating: calificacionRedondeada,
            reviewCount: nuevaCuenta
          }
        });
      }
      return resena;
    });
  }
  async listarPorIdTecnico(idTecnico) {
    const tecnico = await repositorioTecnico.encontrarPerfilPorId(idTecnico);
    if (!tecnico) {
      throw AppError.noEncontrado("Perfil de t\xE9cnico no encontrado");
    }
    return repositorioResena.listarPorIdTecnico(idTecnico);
  }
  // English aliases
  async create(clientId, data) {
    return this.crear(clientId, data);
  }
  async listByTechnicianId(technicianId) {
    return this.listarPorIdTecnico(Number(technicianId));
  }
};
var servicioResena = new ServicioResena();
var reviewService = servicioResena;

// src/modules/reviews/controller/ReviewController.ts
var ReviewController = class {
  create = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const review = await reviewService.create(req.user.id, req.body);
    ApiResponse.created(res, "Rese\xF1a publicada con \xE9xito", review);
  };
  listByTechnicianId = async (req, res) => {
    const { technicianId } = req.params;
    const reviews = await reviewService.listByTechnicianId(technicianId);
    ApiResponse.success(res, "Rese\xF1as obtenidas con \xE9xito", reviews);
  };
};
var reviewController = new ReviewController();

// src/modules/reviews/validators/ReviewValidator.ts
import { z as z5 } from "zod";
var createReviewSchema = z5.object({
  body: z5.object({
    requestId: z5.coerce.number({ required_error: "El ID de solicitud es requerido" }),
    rating: z5.number({ required_error: "La calificaci\xF3n es requerida" }).int().min(1, "La calificaci\xF3n m\xEDnima es 1 estrella").max(5, "La calificaci\xF3n m\xE1xima es 5 estrellas"),
    comment: z5.string({ required_error: "El comentario es requerido" }).min(5, "El comentario debe tener al menos 5 caracteres")
  })
});

// src/modules/reviews/routes/ReviewRoutes.ts
var router4 = Router4();
router4.post(
  "/",
  isAuthenticated,
  isAuthorized(["CLIENT" /* CLIENT */]),
  validateRequest(createReviewSchema),
  reviewController.create
);
router4.get("/technician/:technicianId", reviewController.listByTechnicianId);
var reviewRoutes = router4;

// src/modules/conversations/routes/ConversationRoutes.ts
import { Router as Router5 } from "express";

// src/modules/conversations/repository/ConversationRepository.ts
var ConversationRepository = class {
  async findOrCreate(user1Id, user2Id) {
    const u1 = Number(user1Id);
    const u2 = Number(user2Id);
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: u1 } } },
          { participants: { some: { userId: u2 } } }
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            }
          }
        }
      }
    });
    if (existing) {
      return existing;
    }
    return prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: u1 }, { userId: u2 }]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            }
          }
        }
      }
    });
  }
  async findById(id) {
    const numericId = Number(id);
    return prisma.conversation.findUnique({
      where: { id: numericId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            timestamp: "asc"
          }
        }
      }
    });
  }
  async listUserConversations(userId) {
    const uId = Number(userId);
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: uId }
        }
      },
      include: {
        participants: {
          where: {
            userId: { not: uId }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            timestamp: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }
  async saveMessage(conversationId, senderId, content) {
    const cId = Number(conversationId);
    const sId = Number(senderId);
    return prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversation: { connect: { id: cId } },
          sender: { connect: { id: sId } },
          content
        }
      });
      await tx.conversation.update({
        where: { id: cId },
        data: { updatedAt: /* @__PURE__ */ new Date() }
      });
      return message;
    });
  }
  async markAsRead(conversationId, userId) {
    const cId = Number(conversationId);
    const uId = Number(userId);
    await prisma.chatMessage.updateMany({
      where: {
        conversationId: cId,
        senderId: { not: uId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }
};
var conversationRepository = new ConversationRepository();

// src/modules/conversations/service/ConversationService.ts
var ConversationService = class {
  async findOrCreate(user1Id, user2Id) {
    if (user1Id === user2Id) {
      throw AppError.badRequest("No puedes iniciar una conversaci\xF3n contigo mismo");
    }
    const recipient = await userRepository.findById(user2Id);
    if (!recipient) {
      throw AppError.notFound("El usuario destinatario no existe");
    }
    return conversationRepository.findOrCreate(user1Id, user2Id);
  }
  async getById(conversationId, userId) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound("Conversaci\xF3n no encontrada");
    }
    const isParticipant = conversation.participants.some((p) => p.userId === Number(userId));
    if (!isParticipant) {
      throw AppError.forbidden("No tienes permiso para ver esta conversaci\xF3n");
    }
    return conversation;
  }
  async list(userId) {
    return conversationRepository.listUserConversations(userId);
  }
  async sendMessage(conversationId, senderId, content) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound("Conversaci\xF3n no encontrada");
    }
    const isParticipant = conversation.participants.some((p) => p.userId === Number(senderId));
    if (!isParticipant) {
      throw AppError.forbidden("No eres participante de esta conversaci\xF3n");
    }
    return conversationRepository.saveMessage(conversationId, senderId, content);
  }
  async markAsRead(conversationId, userId) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw AppError.notFound("Conversaci\xF3n no encontrada");
    }
    const isParticipant = conversation.participants.some((p) => p.userId === Number(userId));
    if (!isParticipant) {
      throw AppError.forbidden("No eres participante de esta conversaci\xF3n");
    }
    await conversationRepository.markAsRead(conversationId, userId);
  }
};
var conversationService = new ConversationService();

// src/modules/conversations/controller/ConversationController.ts
var ConversationController = class {
  findOrCreate = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const { recipientId } = req.body;
    if (!recipientId) {
      throw AppError.badRequest("El ID del destinatario es obligatorio");
    }
    const conversation = await conversationService.findOrCreate(req.user.id, recipientId);
    ApiResponse.success(res, "Conversaci\xF3n obtenida/creada con \xE9xito", conversation);
  };
  list = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const conversations = await conversationService.list(req.user.id);
    ApiResponse.success(res, "Conversaciones listadas con \xE9xito", conversations);
  };
  getById = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const { id } = req.params;
    const conversation = await conversationService.getById(id, req.user.id);
    ApiResponse.success(res, "Conversaci\xF3n obtenida con \xE9xito", conversation);
  };
  markAsRead = async (req, res) => {
    if (!req.user) {
      throw AppError.unauthorized("No autenticado");
    }
    const { id } = req.params;
    await conversationService.markAsRead(id, req.user.id);
    ApiResponse.success(res, "Mensajes marcados como le\xEDdos con \xE9xito");
  };
};
var conversationController = new ConversationController();

// src/modules/conversations/routes/ConversationRoutes.ts
var router5 = Router5();
router5.use(isAuthenticated);
router5.post("/", conversationController.findOrCreate);
router5.get("/", conversationController.list);
router5.get("/:id", conversationController.getById);
router5.patch("/:id/read", conversationController.markAsRead);
var conversationRoutes = router5;

// src/modules/admin/routes/AdminRoutes.ts
import { Router as Router6 } from "express";

// src/modules/admin/controller/AdminController.ts
var AdminController = class {
  createCategory = async (req, res) => {
    const { key, label } = req.body;
    if (!key || !label) {
      throw AppError.badRequest("La clave (key) y la etiqueta (label) son campos obligatorios");
    }
    const normalizedKey = String(key).trim().toLowerCase();
    const existingCategory = await prisma.category.findUnique({
      where: { key: normalizedKey }
    });
    if (existingCategory) {
      throw AppError.conflict("Ya existe una categor\xEDa con esta clave (key)");
    }
    const category = await prisma.category.create({
      data: {
        key: normalizedKey,
        label: String(label).trim()
      }
    });
    ApiResponse.created(res, "Categor\xEDa creada con \xE9xito", category);
  };
  deleteCategory = async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw AppError.badRequest("El ID de categor\xEDa proporcionado no es v\xE1lido");
    }
    const category = await prisma.category.findUnique({
      where: { id }
    });
    if (!category) {
      throw AppError.notFound("La categor\xEDa solicitada no existe");
    }
    await prisma.category.delete({
      where: { id }
    });
    ApiResponse.success(res, "Categor\xEDa eliminada con \xE9xito");
  };
  toggleUserBlock = async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (isNaN(id)) {
      throw AppError.badRequest("El ID de usuario proporcionado no es v\xE1lido");
    }
    if (!status || status !== "ACTIVE" && status !== "BLOCKED") {
      throw AppError.badRequest("El estado (status) proporcionado no es v\xE1lido. Debe ser ACTIVE o BLOCKED");
    }
    const user = await prisma.user.findUnique({
      where: { id }
    });
    if (!user) {
      throw AppError.notFound("El usuario solicitado no existe");
    }
    if (user.role === "ADMIN") {
      throw AppError.forbidden("No es posible bloquear o suspender a otro administrador del sistema");
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });
    ApiResponse.success(res, "Estado del usuario actualizado con \xE9xito", updatedUser);
  };
  listUsers = async (_req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { id: "asc" }
    });
    ApiResponse.success(res, "Usuarios listados con \xE9xito", users);
  };
};
var adminController = new AdminController();

// src/modules/admin/routes/AdminRoutes.ts
var router6 = Router6();
router6.use(isAuthenticated, isAuthorized(["ADMIN" /* ADMIN */]));
router6.post("/categories", adminController.createCategory);
router6.delete("/categories/:id", adminController.deleteCategory);
router6.get("/users", adminController.listUsers);
router6.patch("/users/:id/block", adminController.toggleUserBlock);
var adminRoutes = router6;

// src/routes/index.ts
var router7 = Router7();
router7.get("/health", (_req, res) => {
  res.json({
    status: "up",
    timestamp: /* @__PURE__ */ new Date(),
    service: "PlatJob Backend API"
  });
});
router7.use("/auth", authRoutes);
router7.use("/technicians", technicianRoutes);
router7.use("/service-requests", serviceRequestRoutes);
router7.use("/reviews", reviewRoutes);
router7.use("/conversations", conversationRoutes);
router7.use("/admin", adminRoutes);
var appRouter = router7;

// src/shared/errors/errorHandler.ts
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
var errorHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors = [];
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    console.warn(`\u26A0\uFE0F Operational Error [${statusCode}]: ${message}`);
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message
    }));
    console.warn(`\u26A0\uFE0F Validation Error: ${errors.length} issues found`);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 409;
        message = `El registro ya existe. Campo duplicado: ${err.meta?.target?.join(", ") || "clave \xFAnica"}`;
        break;
      case "P2025":
        statusCode = 404;
        message = err.meta?.cause || "El recurso solicitado no existe";
        break;
      default:
        statusCode = 400;
        message = `Database Error: ${err.message}`;
    }
    console.warn(`\u26A0\uFE0F Database Operational Error [${statusCode}]: ${message}`);
  } else {
    try {
      console.error("\u{1F4A5} Unexpected System Error:", err);
    } catch (logError) {
      console.error("\u{1F4A5} Unexpected System Error (failed to inspect):", Object.prototype.toString.call(err));
      console.error("Error message:", err?.message);
    }
  }
  res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : void 0,
    stack: process.env.NODE_ENV === "development" ? err.stack : void 0
  });
};

// src/app.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var App = class {
  app;
  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }
  configureMiddlewares() {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN,
        credentials: true
      })
    );
    this.app.use(express.json());
    if (env.NODE_ENV === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      // 15 minutos
      max: 100,
      // Límite de 100 peticiones por ventana por IP
      message: {
        success: false,
        message: "Demasiadas solicitudes desde esta IP, por favor intenta de nuevo m\xE1s tarde."
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use("/api", limiter);
  }
  configureRoutes() {
    try {
      const swaggerPath = join(__dirname, "config", "swagger.json");
      const swaggerDocument = JSON.parse(readFileSync(swaggerPath, "utf8"));
      this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      console.log("\u{1F4D6} Swagger interactive API docs mounted at /api-docs");
    } catch (err) {
      console.warn("\u26A0\uFE0F Swagger JSON could not be loaded. OpenAPI docs unavailable.", err);
    }
    this.app.use("/api", appRouter);
    this.app.use("*", (_req, res) => {
      res.status(404).json({
        success: false,
        message: "Recurso no encontrado. Accede a /api-docs para ver las rutas disponibles."
      });
    });
  }
  configureErrorHandling() {
    this.app.use(errorHandler);
  }
};
var app_default = new App().app;

// src/shared/infra/socket/SocketGateway.ts
import { Server as SocketServer } from "socket.io";
var SocketGateway = class {
  io;
  // Mapa para trackear usuarios conectados: userId -> socketId
  onlineUsers = /* @__PURE__ */ new Map();
  constructor(server) {
    this.io = new SocketServer(server, {
      cors: {
        origin: "*",
        // Se puede configurar con variables de entorno
        methods: ["GET", "POST"]
      }
    });
    this.initializeMiddlewares();
    this.initializeEvents();
  }
  initializeMiddlewares() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }
      const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      try {
        const decoded = TokenProvider.verifyToken(cleanToken);
        socket.data.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role
        };
        next();
      } catch (err) {
        return next(new Error("Authentication error: Invalid or expired token"));
      }
    });
  }
  initializeEvents() {
    this.io.on("connection", (socket) => {
      const user = socket.data.user;
      this.onlineUsers.set(user.id, socket.id);
      console.log(`\u{1F50C} Socket connected: User ${user.name || user.id} (${user.role}) - Socket: ${socket.id}`);
      socket.broadcast.emit("user_online", { userId: user.id });
      socket.on("join_room", (data) => {
        socket.join(data.conversationId);
        console.log(`\u{1F4AC} User ${user.id} joined room: ${data.conversationId}`);
      });
      socket.on("send_message", async (data) => {
        try {
          const message = await conversationService.sendMessage(
            data.conversationId,
            user.id,
            data.content
          );
          this.io.to(data.conversationId).emit("message_received", message);
          console.log(`\u{1F4E9} Message from ${user.id} to room ${data.conversationId}`);
        } catch (err) {
          socket.emit("error", { message: err.message || "Error al enviar mensaje" });
        }
      });
      socket.on("typing", (data) => {
        socket.to(data.conversationId).emit("user_typing", {
          userId: user.id,
          isTyping: data.isTyping
        });
      });
      socket.on("read_receipt", async (data) => {
        try {
          await conversationService.markAsRead(data.conversationId, user.id);
          socket.to(data.conversationId).emit("messages_read", {
            conversationId: data.conversationId,
            readBy: user.id
          });
        } catch (err) {
          socket.emit("error", { message: err.message || "Error al marcar lectura" });
        }
      });
      socket.on("disconnect", () => {
        this.onlineUsers.delete(user.id);
        socket.broadcast.emit("user_offline", { userId: user.id });
        console.log(`\u{1F50C} Socket disconnected: User ${user.id}`);
      });
    });
  }
  getIO() {
    return this.io;
  }
};

// src/server.ts
var httpServer = createServer(app_default);
var socketGateway = new SocketGateway(httpServer);
var startServer = async () => {
  try {
    await prisma.$connect();
    console.log("\u{1F4E6} Database connection verified successfully.");
    httpServer.listen(env.PORT, () => {
      console.log(`\u{1F680} ==========================================`);
      console.log(`\u{1F680} PlatJob Enterprise Backend is now running!`);
      console.log(`\u{1F680} Environment: ${env.NODE_ENV}`);
      console.log(`\u{1F680} Server listening on: http://localhost:${env.PORT}`);
      console.log(`\u{1F680} WebSocket Gateway is online & listening`);
      console.log(`\u{1F680} ==========================================`);
    });
  } catch (err) {
    console.error("\u274C Failed to launch the PlatJob Backend Server:", err);
    process.exit(1);
  }
};
var gracefulShutdown = async () => {
  console.log("Shutting down server gracefully...");
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log("HTTP Server closed.");
    process.exit(0);
  });
};
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
startServer();
export {
  httpServer,
  socketGateway
};
