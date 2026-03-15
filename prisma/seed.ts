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

  const userPassword = await bcrypt.hash('user123', 12);

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      role: Role.USER,
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
    {
      name: 'Hot Stone Massage',
      description: 'Warm basalt stones placed on key points to melt away tension and stress.',
      price: 95.0,
      durationMinutes: 75,
    },
    {
      name: 'Swedish Bliss',
      description: 'Classic Swedish massage with long, flowing strokes to promote relaxation.',
      price: 80.0,
      durationMinutes: 60,
    },
    {
      name: 'Prenatal Care',
      description: 'Gentle massage designed for expectant mothers to relieve pregnancy discomfort.',
      price: 85.0,
      durationMinutes: 60,
    },
    {
      name: 'Sports Recovery',
      description:
        'Targeted techniques to accelerate muscle recovery after intense physical activity.',
      price: 110.0,
      durationMinutes: 75,
    },
    {
      name: 'Thai Stretch',
      description: 'Traditional Thai massage combining acupressure and assisted yoga stretches.',
      price: 90.0,
      durationMinutes: 90,
    },
    {
      name: 'Scalp & Shoulder Relief',
      description: 'Focused session on the head, neck, and shoulders to relieve tension headaches.',
      price: 50.0,
      durationMinutes: 30,
    },
    {
      name: 'Reflexology',
      description: 'Pressure applied to specific points on the feet to stimulate organ function.',
      price: 60.0,
      durationMinutes: 45,
    },
    {
      name: 'Couple Retreat',
      description:
        'Side-by-side relaxation experience for two with matching aromatherapy treatments.',
      price: 160.0,
      durationMinutes: 90,
    },
    {
      name: 'Bamboo Fusion',
      description: 'Warmed bamboo canes used to knead and roll out muscle tension across the body.',
      price: 100.0,
      durationMinutes: 60,
    },
    {
      name: 'Lymphatic Drainage',
      description:
        'Gentle, rhythmic strokes to stimulate the lymphatic system and reduce puffiness.',
      price: 105.0,
      durationMinutes: 60,
    },
    {
      name: 'Foot Spa Retreat',
      description:
        'Revitalizing foot soak followed by an exfoliating scrub and moisturizing massage.',
      price: 40.0,
      durationMinutes: 30,
    },
    {
      name: 'Full Body Signature',
      description:
        'Our premium head-to-toe treatment combining four modalities for total rejuvenation.',
      price: 150.0,
      durationMinutes: 120,
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
