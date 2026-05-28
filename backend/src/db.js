const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');

async function readDB() {
  try {
    const content = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return { users: [], appointments: [] };
  }
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

async function getUsers() {
  const db = await readDB();
  return db.users || [];
}

async function saveUsers(users) {
  const db = await readDB();
  db.users = users;
  await writeDB(db);
}

async function getAppointments() {
  const db = await readDB();
  return db.appointments || [];
}

async function saveAppointments(appointments) {
  const db = await readDB();
  db.appointments = appointments;
  await writeDB(db);
}

module.exports = {
  readDB,
  writeDB,
  getUsers,
  saveUsers,
  getAppointments,
  saveAppointments,
};
