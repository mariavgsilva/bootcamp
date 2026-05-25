const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/server");
const prisma = require("../src/lib/prisma");

before(async () => {
  await prisma.$connect();
});

after(async () => {
  await prisma.$disconnect();
});

test("GET /health retorna status", async () => {
  const res = await request(app).get("/health");
  assert.ok([200, 503].includes(res.status));
});

test("POST /auth/login rejeita credenciais vazias", async () => {
  const res = await request(app).post("/auth/login").send({});
  assert.equal(res.status, 400);
});
