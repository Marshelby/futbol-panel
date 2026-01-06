import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [estadoResumen, setEstadoResumen] = useState({
    disponible: [],
    en_almuerzo: [],
    no_disponible: [],
  });

  const [ranking, setRanking] = useState([]);
  const [graficoPorBarbero, setGraficoPorBarbero] = useState([]);
  const [barberoDelMes, setBarberoDelMes] = useState(null);

  const [ingresosDia, setIngresosDia] = useState(0);
  const [ingresosMes, setIngresosMes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadoActual();
    cargarDashboard();
  }, []);

  /* =======================
     ESTADO ACTUAL BARBEROS
     ======================= */
  async function cargarEstadoActual() {
    const { data, error } = await supabase
      .from("estado_actual")
      .select(`
        estado,
        barberos:barbero_id ( nombre )
      `);

    if (error) {
      console.error("Error estado_actual:", error);
      return;
    }

    const agrupado = {
      disponible: [],
      en_almuerzo: [],
      no_disponible: [],
    };

    (data || []).forEach((row) => {
      const estado = row.estado;
      const nombre = row.barberos?.nombre;
      if (!estado || !nombre) return;
      if (agrupado[estado]) agrupado[estado].push(nombre);
    });

    setEstadoResumen(agrupado);
  }

  /* =======================
     INGRESOS Y GRÁFICOS
     ======================= */
  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  async function cargarDashboard() {
    setLoading(true);

    const ahora = new Date();
    const inicioDia = startOfDay(ahora);
    const finDia = endOfDay(ahora);
    const inicioMes = startOfMonth(ahora);
    const finMes = endOfMonth(ahora);

    const { data, error } = await supabase
      .from("cortes")
      .select(`
        precio,
        created_at,
        barberos:barbero_id ( nombre )
      `)
      .gte("created_at", inicioMes.toISOString())
      .lte("created_at", finMes.toISOString());

    if (error) {
      console.error("Error dashboard:", error);
      setLoading(false);
      return;
    }

    let totalDia = 0;
    let totalMes = 0;
    const acumulado = {};

    (data || []).forEach((c) => {
      const precio = Number(c.precio || 0);
      const nombre = c.barberos?.nombre || "Sin nombre";
      const fecha = new Date(c.created_at);

      totalMes += precio;
      if (fecha >= inicioDia && fecha <= finDia) totalDia += precio;

      if (!acumulado[nombre]) {
        acumulado[nombre] = { nombre, total: 0, cortes: 0 };
      }

      acumulado[nombre].total += precio;
      acumulado[nombre].cortes += 1;
    });

    const rankingOrdenado = Object.values(acumulado).sort(
      (a, b) => b.total - a.total
    );

    setIngresosDia(totalDia);
    setIngresosMes(totalMes);
    setRanking(rankingOrdenado);
    setGraficoPorBarbero(
      rankingOrdenado.map((b) => ({ nombre: b.nombre, total: b.total }))
    );
    setBarberoDelMes(rankingOrdenado[0] || null);
    setLoading(false);
  }

  /* =======================
     RENDER
     ======================= */
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Inicio</h1>
      <p className="text-gray-500 mb-6">Resumen general de la barbería</p>

      {/* ===== ESTADO ACTUAL ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <EstadoCard
          titulo="Disponible"
          color="green"
          lista={estadoResumen.disponible}
        />
        <EstadoCard
          titulo="En almuerzo"
          color="yellow"
          lista={estadoResumen.en_almuerzo}
        />
        <EstadoCard
          titulo="No disponible"
          color="red"
          lista={estadoResumen.no_disponible}
        />
      </div>

      {/* ===== INGRESOS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-3xl">
        <InfoCard titulo="💰 Ingresos del día" valor={ingresosDia} />
        <InfoCard titulo="📆 Ingresos del mes" valor={ingresosMes} />
      </div>

      {/* ===== GRÁFICO ===== */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">
          📊 Ingresos por barbero (mes actual)
        </h2>

        {!loading && graficoPorBarbero.length > 0 && (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={graficoPorBarbero}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* =======================
   COMPONENTES SIMPLES
   ======================= */
function EstadoCard({ titulo, color, lista }) {
  const colores = {
    green: "border-green-400 bg-green-50 text-green-700",
    yellow: "border-yellow-400 bg-yellow-50 text-yellow-700",
    red: "border-red-400 bg-red-50 text-red-700",
  };

  return (
    <div className={`border rounded-lg p-4 ${colores[color]}`}>
      <h3 className="font-semibold mb-2">{titulo}</h3>
      {lista.length === 0 ? (
        <p className="text-sm text-gray-500">Ninguno</p>
      ) : (
        lista.map((n) => (
          <p key={n} className="font-medium">{n}</p>
        ))
      )}
    </div>
  );
}

function InfoCard({ titulo, valor }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className="text-gray-500 text-sm mb-1">{titulo}</p>
      <p className="text-2xl font-bold">${valor.toLocaleString()}</p>
    </div>
  );
}
