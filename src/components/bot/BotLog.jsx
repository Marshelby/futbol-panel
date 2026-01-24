export default function BotLog({ orden }) {
  if (!orden) return null;

  const {
    mensaje_publico,
    mensaje,
    estado_orden = "orden_activa",
    created_at,
  } = orden;

  const estadoConfig = {
    enviando: {
      bg: "bg-amber-500/10 border-amber-400/40",
      label: "ENVIANDO AL BOT",
    },
    en_ejecucion: {
      bg: "bg-blue-500/10 border-blue-400/40",
      label: "EN EJECUCIÓN",
    },
    orden_activa: {
      bg: "bg-emerald-500/10 border-emerald-400/40",
      label: "ORDEN ACTIVA",
    },
    orden_expirada: {
      bg: "bg-red-500/10 border-red-400/40",
      label: "ORDEN EXPIRADA",
    },
  };

  const cfg = estadoConfig[estado_orden] || estadoConfig.orden_activa;

  const fecha = created_at
    ? new Date(created_at).toLocaleDateString("es-CL")
    : "--/--/----";

  const hora = created_at
    ? new Date(created_at).toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <div
      className={`
        w-full rounded-xl px-6 py-5 border
        backdrop-blur-md transition-all
        ${cfg.bg}
      `}
    >
      {/* Header mínimo */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-white/70">
          {cfg.label}
        </span>

        <span className="text-xs text-white/60">
          {fecha} · {hora}
        </span>
      </div>

      {/* Mensaje principal */}
      <div className="text-[17px] leading-relaxed font-semibold text-white">
        {mensaje_publico || mensaje || "Mensaje sin contenido"}
      </div>
    </div>
  );
}
