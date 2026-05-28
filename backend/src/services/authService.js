const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getUsers, saveUsers } = require('../db');
const { jwtSecret, jwtExpiresIn } = require('../config');
const { isValidEmail, isValidPassword } = require('../utils/validate');

async function registerUser(payload) {
  const { name, email, password, age } = payload;

  if (!name || !email || !password) {
    return { status: 400, body: { message: 'name, email e password são obrigatórios' } };
  }

  if (!isValidEmail(email)) {
    return { status: 400, body: { message: 'Email inválido' } };
  }

  if (!isValidPassword(password)) {
    return {
      status: 400,
      body: { message: 'A senha deve ter no mínimo 6 caracteres' },
    };
  }

  const users = await getUsers();
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    return { status: 409, body: { message: 'Email já cadastrado' } };
  }

  const hashed = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    name: String(name).trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    age: age ?? null,
    role: 'user',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);

  const { password: _, ...userNoPass } = newUser;

  return { status: 201, body: userNoPass };
}

async function loginUser(payload) {
  const { email, password } = payload;

  if (!email || !password) {
    return { status: 400, body: { message: 'email e password são obrigatórios' } };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = await getUsers();

  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return { status: 401, body: { message: 'Credenciais inválidas' } };
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return { status: 401, body: { message: 'Credenciais inválidas' } };
  }

  const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  const { password: _, ...userNoPass } = user;

  return {
    status: 200,
    body: {
      token,
      user: userNoPass,
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
};
