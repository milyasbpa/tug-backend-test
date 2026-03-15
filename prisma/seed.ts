import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env['NODE_ENV'] ?? 'development'}` });
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const packages = [
    {
      name: 'Classic Relaxation',
      description:
        'A full-body relaxation experience combining aromatherapy and gentle massage techniques.',
      price: 75.0,
      durationMinutes: 60,
    },
    {
      name: 'Deep Tissue Therapy',
      description:
        'Intensive deep tissue massage targeting chronic muscle tension and pain relief.',
      price: 120.0,
      durationMinutes: 90,
    },
    {
      name: 'Express Refresh',
      description: 'A quick revitalizing session perfect for a midday energy boost.',
      price: 45.0,
      durationMinutes: 30,
    },
  ];

  const isFresh = process.env['RESEED'] === 'true';
  if (isFresh) {
    await prisma.wellnessPackage.deleteMany();
    console.log('Cleared existing wellness packages');
  }

  const existingCount = await prisma.wellnessPackage.count();
  if (existingCount === 0) {
    await prisma.wellnessPackage.createMany({ data: packages });
  }

  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
