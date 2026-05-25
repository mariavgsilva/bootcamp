const prisma = require("../lib/prisma");

const specialtyRepository = {
  findAll() {
    return prisma.specialty.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { doctors: true } } },
    });
  },

  findById(id) {
    return prisma.specialty.findUnique({ where: { id } });
  },

  findByName(name) {
    return prisma.specialty.findUnique({ where: { name } });
  },

  create(data) {
    return prisma.specialty.create({ data });
  },

  update(id, data) {
    return prisma.specialty.update({ where: { id }, data });
  },

  delete(id) {
    return prisma.specialty.delete({ where: { id } });
  },
};

module.exports = specialtyRepository;
