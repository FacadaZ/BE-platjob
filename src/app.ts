import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { appRouter } from './routes/index.js';
import { errorHandler } from '@shared/errors/errorHandler.js';
import { env } from '@config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class App {
  public app: Express;

  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddlewares(): void {
    // 1. Cabeceras de Seguridad Robustas
    this.app.use(helmet());

    // 2. Control de Acceso Orígenes Cruzados
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
      })
    );

    // 3. Serializador de Datos JSON
    this.app.use(express.json());

    // 4. Registro de peticiones HTTP en consola
    if (env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // 5. Limitación de peticiones (Protección de fuerza bruta / DOS)
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: env.NODE_ENV === 'development' ? 1000 : 100, // 1000 en desarrollo, 100 en producción
      message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);
  }

  private configureRoutes(): void {
    // Documentación Interactiva Swagger / OpenAPI
    try {
      const swaggerPath = join(__dirname, 'config', 'swagger.json');
      const swaggerDocument = JSON.parse(readFileSync(swaggerPath, 'utf8'));
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      console.log('📖 Swagger interactive API docs mounted at /api-docs');
    } catch (err) {
      console.warn('⚠️ Swagger JSON could not be loaded. OpenAPI docs unavailable.', err);
    }

    // Rutas principales del backend
    this.app.use('/api', appRouter);

    // Ruta de comodín para recursos no encontrados
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        success: false,
        message: 'Recurso no encontrado. Accede a /api-docs para ver las rutas disponibles.',
      });
    });
  }

  private configureErrorHandling(): void {
    // Middleware global de manejo de excepciones
    this.app.use(errorHandler);
  }
}

export default new App().app;
