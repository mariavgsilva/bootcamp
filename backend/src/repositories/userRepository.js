const prisma = require("../lib/prisma");

const userRepository = {
  findAll() {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  },

  create(data) {
    return prisma.user.create({ data });
  },

  update(id, data) {
    return prisma.user.update({ where: { id }, data });
  },

  delete(id) {
    return prisma.user.delete({ where: { id } });
  },
};

module.exports = userRepository;
