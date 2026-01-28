export function buildReservaLectura({
  agenda,
  pago,
  hora,
  canchas = [],
}) {
  const cancha = canchas.find(c => c.id === agenda.cancha_id);

  const montoTotal = Number(pago?.monto_total || 0);
  const montoAbonado = Number(pago?.monto_abonado || 0);

  return {
    cliente: agenda.nombre_cliente || "—",
    telefono: agenda.telefono || pago?.telefono || "—",
    fecha: agenda.fecha,
    hora,
    cancha: cancha?.nombre || "—",
    estado: "Pagado",
    total: montoTotal,
    abonado: montoAbonado,
    saldo: Math.max(montoTotal - montoAbonado, 0),
  };
}
