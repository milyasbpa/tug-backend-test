import { createZodDto } from 'nestjs-zod';

import { CreatePackageSchema } from './create-package.dto';

export const UpdatePackageSchema = CreatePackageSchema.partial();

export class UpdatePackageDto extends createZodDto(UpdatePackageSchema) {}
