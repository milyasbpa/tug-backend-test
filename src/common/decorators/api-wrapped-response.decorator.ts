import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Documents the TransformInterceptor envelope around a single-object response.
 * Use this in place of @ApiOkResponse / @ApiCreatedResponse whenever the endpoint
 * returns a single object (not a paginated list).
 *
 * Resulting shape:
 * {
 *   "success": true,
 *   "data": { ...SomeDto fields... },
 *   "timestamp": "2026-01-01T00:00:00.000Z"
 * }
 *
 * @param dto    The DTO class describing the `data` field.
 * @param status HTTP status code (defaults to 200).
 */
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
