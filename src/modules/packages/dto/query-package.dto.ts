import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PaginationSchema } from '../../../common/dto/pagination.dto';

export const QueryPackageSchema = PaginationSchema.extend({
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'price', 'durationMinutes', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export class QueryPackageDto extends createZodDto(QueryPackageSchema) {}
