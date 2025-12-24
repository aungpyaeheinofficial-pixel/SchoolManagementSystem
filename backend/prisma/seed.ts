import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/prisma.js';

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const role = process.env.ADMIN_ROLE || 'admin';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin user "${username}" already exists. Skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { username, passwordHash, role },
  });

  // Create an empty dataset record so /sync/pull works on first run
  const datasetKey = process.env.DATASET_KEY || 'default';
  const existingDataset = await prisma.dataset.findUnique({ where: { key: datasetKey } });
  if (!existingDataset) {
    await prisma.dataset.create({
      data: {
        key: datasetKey,
        version: 1,
        data: {
          students: [],
          staff: [],
          expenses: [],
          exams: [],
          marks: [],
          timetable: [],
          classes: [],
          rooms: [],
          subjects: [],
          feeStructures: [],
          attendance: {},
          staffAttendance: {},
          payments: [],
          exportDate: new Date().toISOString(),
        },
      },
    });
  }

  console.log(`Seeded admin user "${username}" and dataset "${datasetKey}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


