const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getAppointments, saveAppointments, getUsers } = require("../db");
const { listAppointments, createAppointment } = require("../services/appointmentService");
const { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } = require("../constants/appointments");
const {
  validateAppointmentPayload,
  hasScheduleConflict,
  isValidDateString,
} = require("../utils/appointmentValidate");
const { buildDaySchedule } = require("../utils/scheduleSlots");
const { requireAdmin } = require("../middleware/roles");

const router = express.Router();

function filterAppointmentsForUser(appointments, user, query) {
  let list =
    user.role === "admin"
      ? [...appointments]
      : appointments.filter((a) => a.userId === user.id);

  if (query.date) {
    list = list.filter((a) => a.date === query.date);
  }
  if (query.appointmentType) {
    list = list.filter((a) => a.appointmentType === query.appointmentType);
  }
  if (query.status) {
    list = list.filter((a) => a.status === query.status);
  }
  if (query.userId && user.role === "admin") {
    list = list.filter((a) => a.userId === query.userId);
  }

  return list.sort((a, b) => {
    const aKey = `${a.date}T${a.time}`;
    const bKey = `${b.date}T${b.time}`;
    return aKey.localeCompare(bKey);
  });
}

function canAccessAppointment(user, appointment) {
  return user.role === "admin" || appointment.userId === user.id;
}

async function attachPatientEmail(appointments) {
  const users = await getUsers();
  return appointments.map((appointment) => {
    const owner = users.find((u) => u.id === appointment.userId);
    return {
      ...appointment,
      patientEmail: owner?.email || null,
    };
  });
}

router.get("/meta/types", (req, res) => {
  res.json({ types: APPOINTMENT_TYPES, statuses: APPOINTMENT_STATUSES });
});

router.get("/schedule", async (req, res) => {
  const { date } = req.query;
  if (!date || !isValidDateString(date)) {
    return res.status(400).json({ message: "Informe date no formato YYYY-MM-DD" });
  }

  const appointments = await getAppointments();
  let slots = buildDaySchedule(appointments, date);

  if (req.user.role !== "admin") {
    slots = slots.map((slot) => {
      if (slot.appointment && slot.appointment.userId !== req.user.id) {
        return {
          time: slot.time,
          available: false,
          appointment: {
            appointmentType: "Horário reservado",
            patientName: "Indisponível",
          },
        };
      }
      return slot;
    });
  }

  res.json({ date, slots });
});

router.get("/stats", requireAdmin, async (req, res) => {
  const appointments = await getAppointments();
  const users = await getUsers();

  const byStatus = APPOINTMENT_STATUSES.reduce((acc, status) => {
    acc[status] = appointments.filter((a) => a.status === status).length;
    return acc;
  }, {});

  const byType = APPOINTMENT_TYPES.reduce((acc, type) => {
    acc[type] = appointments.filter((a) => a.appointmentType === type).length;
    return acc;
  }, {});

  const occupiedDays = [
    ...new Set(
      appointments
        .filter((a) => a.status === "scheduled")
        .map((a) => a.date),
    ),
  ].sort();

  res.json({
    totalAppointments: appointments.length,
    totalUsers: users.length,
    byStatus,
    byType,
    occupiedDays,
  });
});

router.get("/", async (req, res, next) => {
  try {
    const appointments = await listAppointments(req.user, req.query);
    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await createAppointment(req.body, req.user);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res) => {
  const appointments = await getAppointments();
  const appointment = appointments.find((a) => a.id === req.params.id);
  if (!appointment) {
    return res.status(404).json({ message: "Consulta não encontrada" });
  }
  if (!canAccessAppointment(req.user, appointment)) {
    return res.status(403).json({ message: "Acesso negado a esta consulta" });
  }
  res.json(appointment);
});

router.put("/:id", async (req, res, next) => {
  try {
    const appointments = await getAppointments();
    const idx = appointments.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: "Consulta não encontrada" });
    }

    const current = appointments[idx];
    if (!canAccessAppointment(req.user, current)) {
      return res.status(403).json({ message: "Acesso negado a esta consulta" });
    }

    const merged = {
      patientName: req.body.patientName ?? current.patientName,
      appointmentType: req.body.appointmentType ?? current.appointmentType,
      date: req.body.date ?? current.date,
      time: req.body.time ?? current.time,
      doctor: req.body.doctor ?? current.doctor,
      notes: req.body.notes ?? current.notes,
      status: req.body.status ?? current.status,
    };

    if (req.user.role !== "admin") {
      if (req.body.status && !["scheduled", "cancelled"].includes(req.body.status)) {
        return res
          .status(403)
          .json({ message: "Apenas administradores podem definir este status" });
      }
      if (current.status === "cancelled" && merged.status !== "cancelled") {
        return res
          .status(400)
          .json({ message: "Consultas canceladas não podem ser reativadas" });
      }
    }

    const errors = validateAppointmentPayload(merged, { partial: false });
    if (errors.length) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    if (
      merged.status === "scheduled" &&
      hasScheduleConflict(appointments, {
        date: merged.date,
        time: merged.time,
        excludeId: current.id,
      })
    ) {
      return res
        .status(409)
        .json({ message: "Horário já ocupado. Escolha outro horário." });
    }

    appointments[idx] = {
      ...current,
      ...merged,
      patientName: String(merged.patientName).trim(),
      doctor: merged.doctor?.trim() || null,
      notes: merged.notes?.trim() || null,
      updatedAt: new Date().toISOString(),
    };

    await saveAppointments(appointments);
    res.json(appointments[idx]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res) => {
  const appointments = await getAppointments();
  const idx = appointments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: "Consulta não encontrada" });
  }

  const current = appointments[idx];
  if (!canAccessAppointment(req.user, current)) {
    return res.status(403).json({ message: "Acesso negado a esta consulta" });
  }

  const removed = appointments.splice(idx, 1)[0];
  await saveAppointments(appointments);
  res.json({ message: "Consulta removida", appointment: removed });
});

module.exports = router;
