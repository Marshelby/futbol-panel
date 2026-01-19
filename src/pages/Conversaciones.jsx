export default function Conversaciones() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Conversaciones</h1>
      <p className="text-gray-500 mb-6">
        Historial de mensajes del chatbot
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <Mensaje
          autor="cliente"
          nombre="Juan Pérez"
          mensaje="Hola, ¿hay cancha disponible a las 20?"
          hora="19:32"
        />

        <Mensaje
          autor="bot"
          nombre="FutbolBot"
          mensaje="Sí 🙂 A las 20:00 hay 2 canchas disponibles. ¿Deseas reservar?"
          hora="19:32"
        />

        <Mensaje
          autor="cliente"
          nombre="Juan Pérez"
          mensaje="Sí, la cancha 2 por favor"
          hora="19:33"
        />

        <Mensaje
          autor="bot"
          nombre="FutbolBot"
          mensaje="Perfecto ⚽ He registrado tu solicitud. Te confirmaré en breve."
          hora="19:33"
        />
      </div>
    </div>
  );
}

/* ========================= */

function Mensaje({ autor, nombre, mensaje, hora }) {
  const esBot = autor === "bot";

  return (
    <div
      className={`flex ${
        esBot ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`max-w-lg px-4 py-3 rounded-xl text-sm ${
          esBot
            ? "bg-gray-100 text-gray-800"
            : "bg-blue-600 text-white"
        }`}
      >
        <div className="text-xs font-semibold opacity-70 mb-1">
          {nombre} · {hora}
        </div>
        <div>{mensaje}</div>
      </div>
    </div>
  );
}
