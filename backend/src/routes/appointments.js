const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { createSupabaseServiceClient } = require("../lib/supabase");
const { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } = require("../constants/appointments");
const {
  validateAppointmentPayload,
  isValidDateString,
} = require("../utils/appointmentValidate");
const { buildDaySchedule } = require("../utils/scheduleSlots");
const { requireAdmin } = require("../middleware/roles");

const router = express.Router();
const supabase = createSupabaseServiceClient();

const appointmentSelect = `
  *,
  doctor:doctors(id,name,user_id),
  patient:users(id,email)
`;

function mapAppointmentRow(row) {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    patientEmail: row.patient?.email || null,
    appointmentType: row.appointment_type,
    date: row.date,
    time: row.time,
    doctorId: row.doctor_id,
    doctorName: row.doctor?.name || null,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchDoctor({ doctorId, doctorName }) {
  if (doctorId) {
    const { data, error } = await supabase
      .from("doctors")
      .select("id,name,specialty_id")
      .eq("id", doctorId)
      .single();
    if (error) return null;
    return data;
  }
  if (doctorName) {
    const { data, error } = await supabase
      .from("doctors")
      .select("id,name,specialty_id")
      .ilike("name", doctorName.trim())
      .limit(1);
    if (error || !data?.length) return null;
    return data[0];
  }
  return null;
}

async function fetchDoctorForUser(userId) {
  const { data, error } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

async function fetchAppointmentById(id) {
  const { data, error } = await supabase
    .from("appointments")
    .select(appointmentSelect)
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

function canAccessAppointment(user, appointment) {
  if (user.role === "admin") return true;
  if (appointment.patient_id === user.id) return true;
  if (user.role === "doctor" && appointment.doctor?.user_id === user.id) return true;
  return false;
}

async function hasScheduleConflict({ date, time, doctorId, excludeId }) {
  let query = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("date", date)
    .eq("time", time)
    .eq("doctor_id", doctorId)
    .eq("status", "scheduled");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { error, count } = await query;
  if (error) {
    throw error;
  }
  return count > 0;
}

async function buildAppointmentQuery(req) {
  const builder = supabase.from("appointments").select(appointmentSelect).order("date", { ascending: true }).order("time", { ascending: true });

  if (req.user.role === "admin") {
    return builder;
  }

  if (req.user.role === "doctor") {
    const doctor = await fetchDoctorForUser(req.user.id);
    if (!doctor) {
      return null;
    }
    return builder.eq("doctor_id", doctor.id);
  }

  return builder.eq("patient_id", req.user.id);
}

router.get("/meta/types", (req, res) => {
  res.json({ types: APPOINTMENT_TYPES, statuses: APPOINTMENT_STATUSES });
});

router.get("/schedule", async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !isValidDateString(date)) {
      return res.status(400).json({ message: "Informe date no formato YYYY-MM-DD" });
    }

    const query = await buildAppointmentQuery(req);
    if (!query) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const { data: appointments, error } = await query.eq("date", date);
    if (error) {
      throw error;
    }

    const slots = buildDaySchedule(appointments, date).map((slot) => {
      if (!slot.appointment) return slot;
      if (req.user.role === "admin") return slot;
      if (req.user.role === "doctor") return slot;
      if (slot.appointment.patient_id !== req.user.id) {
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

    res.json({ date, slots });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", requireAdmin, async (req, res, next) => {
  try {
    const [{ data: appointments }, { data: users }] = await Promise.all([
      supabase.from("appointments").select("*").order("date", { ascending: true }),
      supabase.from("users").select("*").order("created_at", { ascending: true }),
    ]);

    const byStatus = APPOINTMENT_STATUSES.reduce((acc, status) => {
      acc[status] = appointments.filter((a) => a.status === status).length;
      return acc;
    }, {});

    const byType = APPOINTMENT_TYPES.reduce((acc, type) => {
      acc[type] = appointments.filter((a) => a.appointment_type === type).length;
      return acc;
    }, {});

    const occupiedDays = [
      ...new Set(appointments.filter((a) => a.status === "scheduled").map((a) => a.date)),
    ].sort();

    res.json({
      totalAppointments: appointments.length,
      totalUsers: users.length,
      byStatus,
      byType,
      occupiedDays,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const query = await buildAppointmentQuery(req);
    if (!query) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    if (req.query.date) query.eq("date", req.query.date);
    if (req.query.appointmentType) query.eq("appointment_type", req.query.appointmentType);
    if (req.query.status) query.eq("status", req.query.status);
    if (req.user.role === "admin" && req.query.userId) query.eq("patient_id", req.query.userId);
    if (req.user.role === "admin" && req.query.doctorId) query.eq("doctor_id", req.query.doctorId);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    res.json(data.map(mapAppointmentRow));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const errors = validateAppointmentPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    const doctor = await fetchDoctor({ doctorId: req.body.doctorId, doctorName: req.body.doctor });
    if (!doctor) {
      return res.status(400).json({ message: "Médico não encontrado. Informe doctorId válido." });
    }

    if (await hasScheduleConflict({
      date: req.body.date,
      time: req.body.time,
      doctorId: doctor.id,
    })) {
      return res.status(409).json({ message: "Horário já ocupado. Escolha outro horário." });
    }

    const appointmentPayload = {
      id: uuidv4(),
      patient_id: req.user.id,
      patient_name: String(req.body.patientName).trim(),
      appointment_type: req.body.appointmentType,
      date: req.body.date,
      time: req.body.time,
      doctor_id: doctor.id,
      specialty_id: doctor.specialty_id,
      notes: req.body.notes?.trim() || null,
      status: "scheduled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("appointments").insert(appointmentPayload).select(appointmentSelect).single();
    if (error) {
      throw error;
    }

    res.status(201).json(mapAppointmentRow(data));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const appointment = await fetchAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Consulta não encontrada" });
    }
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: "Acesso negado a esta consulta" });
    }

    res.json(mapAppointmentRow(appointment));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const appointment = await fetchAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Consulta não encontrada" });
    }
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: "Acesso negado a esta consulta" });
    }

    const doctor = await fetchDoctor({ doctorId: req.body.doctorId, doctorName: req.body.doctor });
    if (req.body.doctorId || req.body.doctor) {
      if (!doctor) {
        return res.status(400).json({ message: "Médico não encontrado. Informe doctorId válido." });
      }
    }

    const merged = {
      patientName: req.body.patientName ?? appointment.patient_name,
      appointmentType: req.body.appointmentType ?? appointment.appointment_type,
      date: req.body.date ?? appointment.date,
      time: req.body.time ?? appointment.time,
      doctorId: doctor ? doctor.id : appointment.doctor_id,
      specialtyId: doctor ? doctor.specialty_id : appointment.specialty_id,
      notes: req.body.notes ?? appointment.notes,
      status: req.body.status ?? appointment.status,
    };

    if (req.user.role !== "admin") {
      if (req.body.status && !["scheduled", "cancelled"].includes(req.body.status)) {
        return res.status(403).json({ message: "Apenas administradores podem definir este status" });
      }
      if (appointment.status === "cancelled" && merged.status !== "cancelled") {
        return res.status(400).json({ message: "Consultas canceladas não podem ser reativadas" });
      }
    }

    const errors = validateAppointmentPayload(
      {
        patientName: merged.patientName,
        appointmentType: merged.appointmentType,
        date: merged.date,
        time: merged.time,
        status: merged.status,
      },
      { partial: false },
    );
    if (errors.length) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    if (
      merged.status === "scheduled" &&
      (merged.date !== appointment.date || merged.time !== appointment.time || merged.doctorId !== appointment.doctor_id) &&
      (await hasScheduleConflict({
        date: merged.date,
        time: merged.time,
        doctorId: merged.doctorId,
        excludeId: appointment.id,
      }))
    ) {
      return res.status(409).json({ message: "Horário já ocupado. Escolha outro horário." });
    }

    const updatePayload = {
      patient_name: String(merged.patientName).trim(),
      appointment_type: merged.appointmentType,
      date: merged.date,
      time: merged.time,
      doctor_id: merged.doctorId,
      specialty_id: merged.specialtyId,
      notes: merged.notes?.trim() || null,
      status: merged.status,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", appointment.id)
      .select(appointmentSelect)
      .single();

    if (error) {
      throw error;
    }

    res.json(mapAppointmentRow(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const appointment = await fetchAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Consulta não encontrada" });
    }
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: "Acesso negado a esta consulta" });
    }

    const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);
    if (error) {
      throw error;
    }

    res.json({ message: "Consulta removida", appointment: mapAppointmentRow(appointment) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
