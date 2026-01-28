export default function EmergenciaOrderModal({
  plantilla,
  valores,
  setValores,
  canchas = [],
}) {
  if (!plantilla?.variables) return null;

  return (
    <div className="space-y-6">
      {plantilla.variables.map((v) => {
        const value = valores[v.key] || "";

        // CANCHA
        if (v.type === "cancha" || v.type === "cancha_id") {
          return (
            <div key={v.key}>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                {v.label || "Cancha"}
              </label>

              <select
                value={value}
                onChange={(e) =>
                  setValores({ ...valores, [v.key]: e.target.value })
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

        // SELECT
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

        // TEXTO (fallback)
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
