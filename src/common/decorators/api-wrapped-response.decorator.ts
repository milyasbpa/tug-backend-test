import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiWrappedResponse = <T>(
  dto: Type<T>,
  status: HttpStatus = HttpStatus.OK,
): MethodDecorator =>
  applyDecorators(
    ApiExtraModels(dto),
    ApiResponse({
      status,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              timestamp: { type: 'string', example: '2026-01-01T00:00:00.000Z' },
              data: { $ref: getSchemaPath(dto) },
            },
          },
        ],
      },
    }),
  );
