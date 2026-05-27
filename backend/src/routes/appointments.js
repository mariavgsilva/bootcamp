const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { createSupabaseClient } = require("../lib/supabase"); 
const { APPOINTMENT_TYPES, APPOINTMENT_STATUSES } = require("../constants/appointments");
const { validateAppointmentPayload, isValidDateString } = require("../utils/appointmentValidate");
const { buildDaySchedule } = require("../utils/scheduleSlots");
const { requireAdmin } = require("../middleware/roles");

const router = express.Router();

// Select mapeando perfeitamente as colunas do seu novo SQL (Query 3 + status)
const appointmentSelect = `
  id,
  user_id,
  patient_name,
  consultation_type,
  date,
  time,
  doctor_name,
  notes,
  status,
  created_at
`;

function mapAppointmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.user_id, 
    patientName: row.patient_name,
    patientEmail: null, 
    appointmentType: row.consultation_type || "Geral", 
    date: row.date,
    time: row.time,
    doctorId: null, 
    doctorName: row.doctor_name || "Médico Padrão", 
    notes: row.notes,
    status: row.status || "scheduled",
    createdAt: row.created_at
  };
}

// Checagem de conflito usa apenas data e hora para evitar agendamento duplo
async function hasScheduleConflict(supabase, { date, time, excludeId }) {
  let query = supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("date", date)
    .eq("time", time)
    .eq("status", "scheduled");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { error, count } = await query;
  if (error) return false;
  return count > 0;
}

function buildAppointmentQueryBase(supabase, req) {
  let queryInstance = supabase.from("appointments").select(appointmentSelect);

  if (req.user && req.user.role !== "admin") {
    queryInstance = queryInstance.eq("user_id", req.user.id);
  }

  return queryInstance;
}

// --- ROTAS ---

router.get("/meta/types", (req, res) => {
  res.json({ types: APPOINTMENT_TYPES, statuses: APPOINTMENT_STATUSES });
});

router.get("/schedule", async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date || !isValidDateString(date)) {
      return res.status(400).json({ message: "Informe date no formato YYYY-MM-DD" });
    }

    const supabase = createSupabaseClient();
    let query = buildAppointmentQueryBase(supabase, req);
    query = query.eq("date", date);

    const { data: appointments, error } = await query;
    if (error) throw error;

    const safeAppointments = (appointments || []).map(mapAppointmentRow);
    const slots = buildDaySchedule(safeAppointments, date);

    res.json({ date, slots });
  } catch (err) {
    next(err);
  }
});

router.get("/stats", requireAdmin, async (req, res, next) => {
  try {
    const supabase = createSupabaseClient();
    let appointments = [];
    let usersCount = 0;

    try {
      const { data } = await supabase.from("appointments").select("status, consultation_type, date");
      if (data) appointments = data;
    } catch (e) { console.error(e); }

    try {
      const { count } = await supabase.from("users").select("id", { count: "exact", head: true });
      if (count) usersCount = count;
    } catch (e) { console.error(e); }

    const byStatus = APPOINTMENT_STATUSES.reduce((acc, status) => {
      acc[status] = appointments.filter((a) => a.status === status).length;
      return acc;
    }, {});

    const byType = APPOINTMENT_TYPES.reduce((acc, type) => {
      acc[type] = appointments.filter((a) => a.consultation_type === type).length;
      return acc;
    }, {});

    const occupiedDays = [
      ...new Set(appointments.filter((a) => a.status === "scheduled").map((a) => a.date)),
    ].sort();

    res.json({
      totalAppointments: appointments.length,
      totalUsers: usersCount,
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
    const supabase = createSupabaseClient();
    let query = buildAppointmentQueryBase(supabase, req);

    if (req.query.date) query = query.eq("date", req.query.date);
    if (req.query.appointmentType) query = query.eq("consultation_type", req.query.appointmentType);
    if (req.query.status) query = query.eq("status", req.query.status);
    
    if (req.user && req.user.role === "admin" && req.query.userId) {
      query = query.eq("user_id", req.query.userId);
    }

    query = query.order("date", { ascending: true }).order("time", { ascending: true });

    const { data, error } = await query;
    
    if (error) {
      console.error("🚨 ERRO NO SUPABASE (GET /appointments):", error.message);
      return res.status(500).json({ message: "Erro no banco de dados", details: error.message });
    }

    res.json((data || []).map(mapAppointmentRow));
  } catch (err) {
    console.error("🚨 ERRO INTERNO:", err);
    res.status(500).json({ message: "Erro interno do servidor", details: err.message });
  }
});

router.post("/", async (req, res, next) => {
  try {
    const errors = validateAppointmentPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors.join(". ") });
    }

    const supabase = createSupabaseClient();

    if (await hasScheduleConflict(supabase, {
      date: req.body.date,
      time: req.body.time
    })) {
      return res.status(409).json({ message: "Horário já ocupado. Escolha outro horário." });
    }

    const appointmentPayload = {
      id: uuidv4(),
      user_id: req.user.id, 
      patient_name: String(req.body.patientName).trim(),
      consultation_type: req.body.appointmentType || "Geral", 
      date: req.body.date,
      time: req.body.time,
      doctor_name: req.body.doctor || req.body.doctorName || null,
      notes: req.body.notes?.trim() || null,
      status: "scheduled"
    };

    const { data, error } = await supabase.from("appointments").insert(appointmentPayload).select(appointmentSelect).single();
    
    if (error) {
      console.error("🚨 ERRO AO CRIAR (POST):", error.message);
      throw error;
    }

    res.status(201).json(mapAppointmentRow(data));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = createSupabaseClient();
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(appointmentSelect)
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!appointment) return res.status(404).json({ message: "Consulta não encontrada" });

    res.json(mapAppointmentRow(appointment));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const supabase = createSupabaseClient();

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(appointmentSelect)
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!appointment) return res.status(404).json({ message: "Consulta não encontrada" });

const updatePayload = {
      patient_name: req.body.patientName ? String(req.body.patientName).trim() : appointment.patient_name,
      consultation_type: req.body.appointmentType || appointment.consultation_type,
      date: req.body.date || appointment.date,
      time: req.body.time || appointment.time,
      // Usando apenas '||' em tudo para não dar conflito de sintaxe:
      doctor_name: req.body.doctor || req.body.doctorName || appointment.doctor_name,
      notes: req.body.notes || appointment.notes,
      status: req.body.status || appointment.status
    };

    const { data, error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", appointment.id)
      .select(appointmentSelect)
      .single();

    if (error) throw error;

    res.json(mapAppointmentRow(data));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", req.params.id)
      .select(appointmentSelect)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Consulta não encontrada" });

    res.json({ message: "Consulta removida", appointment: mapAppointmentRow(data) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;