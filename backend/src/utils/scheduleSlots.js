const {
  CLINIC_OPEN,
  CLINIC_CLOSE,
  SLOT_MINUTES,
} = require("../constants/appointments");
const { parseTimeToMinutes } = require("./appointmentValidate");

function generateTimeSlots() {
  const slots = [];
  let current = parseTimeToMinutes(CLINIC_OPEN);
  const end = parseTimeToMinutes(CLINIC_CLOSE);

  while (current <= end) {
    const hours = String(Math.floor(current / 60)).padStart(2, "0");
    const minutes = String(current % 60).padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
    current += SLOT_MINUTES;
  }

  return slots;
}

function buildDaySchedule(appointments, date) {
  const slots = generateTimeSlots();
  const booked = appointments.filter(
    (a) => a.date === date && a.status === "scheduled",
  );

  return slots.map((time) => {
    const match = booked.find((a) => a.time === time);
    return {
      time,
      available: !match,
      appointment: match
        ? {
            id: match.id,
            patientName: match.patientName,
            appointmentType: match.appointmentType,
            userId: match.userId,
          }
        : null,
    };
  });
}

module.exports = { generateTimeSlots, buildDaySchedule };
