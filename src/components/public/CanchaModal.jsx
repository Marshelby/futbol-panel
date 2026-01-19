import { useEffect } from "react";

export default function CanchaModal({ open, onClose, cancha, fecha, hora }) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !cancha) return null;

  // ----------------------------
  // Normalización de estado
  // ----------------------------
  const estadoNormalizado = (() => {
    switch (cancha.estado) {
      case "disponible":
      case "libre":
        return "libre";
      case "ocupada":
      case "reservada":
      case "bloqueada":
        return "ocupada";
      default:
        return "ocupada";
    }
  })();

  const estadoConfig = {
    libre: {
      label: "Disponible",
      color: "text-green-400",
      border: "border-green-500/40",
      mensaje: "Esta cancha está disponible para reservar.",
    },
    ocupada: {
      label: "Ocupada",
      color: "text-red-400",
      border: "border-red-500/40",
      mensaje: "Esta cancha no está disponible en este horario.",
    },
  };

  const cfg = estadoConfig[estadoNormalizado];

  // ----------------------------
  // Fecha y hora (fuente segura)
  // ----------------------------
  const fechaRaw =
    (fecha ?? "").toString().trim() || (cancha.fecha ?? "").toString().trim();

  const horaRaw =
    (hora ?? "").toString().trim() || (cancha.hora ?? "").toString().trim();

  const obtenerFechaConDia = (fechaISO) => {
    if (!fechaISO) return "";

    const date = new Date(`${fechaISO}T00:00:00`);

    const diaSemana = date.toLocaleDateString("es-CL", {
      weekday: "long",
    });

    const fechaNumerica = date.toLocaleDateString("es-CL");

    return `${
      diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)
    } ${fechaNumerica}`;
  };

  const fechaTexto = obtenerFechaConDia(fechaRaw);
  const horaTexto = horaRaw;

  // ----------------------------
  // WhatsApp del recinto
  // ----------------------------
  const telefonoWhatsapp = (cancha.telefono_whatsapp || cancha.whatsapp || "")
    .toString()
    .replace(/\D/g, "");

  const mensajePlano = `Hola buenas, quiero reservar la ${cancha.cancha_nombre}
El día ${fechaTexto}
A la hora ${horaTexto}`;

  const whatsappUrl = `https://wa.me/${telefonoWhatsapp}?text=${encodeURIComponent(
    mensajePlano
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-xl border ${cfg.border} bg-[#0c2418] p-6 shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {cancha.cancha_nombre}
            </h2>

            {/* 🔹 ÚNICO CAMBIO: fecha y hora visibles */}
            <p className="text-sm text-white/70">
              {fechaTexto} · {horaTexto}
            </p>

            <p className={`text-sm font-semibold ${cfg.color}`}>
              {cfg.label}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Cancha visual */}
        <div className="relative mb-4 aspect-[16/9] rounded-lg bg-[#0f6b3a] border border-white/30 overflow-hidden">
          <div className="absolute inset-3 border border-white/70 rounded-sm" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/70" />

          <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />
          <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />

          <div className="absolute left-3 top-1/2 w-20 h-32 -translate-y-1/2 border border-white/70" />
          <div className="absolute right-3 top-1/2 w-20 h-32 -translate-y-1/2 border border-white/70" />

          <div className="absolute bottom-4 left-6 text-white/80 text-sm font-semibold">
            EQUIPO 1
          </div>
          <div className="absolute bottom-4 right-6 text-white/80 text-sm font-semibold">
            EQUIPO 2
          </div>
        </div>

        {/* Mensaje */}
        <p className="text-sm text-white/80 mb-4">{cfg.mensaje}</p>

        {/* Acción */}
        {estadoNormalizado === "libre" ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg font-semibold"
          >
            Reservar por WhatsApp
          </a>
        ) : (
          <button
            onClick={onClose}
            className="w-full bg-white/10 text-white py-2 rounded-lg"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
