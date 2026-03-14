/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { PrismaService } from '../../database/prisma.service';
import { createMockPackage } from '../../../test/helpers/mock-factories';

import { PackagesService } from './packages.service';

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

  // ─── findAll ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return an array of packages', async () => {
      const packages = [createMockPackage(), createMockPackage()];
      prisma.wellnessPackage.findMany.mockResolvedValue(packages);

      const result = await service.findAll();

      expect(result).toEqual(packages);
      expect(prisma.wellnessPackage.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a single package', async () => {
      const pkg = createMockPackage();
      prisma.wellnessPackage.findUnique.mockResolvedValue(pkg);

      const result = await service.findOne(pkg.id);

      expect(result).toEqual(pkg);
    });

    it('should throw NotFoundException when package is not found', async () => {
      prisma.wellnessPackage.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────
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

      expect(result).toEqual(pkg);
      expect(prisma.wellnessPackage.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return the package', async () => {
      const pkg = createMockPackage();
      const updated = { ...pkg, name: 'Updated Name' };
      const dto = { name: 'Updated Name' };
      prisma.wellnessPackage.findUnique.mockResolvedValue(pkg);
      prisma.wellnessPackage.update.mockResolvedValue(updated);

      const result = await service.update(pkg.id, dto);

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when package is not found', async () => {
      prisma.wellnessPackage.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete and return the deleted package', async () => {
      const pkg = createMockPackage();
      prisma.wellnessPackage.findUnique.mockResolvedValue(pkg);
      prisma.wellnessPackage.delete.mockResolvedValue(pkg);

      const result = await service.remove(pkg.id);

      expect(result).toEqual(pkg);
      expect(prisma.wellnessPackage.delete).toHaveBeenCalledWith({ where: { id: pkg.id } });
    });

    it('should throw NotFoundException when package is not found', async () => {
      prisma.wellnessPackage.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
