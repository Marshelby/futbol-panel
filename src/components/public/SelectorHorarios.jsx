export default function SelectorHorarios({
  horarios = [],
  selectedId,
  onChange,
  loading,
}) {
  if (loading) {
    return (
      <div className="py-4 text-center text-sm opacity-70">
        Cargando horarios…
      </div>
    );
  }

  if (!horarios.length) {
    return (
      <div className="py-4 text-center text-sm opacity-70">
        No hay horarios disponibles
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto py-3 px-1">
      {horarios.map((horario) => {
        const isActive = horario.id === selectedId;

        return (
          <button
            key={horario.id}
            onClick={() => onChange(horario.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              transition
              ${
                isActive
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }
            `}
          >
            {horario.hora}
          </button>
        );
      })}
    </div>
  );
}
