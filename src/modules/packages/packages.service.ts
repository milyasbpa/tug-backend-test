import { Injectable, NotFoundException } from '@nestjs/common';
import { WellnessPackage } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<WellnessPackage[]> {
    return this.prisma.wellnessPackage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<WellnessPackage> {
    const pkg = await this.prisma.wellnessPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Wellness package not found');
    return pkg;
  }

  create(dto: CreatePackageDto): Promise<WellnessPackage> {
    return this.prisma.wellnessPackage.create({ data: dto });
  }

  async update(id: string, dto: UpdatePackageDto): Promise<WellnessPackage> {
    await this.findOne(id);
    return this.prisma.wellnessPackage.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<WellnessPackage> {
    await this.findOne(id);
    return this.prisma.wellnessPackage.delete({ where: { id } });
  }
}
