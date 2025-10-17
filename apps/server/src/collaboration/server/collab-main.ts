import { NestFactory, Reflector } from '@nestjs/core';
import { CollabAppModule } from './collab-app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TransformHttpResponseInterceptor } from '../../common/interceptors/http-response.interceptor';
import { InternalLogFilter } from '../../common/logger/internal-log-filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    CollabAppModule,
    new FastifyAdapter({
      ignoreTrailingSlash: true,
      ignoreDuplicateSlashes: true,
      maxParamLength: 500,
    }),
    {
      logger: new InternalLogFilter(),
    },
  );

  app.setGlobalPrefix('api', { exclude: ['/'] });

  // CORS：允许桌面 Tauri 源并携带 Cookie
  const defaultOrigins = new Set([
    'tauri://localhost',
    'http://localhost:5173',
  ]);
  const extraOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  extraOrigins.forEach((o) => defaultOrigins.add(o));

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (defaultOrigins.has(origin)) return cb(null, true);
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      if (/^http:\/\/\d{1,3}(\.\d{1,3}){3}(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformHttpResponseInterceptor(reflector));
  app.enableShutdownHooks();

  const logger = new Logger('CollabServer');

  const port = process.env.COLLAB_PORT || 3001;
  await app.listen(port, '0.0.0.0', () => {
    logger.log(`Listening on http://127.0.0.1:${port}`);
  });
}

bootstrap();
