const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

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

const YEARS = Array.from({ length: 5 }, (_, i) =>
  String(new Date().getFullYear() + i)
);

export default function ReservaOrderModal({
  plantilla,
  valores,
  setValores,
  canchas = [],
}) {
  if (!plantilla?.variables) return null;

  return (
    <div className="space-y-6">
      {plantilla.variables.map((v) => {
        const type = v.type === "cancha_id" ? "cancha" : v.type;

        /* ===============================
           FECHA (DÍA / MES / AÑO)
        =============================== */
        if (type === "date") {
          const current = valores[v.key] || {};
          const { day = "", month = "", year = "" } = current;

          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label} *
              </label>

              <div className="flex gap-2">
                <select
                  value={day}
                  onChange={(e) =>
                    setValores((prev) => ({
                      ...prev,
                      [v.key]: {
                        ...prev[v.key],
                        day: e.target.value,
                      },
                    }))
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

                <select
                  value={month}
                  onChange={(e) =>
                    setValores((prev) => ({
                      ...prev,
                      [v.key]: {
                        ...prev[v.key],
                        month: e.target.value,
                      },
                    }))
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

                <select
                  value={year}
                  onChange={(e) =>
                    setValores((prev) => ({
                      ...prev,
                      [v.key]: {
                        ...prev[v.key],
                        year: e.target.value,
                      },
                    }))
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
              </div>
            </div>
          );
        }

        /* ===============================
           HORA
        =============================== */
        if (type === "time") {
          const current = valores[v.key] || {};
          const { hour = "", minute = "" } = current;

          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label} *
              </label>

              <div className="flex items-center gap-2">
                <select
                  value={hour}
                  onChange={(e) =>
                    setValores((prev) => ({
                      ...prev,
                      [v.key]: {
                        ...prev[v.key],
                        hour: e.target.value,
                      },
                    }))
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
                    setValores((prev) => ({
                      ...prev,
                      [v.key]: {
                        ...prev[v.key],
                        minute: e.target.value,
                      },
                    }))
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

        /* ===============================
           CANCHA
        =============================== */
        if (type === "cancha") {
          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label} *
              </label>
              <select
                value={valores[v.key] || ""}
                onChange={(e) =>
                  setValores((prev) => ({
                    ...prev,
                    [v.key]: e.target.value,
                  }))
                }
                className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
              >
                <option value="">Selecciona la cancha</option>
                {canchas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        /* ===============================
           TEXTO (NUEVO)
        =============================== */
        if (type === "text") {
          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label} *
              </label>

              <input
                type="text"
                value={valores[v.key] || ""}
                onChange={(e) =>
                  setValores((prev) => ({
                    ...prev,
                    [v.key]: e.target.value,
                  }))
                }
                className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2 text-white"
                placeholder={v.label}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
