function mapRoleToApi(role) {
  return role === "ADMIN" ? "admin" : "user";
}

function mapRoleFromApi(role) {
  return role === "admin" ? "ADMIN" : "USER";
}

function mapStatusToApi(status) {
  return status.toLowerCase();
}

function mapStatusFromApi(status) {
  if (!status) return "SCHEDULED";
  return status.toUpperCase();
}

function formatUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return {
    ...rest,
    role: mapRoleToApi(user.role),
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
    updatedAt: user.updatedAt?.toISOString?.() ?? user.updatedAt,
  };
}

function formatDoctor(doctor) {
  if (!doctor) return null;
  return {
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    specialty: doctor.specialty?.name ?? doctor.specialtyName ?? null,
    specialtyId: doctor.specialtyId,
    availableDays: doctor.availableDays,
    availableHours: doctor.availableHours,
    active: doctor.active,
    createdAt: doctor.createdAt?.toISOString?.() ?? doctor.createdAt,
    updatedAt: doctor.updatedAt?.toISOString?.() ?? doctor.updatedAt,
  };
}

function formatAppointment(appointment, extras = {}) {
  if (!appointment) return null;
  return {
    id: appointment.id,
    userId: appointment.userId,
    doctorId: appointment.doctorId,
    patientName: appointment.patientName,
    appointmentType: appointment.appointmentType,
    date: appointment.date,
    time: appointment.time,
    durationMinutes: appointment.durationMinutes,
    status: mapStatusToApi(appointment.status),
    notes: appointment.notes ?? "",
    cancellationReason: appointment.cancellationReason ?? null,
    doctor: appointment.doctor ? formatDoctor(appointment.doctor) : extras.doctor ?? null,
    doctorName: appointment.doctor?.name ?? extras.doctorName ?? null,
    userName: extras.userName ?? appointment.user?.name ?? null,
    userEmail: extras.userEmail ?? appointment.user?.email ?? null,
    createdAt: appointment.createdAt?.toISOString?.() ?? appointment.createdAt,
    updatedAt: appointment.updatedAt?.toISOString?.() ?? appointment.updatedAt,
  };
}

module.exports = {
  mapRoleToApi,
  mapRoleFromApi,
  mapStatusToApi,
  mapStatusFromApi,
  formatUser,
  formatDoctor,
  formatAppointment,
};
