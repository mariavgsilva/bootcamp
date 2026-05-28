const { v4: uuidv4 } = require('uuid');
const { getAppointments, saveAppointments, getUsers } = require('../db');
const { validateAppointmentPayload, hasScheduleConflict } = require('../utils/appointmentValidate');

async function listAppointments(user, query) {
  const appointments = await getAppointments();

  let list = user.role === 'admin'
    ? [...appointments]
    : appointments.filter((a) => a.userId === user.id);

  if (query.date) {
    list = list.filter((a) => a.date === query.date);
  }

  const users = await getUsers();

  return list.map((appointment) => ({
    ...appointment,
    patientEmail: users.find((u) => u.id === appointment.userId)?.email || null,
  }));
}

async function createAppointment(payload, user) {
  const errors = validateAppointmentPayload(payload);

  if (errors.length) {
    return { status: 400, body: { message: errors.join('. ') } };
  }

  const appointments = await getAppointments();

  if (hasScheduleConflict(appointments, payload)) {
    return {
      status: 409,
      body: { message: 'Horário já ocupado. Escolha outro horário.' },
    };
  }

  const appointment = {
    id: uuidv4(),
    userId: user.id,
    patientName: String(payload.patientName).trim(),
    appointmentType: payload.appointmentType,
    date: payload.date,
    time: payload.time,
    doctor: payload.doctor?.trim() || null,
    notes: payload.notes?.trim() || null,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appointments.push(appointment);
  await saveAppointments(appointments);

  return { status: 201, body: appointment };
}

module.exports = {
  listAppointments,
  createAppointment,
};
