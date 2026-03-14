import { Injectable, NotFoundException } from '@nestjs/common';
import { WellnessPackage } from '@prisma/client';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { PrismaService } from '../../database/prisma.service';

import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<WellnessPackage>> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.wellnessPackage.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.wellnessPackage.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
