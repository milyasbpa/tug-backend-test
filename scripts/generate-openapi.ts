/**
 * Generate openapi.json from the running NestJS app definition.
 *
 * Usage:
 *   npm run generate:openapi
 *
 * Output: openapi.json at project root (gitignored).
 * Import into Postman, Insomnia, or use for client code-gen (openapi-generator, etc.)
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from '../src/app.module';

async function generate(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const config = new DocumentBuilder()
    .setTitle(process.env['APP_NAME'] ?? 'NestJS API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:4000', 'Local')
    .addServer('https://api.staging.example.com', 'Staging')
    .build();

  const rawDocument = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  // nestjs-zod v5 emits `exclusiveMinimum: <number>` (OpenAPI 3.1 syntax) inside
  // a spec that declares `openapi: "3.0.0"`. Orval and other 3.0 tooling expect
  // `exclusiveMinimum: true` paired with `minimum: <number>` (3.0 syntax).
  // Patch via regex on the serialized JSON — no type casting needed.
  const patchedJson = JSON.stringify(rawDocument, null, 2).replace(
    /"exclusiveMinimum": (\d+(\.\d+)?)/g,
    '"minimum": $1,\n            "exclusiveMinimum": true',
  );

  const outPath = join(process.cwd(), 'openapi.json');
  writeFileSync(outPath, patchedJson);

  await app.close();

  console.log(`✔  openapi.json written to ${outPath}`);
}

void generate();
