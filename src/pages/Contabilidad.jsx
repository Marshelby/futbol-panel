import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

/* =========================
   FECHA LOCAL ÚNICA
   ========================= */
function getTodayLocal() {
  return new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD (hora local)
}

export default function Contabilidad() {
  const { recinto } = useAuth();
  const recintoId = recinto?.id;

  const hoy = getTodayLocal();

  const [fecha, setFecha] = useState(hoy);
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
    const [y, m] = fechaISO.split("-").map(Number);
    const inicio = new Date(y, m - 1, 1).toLocaleDateString("sv-SE");
    const fin = new Date(y, m, 0).toLocaleDateString("sv-SE");
    return { inicio, fin };
  }

  async function fetchAgendaYPagos({ tablaAgenda, tablaPagos, inicio, fin }) {
    const { data: agendas } = await supabase
      .from(tablaAgenda)
      .select("id, fecha, cancha_id, horario_id")
      .eq("recinto_id", recintoId)
      .gte("fecha", inicio)
      .lte("fecha", fin);

    if (!agendas?.length) return [];

    const agendaIds = agendas.map((a) => a.id);

    const { data: pagos } = await supabase
      .from(tablaPagos)
      .select("agenda_cancha_id, monto_total, monto_abonado, estado_pago")
      .in("agenda_cancha_id", agendaIds);

    if (!pagos?.length) return [];

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

    return pagos
      .filter((p) => agendaMap[p.agenda_cancha_id])
      .map((p) => ({
        ...p,
        agenda: agendaMap[p.agenda_cancha_id],
      }));
  }

  async function fetchData() {
    if (!recintoId) return;
    setLoading(true);

    const { inicio, fin } = modo === "dia" ? rangoDia(fecha) : rangoMes(fecha);
    let resultados = [];

    try {
      if (modo === "dia") {
        // ===== CAMBIO APLICADO =====
        // El modo DÍA ahora consulta SIEMPRE:
        // - agenda viva
        // - agenda histórica
        // y deduplica, mostrando el día seleccionado sin importar la fuente.
        const partes = [
          fetchAgendaYPagos({
            tablaAgenda: "agenda_canchas",
            tablaPagos: "pagos_reservas",
            inicio,
            fin,
          }),
          fetchAgendaYPagos({
            tablaAgenda: "agenda_canchas_historico",
            tablaPagos: "pagos_reservas_historico",
            inicio,
            fin,
          }),
        ];

        const res = await Promise.all(partes);
        const combinados = res.flat();

        const map = new Map();
        combinados.forEach((r) => {
          map.set(r.agenda.id, r);
        });

        resultados = Array.from(map.values());
      } else {
        // ===== MODO MES (ya existente) =====
        const partes = [];

        partes.push(
          fetchAgendaYPagos({
            tablaAgenda: "agenda_canchas_historico",
            tablaPagos: "pagos_reservas_historico",
            inicio,
            fin,
          })
        );

        partes.push(
          fetchAgendaYPagos({
            tablaAgenda: "agenda_canchas",
            tablaPagos: "pagos_reservas",
            inicio,
            fin,
          })
        );

        const res = await Promise.all(partes);
        const combinados = res.flat();

        const map = new Map();
        combinados.forEach((r) => {
          map.set(r.agenda.id, r);
        });

        resultados = Array.from(map.values());
      }

      resultados.sort(
        (a, b) =>
          a.agenda.fecha.localeCompare(b.agenda.fecha) ||
          String(a.agenda.hora || "").localeCompare(
            String(b.agenda.hora || "")
          )
      );

      setRegistros(resultados);
      calcularRanking(resultados);
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
                    key={`${r.agenda.id}-${i}`}
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
