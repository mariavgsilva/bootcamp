const fs = require("fs");
const path = require("path");
const dbPath = path.join(__dirname, "..", "db.json");
function readDB() {
  try {
    const content = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(content);
  } catch (err) {
    return { users: [] };
  };
}
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
function getUsers() {
  const db = readDB();
  return db.users || [];
}
function saveUsers(users) {
  const db = readDB();
  db.users = users;
  writeDB(db);
}
module.exports = { readDB, writeDB, getUsers, saveUsers };
