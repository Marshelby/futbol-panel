export default function MiniCancha({ nombre, estado, onClick }) {
  // Normalización de estados que vienen del backend
  const estadoNormalizado = (() => {
    switch (estado) {
      case "disponible":
        return "libre";
      case "reservada":
      case "bloqueada":
        return "ocupada";
      default:
        return "ocupada"; // fallback seguro
    }
  })();

  const isLibre = estadoNormalizado === "libre";

  const estadoConfig = {
    libre: {
      label: "Libre",
      bg: "bg-green-500/10",
      border: "border-green-500/40",
      text: "text-green-400",
    },
    ocupada: {
      label: "Ocupada",
      bg: "bg-red-500/10",
      border: "border-red-500/40",
      text: "text-red-400",
    },
  };

  const cfg = estadoConfig[estadoNormalizado];

  return (
    <button
      type="button"
      onClick={onClick}                // ✅ SIEMPRE clickeable
      className={`
        w-full rounded-2xl border p-4 text-left transition
        ${cfg.bg} ${cfg.border}
        hover:scale-[1.01] cursor-pointer
      `}
    >
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{nombre}</div>
        <div className={`text-sm font-semibold ${cfg.text}`}>
          {cfg.label}
        </div>
      </div>

      <div className="mt-3 h-20 rounded-lg border border-white/10 flex items-center justify-center text-sm opacity-70">
        {isLibre ? "Tocar para reservar" : "Ver detalle"}
      </div>
    </button>
  );
}
