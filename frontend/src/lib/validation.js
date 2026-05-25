export function validateEmail(email) {
  if (!email?.trim()) return "Informe o email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Email inválido";
  }
  return null;
}

export function validatePassword(password) {
  if (!password) return "Informe a senha";
  if (password.length < 6) return "A senha deve ter no mínimo 6 caracteres";
  return null;
}

export function validateName(name) {
  if (!name?.trim()) return "Informe o nome";
  return null;
}
