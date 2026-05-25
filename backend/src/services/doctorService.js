const doctorRepository = require("../repositories/doctorRepository");
const specialtyRepository = require("../repositories/specialtyRepository");
const { formatDoctor } = require("../utils/mappers");
const { isValidEmail } = require("../utils/validate");

const DEFAULT_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const DEFAULT_HOURS = { start: "08:00", end: "17:30" };

async function list(filters) {
  const doctors = await doctorRepository.findAll(filters);
  return doctors.map(formatDoctor);
}

async function getById(id) {
  const doctor = await doctorRepository.findById(id);
  if (!doctor) return { error: "Médico não encontrado", status: 404 };
  return { doctor: formatDoctor(doctor) };
}

async function create(body) {
  const { name, email, specialtyId, availableDays, availableHours, active } = body;
  if (!name || !email || !specialtyId) {
    return { error: "name, email e specialtyId são obrigatórios", status: 400 };
  }
  if (!isValidEmail(email)) {
    return { error: "Email inválido", status: 400 };
  }

  const specialty = await specialtyRepository.findById(specialtyId);
  if (!specialty) return { error: "Especialidade não encontrada", status: 404 };

  const doctor = await doctorRepository.create({
    name: String(name).trim(),
    email: email.toLowerCase().trim(),
    specialtyId,
    availableDays: availableDays ?? DEFAULT_DAYS,
    availableHours: availableHours ?? DEFAULT_HOURS,
    active: active !== false,
  });

  return { doctor: formatDoctor(doctor) };
}

async function update(id, body) {
  const existing = await doctorRepository.findById(id);
  if (!existing) return { error: "Médico não encontrado", status: 404 };

  const data = {};
  if (body.name) data.name = String(body.name).trim();
  if (body.email) {
    if (!isValidEmail(body.email)) {
      return { error: "Email inválido", status: 400 };
    }
    data.email = body.email.toLowerCase().trim();
  }
  if (body.specialtyId) data.specialtyId = body.specialtyId;
  if (body.availableDays) data.availableDays = body.availableDays;
  if (body.availableHours) data.availableHours = body.availableHours;
  if (body.active !== undefined) data.active = Boolean(body.active);

  const doctor = await doctorRepository.update(id, data);
  return { doctor: formatDoctor(doctor) };
}

async function remove(id) {
  const existing = await doctorRepository.findById(id);
  if (!existing) return { error: "Médico não encontrado", status: 404 };
  await doctorRepository.delete(id);
  return { message: "Médico removido" };
}

module.exports = { list, getById, create, update, remove };
