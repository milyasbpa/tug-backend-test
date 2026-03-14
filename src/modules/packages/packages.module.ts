// TODO: Step 6 — register in AppModule
import { Module } from '@nestjs/common';

import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';

@Module({
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
