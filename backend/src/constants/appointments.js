const APPOINTMENT_TYPES = [
  "Cardiologista",
  "Hemograma",
  "Checkup",
  "Ressonancia Magnética",
  "Ortopedista",
  "Dermatologista",
  "Neurologista",
  "Pediatra",
  "Ginecologista",
];

const APPOINTMENT_STATUSES = ["scheduled", "cancelled", "completed"];

const CLINIC_OPEN = "08:00";
const CLINIC_CLOSE = "17:00";
const SLOT_MINUTES = 30;

module.exports = {
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUSES,
  CLINIC_OPEN,
  CLINIC_CLOSE,
  SLOT_MINUTES,
};
