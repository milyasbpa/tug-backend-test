// TODO: Step 5 — implement admin + mobile endpoints
import { Controller } from '@nestjs/common';

import { PackagesService } from './packages.service';

@Controller()
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}
}
