export default function Dashboard() {
  return (
    <div>
      {/* Título */}
      <h1 className="text-2xl font-bold mb-1">Panel del recinto</h1>
      <p className="text-gray-500 mb-6">
        Estado general y control de canchas
      </p>

      {/* Resumen superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ResumenCard
          titulo="Canchas activas"
          valor="5"
          subtitulo="Total en el recinto"
        />
        <ResumenCard
          titulo="Bloques disponibles hoy"
          valor="12"
          subtitulo="Horas libres"
        />
        <ResumenCard
          titulo="Reservas activas"
          valor="8"
          subtitulo="Para hoy"
        />
      </div>

      {/* Estado general */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Estado operativo actual
          </h2>
          <span className="text-sm font-semibold text-green-600">
            ● En funcionamiento
          </span>
        </div>

        <p className="text-gray-600">
          El recinto está recibiendo reservas y mostrando disponibilidad
          pública en tiempo real.
        </p>
      </div>

      {/* Próximos bloques */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">
          Próximos bloques horarios
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BloqueHora hora="18:00" estado="Disponible" />
          <BloqueHora hora="19:00" estado="Ocupado" />
          <BloqueHora hora="20:00" estado="Disponible" />
          <BloqueHora hora="21:00" estado="Reservado" />
        </div>
      </div>
    </div>
  );
}

/* =======================
   COMPONENTES
   ======================= */

function ResumenCard({ titulo, valor, subtitulo }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-gray-500 text-sm mb-1">{titulo}</p>
      <p className="text-3xl font-bold">{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>
    </div>
  );
}

function BloqueHora({ hora, estado }) {
  const colores = {
    Disponible: "bg-green-100 text-green-700",
    Ocupado: "bg-red-100 text-red-700",
    Reservado: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div
      className={`rounded-lg p-4 text-center font-semibold ${
        colores[estado] || "bg-gray-100 text-gray-600"
      }`}
    >
      <p className="text-lg">{hora}</p>
      <p className="text-xs mt-1">{estado}</p>
    </div>
  );
}
