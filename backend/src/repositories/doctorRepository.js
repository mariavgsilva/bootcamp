const prisma = require("../lib/prisma");

const doctorRepository = {
  findAll(filters = {}) {
    const where = { active: true };
    if (filters.specialtyId) where.specialtyId = filters.specialtyId;
    if (filters.includeInactive) delete where.active;

    return prisma.doctor.findMany({
      where,
      include: { specialty: true },
      orderBy: { name: "asc" },
    });
  },

  findById(id) {
    return prisma.doctor.findUnique({
      where: { id },
      include: { specialty: true },
    });
  },

  create(data) {
    return prisma.doctor.create({
      data,
      include: { specialty: true },
    });
  },

  update(id, data) {
    return prisma.doctor.update({
      where: { id },
      data,
      include: { specialty: true },
    });
  },

  delete(id) {
    return prisma.doctor.delete({ where: { id } });
  },
};

module.exports = doctorRepository;
