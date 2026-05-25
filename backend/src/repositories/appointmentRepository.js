const prisma = require("../lib/prisma");

const ACTIVE_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "RESCHEDULED",
];

const appointmentRepository = {
  findMany(where = {}, include = {}) {
    return prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { specialty: true } },
        user: true,
        ...include,
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
  },

  findById(id) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { specialty: true } },
        user: true,
      },
    });
  },

  findByDoctorAndDate(doctorId, date) {
    return prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: { in: ACTIVE_STATUSES },
      },
    });
  },

  create(data) {
    return prisma.appointment.create({
      data,
      include: {
        doctor: { include: { specialty: true } },
        user: true,
      },
    });
  },

  update(id, data) {
    return prisma.appointment.update({
      where: { id },
      data,
      include: {
        doctor: { include: { specialty: true } },
        user: true,
      },
    });
  },

  count(where = {}) {
    return prisma.appointment.count({ where });
  },

  groupByStatus(where = {}) {
    return prisma.appointment.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    });
  },
};

module.exports = appointmentRepository;
