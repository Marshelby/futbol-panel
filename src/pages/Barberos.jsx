import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function estadoLabel(estado) {
  if (estado === "disponible") return "Disponible";
  if (estado === "en_almuerzo") return "En almuerzo";
  return "No disponible";
}

function estadoClass(estado) {
  if (estado === "disponible") return "bg-green-100 text-green-700 border-green-300";
  if (estado === "en_almuerzo") return "bg-yellow-100 text-yellow-700 border-yellow-300";
  return "bg-red-100 text-red-700 border-red-300";
}

export default function Barberos() {
  const [barberos, setBarberos] = useState([]);
  const [estados, setEstados] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [cortesHoy, setCortesHoy] = useState([]);

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setLoading(true);

    const { data: barberosData } = await supabase
      .from("barberos")
      .select("id, nombre")
      .order("nombre");

    const { data: estadosData } = await supabase
      .from("estado_actual")
      .select("barbero_id, estado, updated_at");

    const { data: cortesData } = await supabase
      .from("cortes")
      .select("barbero_id, created_at, monto_barbero");

    const estadosMap = {};
    estadosData?.forEach((e) => {
      estadosMap[e.barbero_id] = e;
    });

    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const statsMap = {};
    barberosData?.forEach((b) => {
      statsMap[b.id] = {
        total_hoy: 0,
        cortes_hoy: 0,
        ganancia_mes: 0,
        cortes_mes: 0,
      };
    });

    cortesData?.forEach((c) => {
      const fecha = new Date(c.created_at);
      const s = statsMap[c.barbero_id];
      if (!s) return;

      if (fecha >= inicioMes) {
        s.ganancia_mes += c.monto_barbero;
        s.cortes_mes += 1;
      }

      if (fecha >= inicioHoy) {
        s.total_hoy += c.monto_barbero;
        s.cortes_hoy += 1;
      }
    });

    setBarberos(barberosData || []);
    setEstados(estadosMap);
    setStats(statsMap);
    setLoading(false);
  }

  async function abrirModal(barbero) {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("cortes")
      .select("created_at, precio, monto_barbero")
      .eq("barbero_id", barbero.id)
      .gte("created_at", inicioHoy.toISOString())
      .order("created_at", { ascending: true });

    setBarberoSeleccionado(barbero);
    setCortesHoy(data || []);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setBarberoSeleccionado(null);
    setCortesHoy([]);
  }

  if (loading) return <p className="p-6">Cargando barberos…</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Barberos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {barberos.map((b) => {
          const estado = estados[b.id]?.estado ?? "no_disponible";
          const s = stats[b.id] || {};

          return (
            <div
              key={b.id}
              onClick={() => abrirModal(b)}
              className="border border-black rounded-xl p-5 bg-white cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">{b.nombre}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${estadoClass(
                    estado
                  )}`}
                >
                  {estadoLabel(estado)}
                </span>
              </div>

              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Ganancia mes</span>
                  <span className="font-semibold">${s.ganancia_mes}</span>
                </div>

                <div className="flex justify-between">
                  <span>Cortes mes</span>
                  <span className="font-semibold">{s.cortes_mes}</span>
                </div>

                <hr className="border-black/20 my-2" />

                <div className="text-xs font-semibold uppercase text-gray-500">
                  Hoy
                </div>

                <div className="flex justify-between">
                  <span>Total día</span>
                  <span className="font-semibold">${s.total_hoy}</span>
                </div>

                <div className="flex justify-between">
                  <span>Cortes hoy</span>
                  <span className="font-semibold">{s.cortes_hoy}</span>
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Click para ver detalle
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-black rounded-xl p-6 w-full max-w-md relative">
            <button
              onClick={cerrarModal}
              className="absolute top-2 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              Cortes de hoy — {barberoSeleccionado?.nombre}
            </h2>

            {cortesHoy.length === 0 ? (
              <p className="text-sm text-gray-500">No hay cortes hoy.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {cortesHoy.map((c, i) => (
                  <li key={i} className="border border-black/30 rounded p-2">
                    <p>
                      Hora:{" "}
                      {new Date(c.created_at).toLocaleTimeString("es-CL")}
                    </p>
                    <p>Precio: ${c.precio}</p>
                    <p>Ganancia barbero: ${c.monto_barbero}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
