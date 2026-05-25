/**
 * ATENÇÃO: Este seed é para migração futura com Prisma.
 * O servidor Express atual autentica via backend/db.json (ver scripts/reset-admin-password.js).
 */
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { APPOINTMENT_TYPES } = require("../src/utils/appointmentConstants");

const prisma = new PrismaClient();

const DEFAULT_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const DEFAULT_HOURS = { start: "08:00", end: "17:30" };

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const specialties = [];
  for (const name of APPOINTMENT_TYPES) {
    const specialty = await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    specialties.push(specialty);
  }

  const doctorSeeds = [
    { name: "Dr. Carlos Silva", email: "carlos.silva@vitta.com", specialty: "Cardiologista" },
    { name: "Dra. Ana Costa", email: "ana.costa@vitta.com", specialty: "Dermatologista" },
    { name: "Dr. Pedro Lima", email: "pedro.lima@vitta.com", specialty: "Neurologista" },
    { name: "Dra. Julia Mendes", email: "julia.mendes@vitta.com", specialty: "Pediatra" },
    { name: "Dr. Ricardo Souza", email: "ricardo.souza@vitta.com", specialty: "Ortopedista" },
    { name: "Dra. Julia Mendes", email: "julia.mendes@vitta.com", specialty: "Pediatra" },
    { name: "Dr. Ricardo Souza", email: "ricardo.souza@vitta.com", specialty: "Ortopedista" },
    { name: "Dra. Julia Mendes", email: "julia.mendes@vitta.com", specialty: "Pediatra" },
  ];

  for (const doc of doctorSeeds) {
    const specialty = specialties.find((s) => s.name === doc.specialty);
    if (!specialty) continue;
    await prisma.doctor.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        name: doc.name,
        email: doc.email,
        specialtyId: specialty.id,
        availableDays: DEFAULT_DAYS,
        availableHours: DEFAULT_HOURS,
        active: true,
      },
    });
  }

  console.log("Seed concluído: admin@example.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
