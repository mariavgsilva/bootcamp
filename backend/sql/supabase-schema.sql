-- Supabase schema para o backend de agendamento médico
-- Cria as tabelas Users, Specialties, Doctors e Appointments
-- Inclui restrição única de horário por médico e políticas RLS.

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  name text not null,
  age integer,
  role text not null default 'patient' check (role in ('patient', 'doctor', 'admin')),
  created_at timestamptz not null default now()
);

create table specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  specialty_id uuid not null references specialties(id) on delete restrict,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint doctors_user_unique unique (user_id)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references users(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete restrict,
  specialty_id uuid not null references specialties(id) on delete restrict,
  patient_name text not null,
  appointment_type text not null,
  date date not null,
  time time not null,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_doctor_date_time unique (doctor_id, date, time)
);

create index appointments_patient_date_idx on appointments(patient_id, date);
create index appointments_doctor_date_idx on appointments(doctor_id, date);

-- Ativa Row Level Security
alter table users enable row level security;
alter table specialties enable row level security;
alter table doctors enable row level security;
alter table appointments enable row level security;

-- Policies para users
create policy "Users can select own profile" on users for select using (id = auth.uid());
create policy "Users can update own profile" on users for update using (id = auth.uid());
create policy "Users can insert profile" on users for insert with check (true);
create policy "Users can delete own profile" on users for delete using (id = auth.uid());

-- Policies para specialties
create policy "Authenticated can select specialties" on specialties for select using (auth.role() = 'authenticated');

-- Policies para doctors
create policy "Doctors can select own profile" on doctors for select using (user_id = auth.uid());
create policy "Doctors can insert own profile" on doctors for insert with check (user_id = auth.uid());
create policy "Doctors can update own profile" on doctors for update using (user_id = auth.uid());
create policy "Doctors can delete own profile" on doctors for delete using (user_id = auth.uid());

-- Policies para appointments
create policy "Patients can select own appointments" on appointments for select using (patient_id = auth.uid());
create policy "Doctors can select own appointments" on appointments for select using (
  doctor_id in (select id from doctors where user_id = auth.uid())
);
create policy "Patients can insert appointments" on appointments for insert with check (patient_id = auth.uid());
create policy "Patients can update own appointments" on appointments for update using (patient_id = auth.uid());
create policy "Doctors can update own appointments" on appointments for update using (
  doctor_id in (select id from doctors where user_id = auth.uid())
);
create policy "Patients can delete own appointments" on appointments for delete using (patient_id = auth.uid());
create policy "Doctors can delete own appointments" on appointments for delete using (
  doctor_id in (select id from doctors where user_id = auth.uid())
);

-- Nota: para que estas políticas façam efeito no backend, é necessário usar o token de sessão Supabase do usuário
-- ou configurar o cliente Supabase para atuar com credenciais de autenticação específicas do usuário.
