import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import { StructuredLogger } from './platform/logging/structured-logger.service';
import { ResponseEnvelopeInterceptor } from './platform/interceptors/response-envelope.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(StructuredLogger));
  app.setGlobalPrefix('api', {
    exclude: [
      // Human-friendly URLs on the API host (e.g. bookmarks / mistaken port) → frontend or auth flow
      { path: 'login', method: RequestMethod.GET },
      { path: 'register', method: RequestMethod.GET },
      { path: 'reset-password', method: RequestMethod.GET },
      { path: 'verify-email', method: RequestMethod.GET },
    ],
  });

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      // Allow inline styles/scripts for the HTML email-action pages
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
      : true, // In dev allow all; set CORS_ORIGINS in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── Global pipes & filters ────────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // ── Swagger ───────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Employee Management System API')
    .setDescription(
      'JWT Authentication REST API — register, login, email verification, password reset, role-based access control.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  const logger = app.get(StructuredLogger);
  logger.log(`Application listening on http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`Swagger docs on http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
