export default function HorarioEspecialForm({
  value,
  onChange,
  horariosBase = [],
}) {
  const {
    haH = "",
    hcH = "",
  } = value || {};

  function setHora(key, val) {
    onChange({
      ...value,
      [key]: val,
    });
  }

  return (
    <div className="mb-5 bg-gray-50 p-4 rounded-lg">
      <p className="font-semibold mb-3">Horario especial</p>

      <div className="grid grid-cols-2 gap-4">
        {/* APERTURA */}
        <div>
          <p className="text-sm mb-1">Apertura</p>
          <select
            value={haH}
            onChange={(e) => setHora("haH", e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Seleccionar</option>
            {horariosBase.map((h) => {
              const hh = h.hora.slice(0, 2);
              return (
                <option key={h.hora} value={hh}>
                  {hh}:00
                </option>
              );
            })}
          </select>
        </div>

        {/* CIERRE */}
        <div>
          <p className="text-sm mb-1">Cierre</p>
          <select
            value={hcH}
            onChange={(e) => setHora("hcH", e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Seleccionar</option>
            {horariosBase.map((h) => {
              const hh = h.hora.slice(0, 2);
              return (
                <option key={h.hora} value={hh}>
                  {hh}:00
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-700">
        <span className="font-semibold">Horario:</span>{" "}
        {haH && hcH ? `${haH}:00 – ${hcH}:00` : "—"}
      </p>
    </div>
  );
}
