const specialtyRepository = require("../repositories/specialtyRepository");

async function list() {
  const specialties = await specialtyRepository.findAll();
  return specialties.map((s) => ({
    id: s.id,
    name: s.name,
    doctorCount: s._count?.doctors ?? 0,
  }));
}

async function create(name) {
  if (!name?.trim()) return { error: "Nome da especialidade é obrigatório", status: 400 };
  const exists = await specialtyRepository.findByName(name.trim());
  if (exists) return { error: "Especialidade já existe", status: 409 };
  const specialty = await specialtyRepository.create({ name: name.trim() });
  return { specialty: { id: specialty.id, name: specialty.name } };
}

async function update(id, name) {
  if (!name?.trim()) return { error: "Nome é obrigatório", status: 400 };
  const existing = await specialtyRepository.findById(id);
  if (!existing) return { error: "Especialidade não encontrada", status: 404 };
  const specialty = await specialtyRepository.update(id, { name: name.trim() });
  return { specialty: { id: specialty.id, name: specialty.name } };
}

async function remove(id) {
  const existing = await specialtyRepository.findById(id);
  if (!existing) return { error: "Especialidade não encontrada", status: 404 };
  await specialtyRepository.delete(id);
  return { message: "Especialidade removida" };
}

module.exports = { list, create, update, remove };
