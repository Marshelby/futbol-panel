import BotLog from "./BotLog";

export default function OrderStatusPanel({ ordenes = [] }) {
  const ordenesEnEjecucion = ordenes.filter(
    (o) => o.estado_orden === "EN_EJECUCION"
  );

  const ordenesActivas = ordenes.filter(
    (o) => o.estado_orden === "ORDEN_ACTIVA"
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">

      {/* ÓRDENES EN EJECUCIÓN */}
      <div className="flex flex-col rounded-xl border border-white/10 bg-gradient-to-b from-[#0b1c2d] to-[#091425]">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Órdenes en ejecución
            </h3>
            <span className="ml-auto text-xs text-white/40">
              {ordenesEnEjecucion.length}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {ordenesEnEjecucion.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-white/40 gap-2">
              <div className="text-sm font-medium">
                No hay órdenes en ejecución
              </div>
              <div className="text-xs max-w-xs">
                Las órdenes que el bot esté procesando aparecerán aquí.
              </div>
            </div>
          ) : (
            ordenesEnEjecucion.map((orden) => (
              <BotLog key={orden.id} orden={orden} />
            ))
          )}
        </div>
      </div>

      {/* ÓRDENES ACTIVAS */}
      <div className="flex flex-col rounded-xl border border-white/10 bg-gradient-to-b from-[#0b1c2d] to-[#091425]">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Órdenes activas
            </h3>
            <span className="ml-auto text-xs text-white/40">
              {ordenesActivas.length}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {ordenesActivas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-white/40 gap-2">
              <div className="text-sm font-medium">
                No hay órdenes activas
              </div>
              <div className="text-xs max-w-xs">
                Las órdenes vigentes del chatbot se mostrarán aquí.
              </div>
            </div>
          ) : (
            ordenesActivas.map((orden) => (
              <BotLog key={orden.id} orden={orden} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
