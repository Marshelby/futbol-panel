import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Contabilidad() {
  const [fecha, setFecha] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [modo, setModo] = useState("dia");
  const [barberoFiltro, setBarberoFiltro] = useState("todos");

  const [cortes, setCortes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [topBarberos, setTopBarberos] = useState([]);
  const [resumenBarberos, setResumenBarberos] = useState([]);

  useEffect(() => {
    fetchCortes();
    // eslint-disable-next-line
  }, [fecha, modo]);

  /* =========================
     FECHAS
  ========================= */
  function getRango() {
    if (modo === "dia") {
      return {
        inicio: `${fecha}T00:00:00`,
        fin: `${fecha}T23:59:59`,
      };
    }

    const f = new Date(fecha);
    const year = f.getFullYear();
    const month = String(f.getMonth() + 1).padStart(2, "0");

    return {
      inicio: `${year}-${month}-01T00:00:00`,
      fin: `${year}-${month}-31T23:59:59`,
    };
  }

  /* =========================
     DATA
  ========================= */
  async function fetchCortes() {
    setLoading(true);

    const { inicio, fin } = getRango();

    const { data, error } = await supabase
      .from("cortes")
      .select(`
        id,
        precio,
        monto_barbero,
        monto_barberia,
        created_at,
        barberos:barbero_id (
          nombre
        )
      `)
      .gte("created_at", inicio)
      .lte("created_at", fin)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error contabilidad:", error);
      setCortes([]);
      setTopBarberos([]);
      setResumenBarberos([]);
    } else {
      const lista = data || [];
      setCortes(lista);
      recalcular(lista);
    }

    setLoading(false);
  }

  /* =========================
     FILTRO
  ========================= */
  const cortesFiltrados = useMemo(() => {
    if (barberoFiltro === "todos") return cortes;
    return cortes.filter(
      (c) => c.barberos?.nombre === barberoFiltro
    );
  }, [cortes, barberoFiltro]);

  /* =========================
     CÁLCULOS
  ========================= */
  function recalcular(lista) {
    calcularTopBarberos(lista);
    calcularResumenBarberos(lista);
  }

  function calcularTopBarberos(lista) {
    const acc = {};
    lista.forEach((c) => {
      const nombre = c.barberos?.nombre || "Sin nombre";
      const precio = Number(c.precio || 0);
      if (!acc[nombre]) acc[nombre] = { nombre, total: 0 };
      acc[nombre].total += precio;
    });

    setTopBarberos(
      Object.values(acc).sort((a, b) => b.total - a.total).slice(0, 3)
    );
  }

  function calcularResumenBarberos(lista) {
    const acc = {};
    lista.forEach((c) => {
      const nombre = c.barberos?.nombre || "Sin nombre";
      if (!acc[nombre]) {
        acc[nombre] = { nombre, cortes: 0, ganado: 0, generado: 0 };
      }
      acc[nombre].cortes += 1;
      acc[nombre].ganado += Number(c.monto_barbero || 0);
      acc[nombre].generado += Number(c.precio || 0);
    });

    setResumenBarberos(
      Object.values(acc).sort((a, b) => b.ganado - a.ganado)
    );
  }

  const barberosDisponibles = useMemo(() => {
    const set = new Set();
    cortes.forEach((c) => c.barberos?.nombre && set.add(c.barberos.nombre));
    return Array.from(set).sort();
  }, [cortes]);

  const totalIngresos = useMemo(
    () => cortesFiltrados.reduce((a, c) => a + (c.precio || 0), 0),
    [cortesFiltrados]
  );
  const totalBarberos = useMemo(
    () => cortesFiltrados.reduce((a, c) => a + (c.monto_barbero || 0), 0),
    [cortesFiltrados]
  );
  const totalLocal = useMemo(
    () => cortesFiltrados.reduce((a, c) => a + (c.monto_barberia || 0), 0),
    [cortesFiltrados]
  );

  /* =========================
     UI
  ========================= */
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Contabilidad</h2>

      {/* CONTROLES */}
      <div className="flex flex-wrap gap-6 items-start">
        {/* Fecha */}
        <Box>
          <label className="label">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="input"
          />
        </Box>

        {/* Vista */}
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

        {/* Barbero */}
        <Box>
          <label className="label">Barbero</label>
          <select
            value={barberoFiltro}
            onChange={(e) => setBarberoFiltro(e.target.value)}
            className="input"
          >
            <option value="todos">Todos</option>
            {barberosDisponibles.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Box>

        {/* Top */}
        {barberoFiltro === "todos" && topBarberos.length > 0 && (
          <Box className="border-zinc-400">
            <p className="text-sm mb-2">🏆 Barberos del {modo}</p>
            <ul className="text-sm space-y-1">
              {topBarberos.map((b, i) => (
                <li key={b.nombre} className={i === 0 ? "font-semibold" : ""}>
                  {i + 1}. {b.nombre} — ${b.total.toLocaleString()}
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
          <div className="bg-white border border-black rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 border-b border-black">
                <tr>
                  <th className="th text-left">Hora</th>
                  <th className="th text-left">Barbero</th>
                  <th className="th text-right">Precio</th>
                  <th className="th text-right">Barbero</th>
                  <th className="th text-right">Local</th>
                </tr>
              </thead>
              <tbody>
                {cortesFiltrados.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-t border-zinc-300 ${
                      i % 2 === 0 ? "bg-white" : "bg-zinc-50"
                    }`}
                  >
                    <td className="td">
                      {new Date(c.created_at).toLocaleString("es-CL")}
                    </td>
                    <td className="td">{c.barberos?.nombre}</td>
                    <td className="td text-right">${c.precio}</td>
                    <td className="td text-right">${c.monto_barbero}</td>
                    <td className="td text-right">${c.monto_barberia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Total ingresos" value={totalIngresos} />
            <Stat label="Total barberos" value={totalBarberos} />
            <Stat label="Total local" value={totalLocal} />
          </div>

          {/* RESUMEN */}
          {barberoFiltro === "todos" && (
            <div className="bg-white border border-black rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-4">
                ✂️ Cortes por barbero
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resumenBarberos.map((b) => (
                  <div
                    key={b.nombre}
                    className="border border-black rounded-lg p-4 bg-zinc-50"
                  >
                    <p className="font-semibold text-lg">{b.nombre}</p>
                    <p>Cortes: <strong>{b.cortes}</strong></p>
                    <p>Ganó: <strong>${b.ganado.toLocaleString()}</strong></p>
                    <p>Generó: <strong>${b.generado.toLocaleString()}</strong></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* =========================
   COMPONENTES UI
========================= */
function Box({ children, className = "" }) {
  return (
    <div className={`bg-white border border-black rounded-lg p-4 ${className}`}>
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

/* =========================
   CLASES REUTILIZABLES
========================= */
// th → "px-4 py-2 font-semibold"
// td → "px-4 py-2"
// label → "text-sm text-zinc-600 block mb-1"
// input → "border border-black rounded px-2 py-1 w-full"
