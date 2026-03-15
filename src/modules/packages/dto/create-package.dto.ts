import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreatePackageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1),
  /** Price in USD (e.g. 75.00) */
  price: z.number().positive().describe('Price in USD'),
  durationMinutes: z.number().int().positive(),
});

export class CreatePackageDto extends createZodDto(CreatePackageSchema) {}
