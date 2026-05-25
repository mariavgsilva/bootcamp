# Clínica Vitta

Sistema de gestão clínica com React (Vite) e API Express com autenticação JWT.

## Como executar

### Backend

```bash
cd backend
cp .env.example .env
# Edite .env e defina JWT_SECRET com um valor seguro
npm install
npm run dev
```

API em `http://localhost:3000`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App em `http://localhost:5173`

## Credenciais de administrador (desenvolvimento)

O backend ativo usa **`backend/db.json`**, não o Prisma.

| Campo | Valor |
|-------|--------|
| Email | `admin@example.com` |
| Senha | `admin123` |

Se o login do admin falhar com "Credenciais inválidas", redefina a senha:

```bash
cd backend
npm run reset-admin
# ou: node scripts/reset-admin-password.js suaNovaSenha
```

> O arquivo `backend/prisma/seed.js` documenta `admin123`, mas **não alimenta** o `db.json` usado pelo servidor Express.

## Fluxo principal

1. Cadastro em `/cadastro` → `POST /auth/register`
2. Login em `/` → `POST /auth/login` (token salvo no navegador)
3. Dashboard em `/dashboard` (rota protegida) → `GET /users/me`

## Rotas da API

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cadastro |
| POST | `/auth/login` | Login |
| GET | `/users/me` | Perfil (requer token) |

### Consultas (JWT obrigatório)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/appointments` | Criar consulta |
| GET | `/appointments` | Listar (filtros: `date`, `appointmentType`, `status`, `userId` admin) |
| GET | `/appointments/:id` | Detalhe |
| PUT | `/appointments/:id` | Atualizar / cancelar |
| DELETE | `/appointments/:id` | Excluir |
| GET | `/appointments/schedule?date=YYYY-MM-DD` | Grade de horários do dia |
| GET | `/appointments/stats` | Estatísticas (admin) |
| GET | `/appointments/meta/types` | Tipos e status permitidos |
