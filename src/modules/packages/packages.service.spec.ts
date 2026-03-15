/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { PrismaService } from '../../database/prisma.service';
import { createMockPackage, serializeMockPackage } from '../../../test/helpers/mock-factories';

import { QueryPackageDto } from './dto/query-package.dto';
import { PackagesService } from './packages.service';

const DEFAULT_QUERY = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
} as unknown as QueryPackageDto;

describe('PackagesService', () => {
  let service: PackagesService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PackagesService, { provide: PrismaService, useValue: mockDeep<PrismaService>() }],
    }).compile();

    service = module.get(PackagesService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return a paginated response with default sort', async () => {
      const packages = [createMockPackage(), createMockPackage()];
      prisma.wellnessPackage.findMany.mockResolvedValue(packages);
      prisma.wellnessPackage.count.mockResolvedValue(2);

      const result = await service.findAll(DEFAULT_QUERY);

      expect(result.data).toEqual(packages.map(serializeMockPackage));
      expect(result.meta).toEqual({ total: 2, page: 1, limit: 10, totalPages: 1 });
      expect(prisma.wellnessPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
      expect(prisma.wellnessPackage.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined }),
      );
    });

    it('should calculate skip correctly for page 2', async () => {
      prisma.wellnessPackage.findMany.mockResolvedValue([]);
      prisma.wellnessPackage.count.mockResolvedValue(25);

      const result = await service.findAll({
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as unknown as QueryPackageDto);

      expect(result.meta.totalPages).toBe(3);
      expect(prisma.wellnessPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('should build WHERE clause when search is provided', async () => {
      const pkg = createMockPackage();
      prisma.wellnessPackage.findMany.mockResolvedValue([pkg]);
      prisma.wellnessPackage.count.mockResolvedValue(1);

      await service.findAll({
        page: 1,
        limit: 10,
        search: 'yoga',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as unknown as QueryPackageDto);

      expect(prisma.wellnessPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'yoga', mode: 'insensitive' } },
              { description: { contains: 'yoga', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should sort by price ascending when sortBy=price sortOrder=asc', async () => {
      prisma.wellnessPackage.findMany.mockResolvedValue([]);
      prisma.wellnessPackage.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc',
      } as unknown as QueryPackageDto);

      expect(prisma.wellnessPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { price: 'asc' } }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single package', async () => {
      const pkg = createMockPackage();
      prisma.wellnessPackage.findUnique.mockResolvedValue(pkg);

      const result = await service.findOne(pkg.id);

      expect(result).toEqual(serializeMockPackage(pkg));
    });

    it('should throw NotFoundException when package is not found', async () => {
      prisma.wellnessPackage.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new package', async () => {
      const pkg = createMockPackage();
      const dto = {
        name: pkg.name,
        description: pkg.description,
        price: Number(pkg.price),
        durationMinutes: pkg.durationMinutes,
      };
      prisma.wellnessPackage.create.mockResolvedValue(pkg);

      const result = await service.create(dto);

      expect(result).toEqual(serializeMockPackage(pkg));
      expect(prisma.wellnessPackage.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('update', () => {
    it('should update and return the package', async () => {
      const pkg = createMockPackage();
      const updated = { ...pkg, name: 'Updated Name' };
      const dto = { name: 'Updated Name' };
      prisma.wellnessPackage.findUnique.mockResolvedValue(pkg);
      prisma.wellnessPackage.update.mockResolvedValue(updated);

      const result = await service.update(pkg.id, dto);

      expect(result).toEqual(serializeMockPackage(updated));
    });

    it('should throw NotFoundException when package is not found', async () => {
      prisma.wellnessPackage.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete and return the deleted package', async () => {
      const pkg = createMockPackage();
      prisma.wellnessPackage.findUnique.mockResolvedValue(pkg);
      prisma.wellnessPackage.delete.mockResolvedValue(pkg);

      const result = await service.remove(pkg.id);

      expect(result).toEqual(serializeMockPackage(pkg));
      expect(prisma.wellnessPackage.delete).toHaveBeenCalledWith({ where: { id: pkg.id } });
    });

    it('should throw NotFoundException when package is not found', async () => {
      prisma.wellnessPackage.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
