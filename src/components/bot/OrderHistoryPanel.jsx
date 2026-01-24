import BotLog from "./BotLog";

/*
  Estados reales que vienen desde:
  - orden optimista (frontend)
  - bot_ordenes
  - v_bot_ordenes_estado
*/
const ESTADO_LABEL = {
  enviando: {
    texto: "Enviando al bot",
    color: "text-amber-300",
  },
  en_ejecucion: {
    texto: "En ejecución",
    color: "text-blue-300",
  },
  orden_activa: {
    texto: "Orden activa",
    color: "text-emerald-300",
  },
  orden_expirada: {
    texto: "Orden expirada",
    color: "text-gray-400",
  },
};

export default function OrderHistoryPanel({ historial = [] }) {
  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl border border-white/10 bg-gradient-to-b from-[#0b1c2d] to-[#091425]">

      {/* HEADER FIJO */}
      <div className="px-5 py-4 border-b border-white/10 shrink-0">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">
          Historial de órdenes al chatbot
        </h3>
        <p className="text-xs text-white/40 mt-1">
          Registro completo de órdenes enviadas al bot
        </p>
      </div>

      {/* CONTENIDO SCROLLEABLE */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6">

        {historial.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/40 gap-2">
            <div className="text-sm font-medium">
              No hay órdenes registradas
            </div>
            <div className="text-xs max-w-xs">
              Cuando envíes una orden al chatbot, aparecerá aquí con su estado.
            </div>
          </div>
        )}

        {historial.map((orden, index) => {
          const estadoUI =
            ESTADO_LABEL[orden.estado_orden] ||
            ESTADO_LABEL.enviando; // fallback seguro

          return (
            <div key={orden.id} className="space-y-2">

              {/* FILA SUPERIOR: ESTADO + ÚLTIMA ORDEN */}
              <div className="flex items-center justify-between">
                <div
                  className={`text-xs font-semibold uppercase tracking-wide ${estadoUI.color}`}
                >
                  {estadoUI.texto}
                </div>

                {index === 0 && (
                  <div className="text-xs font-bold text-white">
                    Última orden
                  </div>
                )}
              </div>

              {/* LOG */}
              <div
                className="
                  transition-all duration-200 ease-out
                  hover:scale-[1.01]
                  hover:shadow-lg
                "
              >
                <BotLog orden={orden} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
