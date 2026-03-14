import { User, Role, WellnessPackage, Prisma } from '@prisma/client';

let userCounter = 0;
let packageCounter = 0;

/**
 * Creates a mock User object with optional overrides.
 * Password is NOT hashed — use bcrypt.hash() in tests that need it.
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const id = ++userCounter;
  return {
    id: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
    email: `user${id}@example.com`,
    password: 'hashed_password_placeholder',
    role: Role.USER,
    refreshTokenHash: null,
    deletedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates a mock admin User.
 */
export function createMockAdminUser(overrides: Partial<User> = {}): User {
  return createMockUser({ role: Role.ADMIN, ...overrides });
}

/**
 * Creates a mock WellnessPackage object with optional overrides.
 */
export function createMockPackage(overrides: Partial<WellnessPackage> = {}): WellnessPackage {
  const id = ++packageCounter;
  return {
    id: `00000000-0000-0000-0001-${String(id).padStart(12, '0')}`,
    name: `Package ${id}`,
    description: `Description for package ${id}`,
    price: new Prisma.Decimal(100000),
    durationMinutes: 60,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}
