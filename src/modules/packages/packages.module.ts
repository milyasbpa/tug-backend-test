// TODO: Step 6 — import PackagesModule in AppModule
import { Module } from '@nestjs/common';

import { AdminPackagesController, MobilePackagesController } from './packages.controller';
import { PackagesService } from './packages.service';

@Module({
  controllers: [AdminPackagesController, MobilePackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
