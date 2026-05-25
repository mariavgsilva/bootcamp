import { api } from "./api";

export function fetchAppointments(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return api(`/appointments${qs ? `?${qs}` : ""}`);
}

export function fetchAppointment(id) {
  return api(`/appointments/${id}`);
}

export function createAppointment(payload) {
  return api("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAppointment(id, payload) {
  return api(`/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAppointment(id) {
  return api(`/appointments/${id}`, { method: "DELETE" });
}

export function fetchDaySchedule(date) {
  return api(`/appointments/schedule?date=${date}`);
}

export function fetchAppointmentStats() {
  return api("/appointments/stats");
}

export function fetchAppointmentTypes() {
  return api("/appointments/meta/types");
}

export function fetchAllUsers() {
  return api("/users");
}
