import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const PORCENTAJE_BARBERO = 50;
const PIN_ELIMINACION = "1234";
const CORTE_ESPECIAL_ID = "__especial__";

export default function RegistrarCorte() {
  const navigate = useNavigate();

  const [barberos, setBarberos] = useState([]);
  const [tiposCorte, setTiposCorte] = useState([]);
  const [cortesHoy, setCortesHoy] = useState([]);

  const [barberoId, setBarberoId] = useState("");
  const [tipoCorteId, setTipoCorteId] = useState("");
  const [precio, setPrecio] = useState(0);
  const [nota, setNota] = useState("");

  const [estadoBarbero, setEstadoBarbero] = useState(null);
  const [registrando, setRegistrando] = useState(false);

  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [corteEliminarId, setCorteEliminarId] = useState(null);

  const [editando, setEditando] = useState(null);
  const [editBarberoId, setEditBarberoId] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editPrecio, setEditPrecio] = useState(0);
  const [editNota, setEditNota] = useState("");

  useEffect(() => {
    cargarTodo();
  }, []);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        setEditando(null);
        setMostrarEliminar(false);
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  async function cargarTodo() {
    await Promise.all([
      cargarBarberos(),
      cargarTiposCorte(),
      cargarCortesHoy(),
    ]);
  }

  async function cargarBarberos() {
    const { data } = await supabase
      .from("barberos")
      .select("id,nombre")
      .order("nombre");
    setBarberos(data || []);
  }

  async function cargarTiposCorte() {
    const { data } = await supabase
      .from("tipos_corte")
      .select("id,nombre,precio")
      .eq("activo", true)
      .order("nombre");
    setTiposCorte(data || []);
  }

  async function cargarCortesHoy() {
    const hoy = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("cortes")
      .select(`
        id,
        barbero_id,
        created_at,
        precio,
        nota,
        monto_barbero,
        monto_barberia,
        barberos(nombre),
        tipos_corte(nombre,id)
      `)
      .gte("created_at", `${hoy}T00:00:00`)
      .lte("created_at", `${hoy}T23:59:59`)
      .order("created_at", { ascending: false });

    setCortesHoy(data || []);
  }

  async function verificarEstado(barbero_id) {
    if (!barbero_id) {
      setEstadoBarbero(null);
      return;
    }

    const { data } = await supabase
      .from("estado_actual")
      .select("estado")
      .eq("barbero_id", barbero_id)
      .single();

    setEstadoBarbero(data?.estado || null);
  }

  function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const resumen = useMemo(() => ({
    totalDia: cortesHoy.reduce((a, c) => a + c.precio, 0),
    totalBarberos: cortesHoy.reduce((a, c) => a + c.monto_barbero, 0),
    totalBarberia: cortesHoy.reduce((a, c) => a + c.monto_barberia, 0),
    cantidad: cortesHoy.length,
  }), [cortesHoy]);

  const bloqueado =
    estadoBarbero === "no_disponible" || estadoBarbero === "en_almuerzo";

  async function registrarCorte() {
    if (!barberoId || !tipoCorteId || bloqueado) return;

    setRegistrando(true);

    const montoBarbero = Math.round((precio * PORCENTAJE_BARBERO) / 100);
    const montoBarberia = precio - montoBarbero;

    await supabase.from("cortes").insert({
      barbero_id: barberoId,
      tipo_corte_id: tipoCorteId === CORTE_ESPECIAL_ID ? null : tipoCorteId,
      precio,
      porcentaje_barbero: PORCENTAJE_BARBERO,
      monto_barbero: montoBarbero,
      monto_barberia: montoBarberia,
      nota: tipoCorteId === CORTE_ESPECIAL_ID ? (nota || "Corte especial") : nota || null,
    });

    setBarberoId("");
    setTipoCorteId("");
    setPrecio(0);
    setNota("");
    setEstadoBarbero(null);
    setRegistrando(false);
    cargarCortesHoy();
  }

  function iniciarEdicion(c) {
    setEditando(c.id);
    setEditBarberoId(c.barbero_id);
    setEditTipo(c.tipos_corte?.id || CORTE_ESPECIAL_ID);
    setEditPrecio(c.precio);
    setEditNota(c.nota || "");
  }

  async function guardarEdicion() {
    const montoBarbero = Math.round((editPrecio * PORCENTAJE_BARBERO) / 100);
    const montoBarberia = editPrecio - montoBarbero;

    await supabase.from("cortes").update({
      barbero_id: editBarberoId,
      tipo_corte_id: editTipo === CORTE_ESPECIAL_ID ? null : editTipo,
      precio: editPrecio,
      monto_barbero: montoBarbero,
      monto_barberia: montoBarberia,
      nota: editTipo === CORTE_ESPECIAL_ID ? (editNota || "Corte especial") : editNota,
    }).eq("id", editando);

    setEditando(null);
    cargarCortesHoy();
  }

  function abrirEliminar(id) {
    setCorteEliminarId(id);
    setPinInput("");
    setMostrarEliminar(true);
  }

  async function confirmarEliminar() {
    if (pinInput !== PIN_ELIMINACION) {
      alert("PIN incorrecto");
      return;
    }
    await supabase.from("cortes").delete().eq("id", corteEliminarId);
    setMostrarEliminar(false);
    cargarCortesHoy();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* RESUMEN */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          ["Total día", resumen.totalDia],
          ["Total barberos", resumen.totalBarberos],
          ["Total barbería", resumen.totalBarberia],
          ["Cortes", resumen.cantidad],
        ].map(([t, v]) => (
          <div key={t} className="bg-white border border-black p-4 rounded">
            <div className="text-sm text-zinc-500">{t}</div>
            <div className="text-2xl font-bold">
              {t === "Cortes" ? v : `$${v.toLocaleString("es-CL")}`}
            </div>
          </div>
        ))}
      </div>

      {/* FORM + LISTADO LADO A LADO */}
      <div className="grid md:grid-cols-[360px_1fr] gap-6 items-start">

        {/* FORM REGISTRAR */}
        <div className="bg-white border border-black p-3 rounded">
          <h2 className="text-lg font-semibold mb-3">Registrar corte</h2>

          <select
            value={barberoId}
            onChange={(e) => {
              setBarberoId(e.target.value);
              verificarEstado(e.target.value);
            }}
            className="w-full border border-black p-2 rounded mb-2"
          >
            <option value="">Seleccionar barbero</option>
            {barberos.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>

          {bloqueado && (
            <div className="mb-2 text-sm text-orange-600 border border-orange-500 p-2 rounded">
              ⚠ El barbero no está disponible.
              <button
                onClick={() => navigate("/estado-diario")}
                className="underline ml-1"
              >
                Ir a Estado diario
              </button>
            </div>
          )}

          <select
            value={tipoCorteId}
            onChange={(e) => {
              const v = e.target.value;
              setTipoCorteId(v);
              if (v === CORTE_ESPECIAL_ID) {
                setPrecio(0);
              } else {
                const t = tiposCorte.find(x => x.id === v);
                setPrecio(t?.precio || 0);
              }
            }}
            className="w-full border border-black p-2 rounded mb-2"
          >
            <option value="">Seleccionar tipo de corte</option>
            {tiposCorte.map(t => (
              <option key={t.id} value={t.id}>
                {t.nombre} (${t.precio})
              </option>
            ))}
            <option value={CORTE_ESPECIAL_ID}>Corte especial</option>
          </select>

          <input
            type="number"
            value={precio}
            disabled={tipoCorteId !== CORTE_ESPECIAL_ID}
            onChange={(e) => setPrecio(Number(e.target.value))}
            className={`w-full border border-black p-2 rounded mb-2 ${
              tipoCorteId !== CORTE_ESPECIAL_ID ? "bg-gray-100" : ""
            }`}
          />

          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full border border-black p-2 rounded mb-3"
            placeholder="Nota (opcional)"
          />

          <button
            onClick={registrarCorte}
            disabled={registrando || bloqueado}
            className={`w-full py-2 rounded text-white ${
              bloqueado ? "bg-gray-400" : "bg-black"
            }`}
          >
            Registrar corte
          </button>
        </div>

        {/* LISTADO */}
        <div className="bg-white border border-black p-4 rounded">
          <h2 className="text-lg font-semibold pb-2 border-b border-black mb-4">
            Cortes de hoy
          </h2>

          {cortesHoy.map(c => (
            <div key={c.id} className="flex justify-between border-b border-black py-2">
              <div>
                <div className="font-medium">
                  {c.barberos.nombre} — {c.tipos_corte?.nombre || "Corte especial"}
                  <span className="text-sm text-zinc-500 ml-2">
                    · {formatearHora(c.created_at)}
                  </span>
                </div>
                <div className="text-sm text-zinc-600">
                  ${c.precio.toLocaleString("es-CL")}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <button onClick={() => iniciarEdicion(c)} className="underline">
                  Editar
                </button>
                <button onClick={() => abrirEliminar(c.id)} className="text-red-600 underline">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* MODALES (sin cambios) */}
      {/* … se mantienen exactamente iguales … */}

    </div>
  );
}
