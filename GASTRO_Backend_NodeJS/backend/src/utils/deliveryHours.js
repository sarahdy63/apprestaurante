const TIME_ZONE = "America/Bogota";

function toMinutes(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function toLabel(value) {
  const total = toMinutes(value);
  const hours = Math.floor(total / 60);
  const minutes = String(total % 60).padStart(2, "0");
  const suffix = hours >= 12 ? "p. m." : "a. m.";
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

function currentMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour").value) % 24;
  const minute = Number(parts.find((p) => p.type === "minute").value);
  return hour * 60 + minute;
}

function getDeliveryHours() {
  const enabled = process.env.DELIVERY_HOURS_ENABLED !== "false";
  const start = process.env.DELIVERY_START || "17:00";
  const end = process.env.DELIVERY_END || "23:00";
  const now = currentMinutes();
  const open = !enabled || (now >= toMinutes(start) && now < toMinutes(end));
  return {
    enabled,
    open,
    start: toLabel(start),
    end: toLabel(end),
    message: `¡Hola! Nuestros domicilios funcionan todos los días de ${toLabel(start)} a ${toLabel(end)} Te esperamos con tu pedido en ese horario.`,
  };
}

module.exports = getDeliveryHours;
