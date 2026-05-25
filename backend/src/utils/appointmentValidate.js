const {
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUSES,
  CLINIC_OPEN,
  CLINIC_CLOSE,
} = require("../constants/appointments");

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseTimeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isValidDateString(date) {
  if (!DATE_REGEX.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function isValidTimeString(time) {
  if (!TIME_REGEX.test(time)) return false;
  const minutes = parseTimeToMinutes(time);
  const open = parseTimeToMinutes(CLINIC_OPEN);
  const close = parseTimeToMinutes(CLINIC_CLOSE);
  return minutes >= open && minutes <= close;
}

function isFutureOrTodayDateTime(date, time) {
  const appointmentDate = new Date(`${date}T${time}:00`);
  return appointmentDate.getTime() >= Date.now();
}

function validateAppointmentPayload(body, { partial = false } = {}) {
  const errors = [];
  const requiredFields = ["patientName", "appointmentType", "date", "time"];

  for (const field of requiredFields) {
    if (
      !partial &&
      (body[field] === undefined || body[field] === null || body[field] === "")
    ) {
      errors.push(`${field} é obrigatório`);
    }
  }

  if (body.patientName !== undefined && !String(body.patientName).trim()) {
    errors.push("patientName não pode estar vazio");
  }

  if (body.appointmentType !== undefined) {
    if (!APPOINTMENT_TYPES.includes(body.appointmentType)) {
      errors.push("appointmentType inválido");
    }
  }

  if (body.date !== undefined && !isValidDateString(body.date)) {
    errors.push("date deve estar no formato YYYY-MM-DD");
  }

  if (body.time !== undefined && !isValidTimeString(body.time)) {
    errors.push(`time inválido (horário comercial ${CLINIC_OPEN}–${CLINIC_CLOSE})`);
  }

  if (body.date && body.time && isValidDateString(body.date) && isValidTimeString(body.time)) {
    if (!isFutureOrTodayDateTime(body.date, body.time)) {
      errors.push("Não é permitido agendar no passado");
    }
  }

  if (body.status !== undefined && !APPOINTMENT_STATUSES.includes(body.status)) {
    errors.push('status deve ser "scheduled", "cancelled" ou "completed"');
  }

  return errors;
}

function hasScheduleConflict(appointments, { date, time, excludeId }) {
  return appointments.some(
    (item) =>
      item.id !== excludeId &&
      item.status === "scheduled" &&
      item.date === date &&
      item.time === time,
  );
}

module.exports = {
  validateAppointmentPayload,
  hasScheduleConflict,
  isValidDateString,
  isValidTimeString,
  parseTimeToMinutes,
};
