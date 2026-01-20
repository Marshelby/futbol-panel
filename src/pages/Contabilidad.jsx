import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function Contabilidad() {
  const { recinto } = useAuth();
  const recintoId = recinto?.id;

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [modo, setModo] = useState("dia");
  const [loading, setLoading] = useState(true);

  const [registros, setRegistros] = useState([]);
  const [rankingCanchas, setRankingCanchas] = useState([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [fecha, modo, recintoId]);

  function rangoDia(fechaISO) {
    return { inicio: fechaISO, fin: fechaISO };
  }

  function rangoMes(fechaISO) {
    const d = new Date(fechaISO);
    const y = d.getFullYear();
    const m = d.getMonth();
    return {
      inicio: new Date(y, m, 1).toISOString().slice(0, 10),
      fin: new Date(y, m + 1, 0).toISOString().slice(0, 10),
    };
  }

  async function fetchData() {
    if (!recintoId) return;
    setLoading(true);
    const { inicio, fin } = modo === "dia" ? rangoDia(fecha) : rangoMes(fecha);

    try {
      const { data: pagos } = await supabase
        .from("pagos_reservas")
        .select("id, agenda_cancha_id, monto_total, monto_abonado, estado_pago");

      if (!pagos?.length) {
        setRegistros([]);
        setRankingCanchas([]);
        setLoading(false);
        return;
      }

      const agendaIds = pagos.map((p) => p.agenda_cancha_id);

      const { data: agendas } = await supabase
        .from("agenda_canchas")
        .select("id, fecha, cancha_id, horario_id")
        .eq("recinto_id", recintoId)
        .in("id", agendaIds)
        .gte("fecha", inicio)
        .lte("fecha", fin);

      if (!agendas?.length) {
        setRegistros([]);
        setRankingCanchas([]);
        setLoading(false);
        return;
      }

      const horarioIds = [...new Set(agendas.map((a) => a.horario_id))];
      const { data: horarios } = await supabase
        .from("horarios_base")
        .select("id, hora")
        .in("id", horarioIds);

      const horariosMap = Object.fromEntries(
        (horarios || []).map((h) => [h.id, h.hora])
      );

      const canchaIds = [...new Set(agendas.map((a) => a.cancha_id))];
      const { data: canchas } = await supabase
        .from("canchas")
        .select("id, nombre")
        .in("id", canchaIds);

      const canchasMap = Object.fromEntries(
        (canchas || []).map((c) => [c.id, c.nombre])
      );

      const agendaMap = Object.fromEntries(
        agendas.map((a) => [
          a.id,
          {
            ...a,
            hora: horariosMap[a.horario_id],
            cancha_nombre: canchasMap[a.cancha_id] ?? "Cancha",
          },
        ])
      );

      const registrosFinales = pagos
        .filter((p) => agendaMap[p.agenda_cancha_id])
        .map((p) => ({
          ...p,
          agenda: agendaMap[p.agenda_cancha_id],
        }))
        .sort(
          (a, b) =>
            a.agenda.fecha.localeCompare(b.agenda.fecha) ||
            String(a.agenda.hora || "").localeCompare(
              String(b.agenda.hora || "")
            )
        );

      setRegistros(registrosFinales);
      calcularRanking(registrosFinales);
    } catch {
      setRegistros([]);
      setRankingCanchas([]);
    }

    setLoading(false);
  }

  const totales = useMemo(() => {
    let generado = 0;
    let abonado = 0;

    registros.forEach((r) => {
      generado += Number(r.monto_total || 0);
      abonado += Number(r.monto_abonado || 0);
    });

    return {
      generado,
      abonado,
      pendiente: generado - abonado,
    };
  }, [registros]);

  function calcularRanking(lista) {
    const acc = {};
    lista.forEach((r) => {
      const nombre = r.agenda.cancha_nombre;
      acc[nombre] = (acc[nombre] || 0) + Number(r.monto_total || 0);
    });

    setRankingCanchas(
      Object.entries(acc)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total)
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Contabilidad</h2>

      {/* FILTROS + RANKING */}
      <div className="flex flex-wrap gap-6 items-start">
        <Box>
          <label className="label">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input"
          />
        </Box>

        <Box>
          <p className="label mb-2">Vista</p>
          <div className="flex gap-2">
            <Toggle active={modo === "dia"} onClick={() => setModo("dia")}>
              Día
            </Toggle>
            <Toggle active={modo === "mes"} onClick={() => setModo("mes")}>
              Mes
            </Toggle>
          </div>
        </Box>

        {rankingCanchas.length > 0 && (
          <Box className="min-w-[260px]">
            {/* TÍTULO SUBRAYADO */}
            <p className="text-sm font-semibold pb-1 mb-2 border-b border-black">
              🏟️ Canchas del {modo}
            </p>

            <ul className="text-sm">
              {rankingCanchas.slice(0, 4).map((c, i) => (
                <li
                  key={c.nombre}
                  className={`flex justify-between py-1 border-b border-zinc-300 ${
                    i === 0 ? "font-semibold" : ""
                  }`}
                >
                  <span>
                    {i + 1}. {c.nombre}
                  </span>
                  <span>${c.total.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Box>
        )}
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          {/* TABLA */}
          <Box className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 border-b border-black">
                <tr>
                  <th className="th text-left">Fecha</th>
                  <th className="th text-left">Hora</th>
                  <th className="th text-left">Cancha</th>
                  <th className="th text-right">Total</th>
                  <th className="th text-right">Abonado</th>
                  <th className="th text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-zinc-300 ${
                      i % 2 === 0 ? "bg-white" : "bg-zinc-50"
                    }`}
                  >
                    <td className="td">{r.agenda.fecha}</td>
                    <td className="td">
                      {r.agenda.hora?.slice(0, 5) ?? "-"}
                    </td>
                    <td className="td">{r.agenda.cancha_nombre}</td>
                    <td className="td text-right">
                      ${r.monto_total.toLocaleString()}
                    </td>
                    <td className="td text-right">
                      ${r.monto_abonado.toLocaleString()}
                    </td>
                    <td className="td text-right">{r.estado_pago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* TOTALES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Total generado" value={totales.generado} />
            <Stat label="Total abonado" value={totales.abonado} />
            <Stat label="Pendiente" value={totales.pendiente} />
          </div>
        </>
      )}
    </div>
  );
}

/* ===== UI HELPERS ===== */
function Box({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-black rounded-lg p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function Toggle({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded border ${
        active
          ? "bg-black text-white border-black"
          : "bg-zinc-100 border-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-zinc-50 border border-black rounded-lg p-4">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="text-2xl font-semibold">
        ${Number(value || 0).toLocaleString()}
      </p>
    </div>
  );
}
