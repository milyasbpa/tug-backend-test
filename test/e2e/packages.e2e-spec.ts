import * as http from 'http';

import { INestApplication } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

import { createTestApp, getPrisma } from '../helpers/test-app.helper';

interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface PackageData {
  id: string;
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function body<T>(res: request.Response): ApiResponse<T> {
  return res.body as ApiResponse<T>;
}

/**
 * Packages E2E Tests
 *
 * Requires a running PostgreSQL instance with the test database configured
 * in .env.test. Run migrations first:
 *   NODE_ENV=test npx prisma migrate deploy
 */
describe('Packages (e2e)', () => {
  let app: INestApplication;
  let server: http.Server;
  let adminToken: string;

  const ADMIN_URL = '/api/v1/admin/packages';
  const MOBILE_URL = '/api/v1/mobile/packages';

  const ADMIN_USER = {
    email: 'e2e.packages.admin@example.com',
    password: 'adminpass123',
  };

  const VALID_PACKAGE = {
    name: 'E2E Test Package',
    description: 'Package created during E2E test',
    price: 150000,
    durationMinutes: 60,
  };

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer() as http.Server;
    const prisma = getPrisma(app);

    // Seed admin user
    const hashed = await bcrypt.hash(ADMIN_USER.password, 12);
    await prisma.user.upsert({
      where: { email: ADMIN_USER.email },
      update: { password: hashed, role: Role.ADMIN, refreshTokenHash: null },
      create: { email: ADMIN_USER.email, password: hashed, role: Role.ADMIN },
    });

    // Login to obtain admin token used across all tests
    const res = await request(server).post('/api/v1/auth/login').send(ADMIN_USER);
    adminToken = body<{ accessToken: string }>(res).data.accessToken;
  });

  afterAll(async () => {
    const prisma = getPrisma(app);
    // Clean up all packages and the test admin user created during this suite
    await prisma.wellnessPackage.deleteMany({
      where: { name: { startsWith: 'E2E' } },
    });
    await prisma.user.deleteMany({ where: { email: ADMIN_USER.email } });
    await app.close();
  });

  // ─── GET /mobile/packages ────────────────────────────────────────────────
  describe('GET /mobile/packages', () => {
    it('should return 200 with paginated packages', async () => {
      const res = await request(server)
        .get(MOBILE_URL)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const b = body<PaginatedData<PackageData>>(res);
      expect(b.success).toBe(true);
      expect(Array.isArray(b.data.data)).toBe(true);
      expect(b.data.meta).toHaveProperty('total');
      expect(b.data.meta).toHaveProperty('page', 1);
      expect(b.data.meta).toHaveProperty('limit', 10);
      expect(b.data.meta).toHaveProperty('totalPages');
    });

    it('should filter results when search param is provided', async () => {
      const res = await request(server)
        .get(`${MOBILE_URL}?search=E2E`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const b = body<PaginatedData<PackageData>>(res);
      expect(b.success).toBe(true);
      b.data.data.forEach((pkg) => {
        const matchesSearch =
          pkg.name.toLowerCase().includes('e2e') || pkg.description.toLowerCase().includes('e2e');
        expect(matchesSearch).toBe(true);
      });
    });

    it('should sort by price ascending when sortBy=price&sortOrder=asc', async () => {
      const res = await request(server)
        .get(`${MOBILE_URL}?sortBy=price&sortOrder=asc`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const b = body<PaginatedData<PackageData>>(res);
      expect(b.success).toBe(true);
      const prices = b.data.data.map((p) => parseFloat(p.price));
      const sorted = [...prices].sort((a, c) => a - c);
      expect(prices).toEqual(sorted);
    });

    it('should return 401 without token', async () => {
      await request(server).get(MOBILE_URL).expect(401);
    });
  });

  // ─── GET /admin/packages ─────────────────────────────────────────────────
  describe('GET /admin/packages', () => {
    it('should return 200 with paginated packages for ADMIN', async () => {
      const res = await request(server)
        .get(ADMIN_URL)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const b = body<PaginatedData<PackageData>>(res);
      expect(b.success).toBe(true);
      expect(Array.isArray(b.data.data)).toBe(true);
      expect(b.data.meta).toHaveProperty('total');
      expect(b.data.meta).toHaveProperty('page', 1);
      expect(b.data.meta).toHaveProperty('limit', 10);
    });

    it('should return 401 without token', async () => {
      await request(server).get(ADMIN_URL).expect(401);
    });
  });

  // ─── POST /admin/packages ────────────────────────────────────────────────
  describe('POST /admin/packages', () => {
    it('should create and return a new package (201)', async () => {
      const res = await request(server)
        .post(ADMIN_URL)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(VALID_PACKAGE)
        .expect(201);

      const b = body<PackageData>(res);
      expect(b.success).toBe(true);
      expect(b.data).toHaveProperty('id');
      expect(b.data.name).toBe(VALID_PACKAGE.name);
      expect(b.data.durationMinutes).toBe(VALID_PACKAGE.durationMinutes);
    });

    it('should return 422 on invalid payload (missing required fields)', async () => {
      const res = await request(server)
        .post(ADMIN_URL)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Missing price and duration' })
        .expect(422);

      expect(body(res).success).toBe(false);
    });

    it('should return 422 when price is negative', async () => {
      const res = await request(server)
        .post(ADMIN_URL)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...VALID_PACKAGE, price: -100 })
        .expect(422);

      expect(body(res).success).toBe(false);
    });
  });

  // ─── PUT /admin/packages/:id ─────────────────────────────────────────────
  describe('PUT /admin/packages/:id', () => {
    let packageId: string;

    beforeEach(async () => {
      // Create a fresh package for each update test
      const res = await request(server)
        .post(ADMIN_URL)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...VALID_PACKAGE, name: 'E2E Update Target' });
      packageId = body<PackageData>(res).data.id;
    });

    it('should update and return the package (200)', async () => {
      const res = await request(server)
        .put(`${ADMIN_URL}/${packageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'E2E Updated Name' })
        .expect(200);

      const b = body<PackageData>(res);
      expect(b.success).toBe(true);
      expect(b.data.id).toBe(packageId);
      expect(b.data.name).toBe('E2E Updated Name');
    });

    it('should return 404 when package does not exist', async () => {
      const res = await request(server)
        .put(`${ADMIN_URL}/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost' })
        .expect(404);

      expect(body(res).success).toBe(false);
    });
  });

  // ─── DELETE /admin/packages/:id ──────────────────────────────────────────
  describe('DELETE /admin/packages/:id', () => {
    let packageId: string;

    beforeEach(async () => {
      // Create a fresh package for each delete test
      const res = await request(server)
        .post(ADMIN_URL)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...VALID_PACKAGE, name: 'E2E Delete Target' });
      packageId = body<PackageData>(res).data.id;
    });

    it('should delete and return the deleted package (200)', async () => {
      const res = await request(server)
        .delete(`${ADMIN_URL}/${packageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const b = body<PackageData>(res);
      expect(b.success).toBe(true);
      expect(b.data.id).toBe(packageId);
    });
  });
});
