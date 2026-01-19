import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Contabilidad() {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [modo, setModo] = useState("dia");
  const [loading, setLoading] = useState(true);

  const [registros, setRegistros] = useState([]);
  const [rankingCanchas, setRankingCanchas] = useState([]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [fecha, modo]);

  /* =========================
     RANGOS DE FECHA
  ========================= */
  function rangoDia(fechaISO) {
    return { inicio: fechaISO, fin: fechaISO };
  }

  function rangoMes(fechaISO) {
    const d = new Date(fechaISO);
    const y = d.getFullYear();
    const m = d.getMonth();
    const inicio = new Date(y, m, 1).toISOString().slice(0, 10);
    const fin = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    return { inicio, fin };
  }

  /* =========================
     FETCH PRINCIPAL
  ========================= */
  async function fetchData() {
    setLoading(true);

    const { inicio, fin } = modo === "dia" ? rangoDia(fecha) : rangoMes(fecha);

    try {
      /* 1️⃣ PAGOS */
      const { data: pagos, error: pagosError } = await supabase
        .from("pagos_reservas")
        .select("id, agenda_cancha_id, monto_total, monto_abonado, estado_pago");

      if (pagosError) throw pagosError;

      if (!pagos || pagos.length === 0) {
        setRegistros([]);
        setRankingCanchas([]);
        setLoading(false);
        return;
      }

      /* 2️⃣ AGENDAS */
      const agendaIds = pagos.map((p) => p.agenda_cancha_id);

      const { data: agendas, error: agendaError } = await supabase
        .from("agenda_canchas")
        .select("id, fecha, cancha_id, horario_id")
        .in("id", agendaIds)
        .gte("fecha", inicio)
        .lte("fecha", fin);

      if (agendaError) throw agendaError;

      if (!agendas || agendas.length === 0) {
        setRegistros([]);
        setRankingCanchas([]);
        setLoading(false);
        return;
      }

      /* 3️⃣ HORARIOS */
      const horarioIds = Array.from(
        new Set(agendas.map((a) => a.horario_id).filter(Boolean))
      );

      let horariosMap = {};
      if (horarioIds.length > 0) {
        const { data: horarios, error: horariosError } = await supabase
          .from("horarios_base")
          .select("id, hora")
          .in("id", horarioIds);

        if (horariosError) throw horariosError;

        horariosMap = horarios.reduce((acc, h) => {
          acc[h.id] = h.hora;
          return acc;
        }, {});
      }

      /* 4️⃣ CANCHAS (NOMBRE REAL) */
      const canchaIds = Array.from(
        new Set(agendas.map((a) => a.cancha_id).filter(Boolean))
      );

      let canchasMap = {};
      if (canchaIds.length > 0) {
        const { data: canchas, error: canchasError } = await supabase
          .from("canchas")
          .select("id, nombre")
          .in("id", canchaIds);

        if (canchasError) throw canchasError;

        canchasMap = canchas.reduce((acc, c) => {
          acc[c.id] = c.nombre;
          return acc;
        }, {});
      }

      /* 5️⃣ MAP AGENDAS */
      const agendaMap = agendas.reduce((acc, a) => {
        acc[a.id] = {
          ...a,
          hora: horariosMap[a.horario_id] ?? null,
          cancha_nombre: canchasMap[a.cancha_id] ?? "Cancha",
        };
        return acc;
      }, {});

      /* 6️⃣ MERGE FINAL */
      const registrosFinales = pagos
        .filter((p) => agendaMap[p.agenda_cancha_id])
        .map((p) => ({
          ...p,
          agenda: agendaMap[p.agenda_cancha_id],
        }))
        .sort((a, b) => {
          if (a.agenda.fecha !== b.agenda.fecha) {
            return a.agenda.fecha.localeCompare(b.agenda.fecha);
          }
          return String(a.agenda.hora || "").localeCompare(
            String(b.agenda.hora || "")
          );
        });

      setRegistros(registrosFinales);
      calcularRanking(registrosFinales);
    } catch (err) {
      console.error("Error contabilidad:", err);
      setRegistros([]);
      setRankingCanchas([]);
    }

    setLoading(false);
  }

  /* =========================
     TOTALES
  ========================= */
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

  /* =========================
     RANKING
  ========================= */
  function calcularRanking(lista) {
    const acc = {};

    lista.forEach((r) => {
      const nombre = r.agenda?.cancha_nombre ?? "Cancha";
      if (!acc[nombre]) acc[nombre] = { nombre, total: 0 };
      acc[nombre].total += Number(r.monto_total || 0);
    });

    setRankingCanchas(
      Object.values(acc).sort((a, b) => b.total - a.total)
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Contabilidad</h2>

      <div className="flex gap-6 items-end">
        <div>
          <label className="label">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <p className="label mb-2">Vista</p>
          <div className="flex gap-2">
            <Toggle active={modo === "dia"} onClick={() => setModo("dia")}>
              Día
            </Toggle>
            <Toggle active={modo === "mes"} onClick={() => setModo("mes")}>
              Mes
            </Toggle>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Total generado" value={totales.generado} />
            <Stat label="Total abonado" value={totales.abonado} />
            <Stat label="Pendiente" value={totales.pendiente} />
          </div>

          <div className="bg-white border border-black rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 border-b border-black">
                <tr>
                  <th className="th">Fecha</th>
                  <th className="th">Hora</th>
                  <th className="th">Cancha</th>
                  <th className="th text-right">Total</th>
                  <th className="th text-right">Abonado</th>
                  <th className="th text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="td">{r.agenda.fecha}</td>
                    <td className="td">
                      {r.agenda.hora?.slice(0, 5) ?? "-"}
                    </td>
                    <td className="td">{r.agenda.cancha_nombre}</td>
                    <td className="td text-right">
                      ${Number(r.monto_total).toLocaleString()}
                    </td>
                    <td className="td text-right">
                      ${Number(r.monto_abonado).toLocaleString()}
                    </td>
                    <td className="td text-right">{r.estado_pago}</td>
                  </tr>
                ))}

                {registros.length === 0 && (
                  <tr>
                    <td className="td" colSpan={6}>
                      No hay registros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-black rounded-lg p-5">
            <h3 className="font-semibold mb-3">🏟️ Ranking de canchas</h3>
            <ul className="space-y-1 text-sm">
              {rankingCanchas.map((c, i) => (
                <li key={c.nombre}>
                  {i + 1}. {c.nombre} — $
                  {Number(c.total).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================
   UI HELPERS
========================= */
function Toggle({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded border ${
        active ? "bg-black text-white" : "bg-zinc-100"
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
