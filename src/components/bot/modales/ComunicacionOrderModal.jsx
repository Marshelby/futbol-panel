const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

const YEARS = (() => {
  const current = new Date().getFullYear();
  return [current, current + 1, current + 2];
})();

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

export default function ComunicacionOrderModal({
  plantilla,
  valores,
  setValores,
}) {
  if (!plantilla?.variables) return null;

  return (
    <div className="space-y-6">
      {plantilla.variables.map((v) => {
        const value = valores[v.key] || "";

        /* =======================
           SELECT NORMAL
        ======================= */
        if (v.type === "select") {
          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label || v.key}
              </label>

              <select
                value={value}
                onChange={(e) =>
                  setValores({ ...valores, [v.key]: e.target.value })
                }
                className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
              >
                <option value="">Selecciona una opción</option>
                {v.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        /* =======================
           TIME (HH:MM)
        ======================= */
        if (v.type === "time") {
          const current = valores[v.key] || {};
          const { hour = "", minute = "" } = current;

          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label || v.key}
              </label>

              <div className="flex items-center gap-2">
                <select
                  value={hour}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [v.key]: { ...current, hour: e.target.value },
                    })
                  }
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
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [v.key]: { ...current, minute: e.target.value },
                    })
                  }
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
            </div>
          );
        }

        /* =======================
           DATE (AÑO / MES / DÍA)
        ======================= */
        if (v.type === "date") {
          const current = valores[v.key] || {};
          const { year = "", month = "", day = "" } = current;

          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label || v.key}
              </label>

              <div className="grid grid-cols-3 gap-3">
                {/* AÑO */}
                <select
                  value={year}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [v.key]: { ...current, year: e.target.value },
                    })
                  }
                  className="bg-[#020617] border border-blue-900 rounded-lg px-3 py-2"
                >
                  <option value="">Año</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                {/* MES */}
                <select
                  value={month}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [v.key]: { ...current, month: e.target.value },
                    })
                  }
                  className="bg-[#020617] border border-blue-900 rounded-lg px-3 py-2"
                >
                  <option value="">Mes</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                {/* DÍA */}
                <select
                  value={day}
                  onChange={(e) =>
                    setValores({
                      ...valores,
                      [v.key]: { ...current, day: e.target.value },
                    })
                  }
                  className="bg-[#020617] border border-blue-900 rounded-lg px-3 py-2"
                >
                  <option value="">Día</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        }

        /* =======================
           TEXTO
        ======================= */
        return (
          <div key={v.key}>
            <label className="block text-xs uppercase text-blue-400 mb-1">
              {v.label || v.key}
            </label>

            <input
              type="text"
              value={value}
              onChange={(e) =>
                setValores({ ...valores, [v.key]: e.target.value })
              }
              className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
            />
          </div>
        );
      })}
    </div>
  );
}
