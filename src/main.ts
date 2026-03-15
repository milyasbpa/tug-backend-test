import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

const isProduction = process.env['NODE_ENV'] === 'production';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.useLogger(
    WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: isProduction
            ? winston.format.json()
            : winston.format.combine(
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.colorize(),
                winston.format.printf(
                  ({ timestamp, level, message, context }: Record<string, unknown>) =>
                    `${String(timestamp)} [${typeof context === 'string' ? context : 'App'}] ${String(level)}: ${String(message)}`,
                ),
              ),
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '30d',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    }),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(new ZodValidationPipe());

  if (process.env['NODE_ENV'] !== 'production') {
    const port = process.env['PORT'] ?? '4000';
    const config = new DocumentBuilder()
      .setTitle(process.env['APP_NAME'] ?? 'NestJS API')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .addServer('https://api.staging.example.com', 'Staging')
      .build();

    const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  await app.listen(process.env['PORT'] ?? 4000);
}
void bootstrap();
