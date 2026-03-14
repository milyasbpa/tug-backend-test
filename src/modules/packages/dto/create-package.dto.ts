import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreatePackageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1),
  price: z.number().positive(),
  durationMinutes: z.number().int().positive(),
});

export class CreatePackageDto extends createZodDto(CreatePackageSchema) {}
