const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);

const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

export default function HorariosFuncionamientoOrderModal({
  variable, // "hora_apertura" | "hora_cierre"
  plantilla,
  valores,
  setValores,
}) {
  // ⛔️ Modal tonto: NO valida existencia, NO decide nada
  const current = valores[variable] || {};
  const hour = current.hour || "";
  const minute = current.minute || "";

  const setHour = (h) => {
    setValores({
      ...valores,
      [variable]: {
        ...current,
        hour: h,
      },
    });
  };

  const setMinute = (m) => {
    setValores({
      ...valores,
      [variable]: {
        ...current,
        minute: m,
      },
    });
  };

  const isValid = Boolean(hour && minute);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-blue-400">
        {variable === "hora_apertura"
          ? "Hora de apertura *"
          : "Hora de cierre *"}
      </label>

      <div className="flex items-center gap-2">
        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="bg-[#020617] border border-blue-900 rounded-lg px-3 py-2"
        >
          <option value="">HH</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <span>:</span>

        <select
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="bg-[#020617] border border-blue-900 rounded-lg px-3 py-2"
        >
          <option value="">MM</option>
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {!isValid && (
        <p className="text-xs text-red-400">
          Debes seleccionar hora y minuto para continuar.
        </p>
      )}
    </div>
  );
}
