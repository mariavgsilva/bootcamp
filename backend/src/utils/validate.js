function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

module.exports = { isValidEmail, isValidPassword };
