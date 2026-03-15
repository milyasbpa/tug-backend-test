import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WellnessPackage } from '@prisma/client';

import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { PrismaService } from '../../database/prisma.service';

import { CreatePackageDto } from './dto/create-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(pkg: WellnessPackage): WellnessPackage {
    return { ...pkg, price: Number(pkg.price) } as unknown as WellnessPackage;
  }

  async findAll(query: QueryPackageDto): Promise<PaginatedResponse<WellnessPackage>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.WellnessPackageWhereInput | undefined = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const [data, total] = await Promise.all([
      this.prisma.wellnessPackage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.wellnessPackage.count({ where }),
    ]);

    return {
      data: data.map((pkg) => this.serialize(pkg)),
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
    return this.serialize(pkg);
  }

  async create(dto: CreatePackageDto): Promise<WellnessPackage> {
    const pkg = await this.prisma.wellnessPackage.create({ data: dto });
    return this.serialize(pkg);
  }

  async update(id: string, dto: UpdatePackageDto): Promise<WellnessPackage> {
    await this.findOne(id);
    const pkg = await this.prisma.wellnessPackage.update({ where: { id }, data: dto });
    return this.serialize(pkg);
  }

  async remove(id: string): Promise<WellnessPackage> {
    await this.findOne(id);
    const pkg = await this.prisma.wellnessPackage.delete({ where: { id } });
    return this.serialize(pkg);
  }
}
