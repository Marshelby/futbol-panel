import { useEffect } from "react";

/**
 * Modal de detalle de reserva
 * Ajuste EXACTO: ancho a la MITAD del actual
 */
export default function DetalleReservaModal({
  modalData,
  canchas,
  onClose,
  onMarcarPagado,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!modalData) return null;

  const formatCLP = (n) =>
    new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(
      Number(n || 0)
    );

  const total = Number(modalData.pago?.monto_total || 0);
  const abono = Number(modalData.pago?.monto_abonado || 0);
  const saldo = Math.max(0, total - abono);

  const isPagado =
    modalData.pago?.estado_pago === "pagado" || saldo === 0;
  const isConAbono = !isPagado && abono > 0;

  const estadoLabel = isPagado
    ? "RESERVA PAGADA"
    : isConAbono
    ? "CON ABONO"
    : "PENDIENTE DE PAGO";

  const estadoIcon = isPagado ? "✅" : isConAbono ? "🟣" : "⚠️";
  const estadoClass = isPagado
    ? "bg-blue-600"
    : isConAbono
    ? "bg-purple-600"
    : "bg-red-600";

  const telefono = modalData.pago?.telefono || "—";

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex justify-center items-start"
      onClick={onClose}
    >
      <div className="flex justify-center pt-10 px-4 w-full">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] border border-black/10 mt-8 mb-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`${estadoClass} text-white px-4 py-3 rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold tracking-wide opacity-90">
                Reserva
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white text-xl leading-none"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-base">{estadoIcon}</span>
              <div className="text-base font-black tracking-wide">
                {estadoLabel}
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-4">
            {/* Datos reserva */}
            <div className="rounded-xl border border-black/10 bg-gray-50 p-3 mb-3">
              <div className="text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase">
                Datos de la reserva
              </div>

              <div className="space-y-2">
                <div className="flex justify-between gap-3">
                  <div className="text-xs text-gray-500">👤 Cliente</div>
                  <div className="text-xs font-bold text-gray-900 text-right">
                    {modalData.agenda.nombre_cliente}
                  </div>
                </div>

                <div className="h-px bg-black/10" />

                <div className="flex justify-between gap-3">
                  <div className="text-xs text-gray-500">📞 Teléfono</div>
                  <div className="text-xs font-bold text-gray-900 text-right">
                    {telefono !== "—" ? `+569 ${telefono}` : "—"}
                  </div>
                </div>

                <div className="h-px bg-black/10" />

                <div className="flex justify-between gap-3">
                  <div className="text-xs text-gray-500">📅 Fecha</div>
                  <div className="text-xs font-bold text-gray-900 text-right">
                    {modalData.agenda.fecha}
                  </div>
                </div>

                <div className="h-px bg-black/10" />

                <div className="flex justify-between gap-3">
                  <div className="text-xs text-gray-500">⏰ Hora</div>
                  <div className="text-xs font-bold text-gray-900 text-right">
                    {String(modalData.hora || "").slice(0, 5)}
                  </div>
                </div>

                <div className="h-px bg-black/10" />

                <div className="flex justify-between gap-3">
                  <div className="text-xs text-gray-500">🏟️ Cancha</div>
                  <div className="text-xs font-bold text-gray-900 text-right">
                    {canchas.find(
                      (c) => c.id === modalData.agenda.cancha_id
                    )?.nombre || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen pago */}
            <div className="rounded-xl border border-black/10 bg-white p-3">
              <div className="text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase">
                Resumen de pago
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-xs font-extrabold text-gray-900">
                    ${formatCLP(total)}
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="text-xs text-gray-500">Abono</div>
                  <div className="text-xs font-bold text-gray-900">
                    ${formatCLP(abono)}
                  </div>
                </div>

                <div className="h-px bg-black/10" />

                <div className="flex justify-between">
                  <div className="text-xs font-semibold text-gray-600">
                    Saldo
                  </div>
                  <div
                    className={`text-sm font-black ${
                      saldo === 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${formatCLP(saldo)}
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-4 pt-3 border-t border-black/10 space-y-2">
              {!isPagado && (
                <button
                  onClick={onMarcarPagado}
                  className="w-full bg-black text-white py-2 rounded-xl font-bold text-sm"
                >
                  💰 Marcar como pagado
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full border border-black/20 py-2 rounded-xl font-semibold text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
