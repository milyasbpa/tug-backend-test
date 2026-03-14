import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const PackageResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  durationMinutes: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export class PackageResponseDto extends createZodDto(PackageResponseSchema) {}
