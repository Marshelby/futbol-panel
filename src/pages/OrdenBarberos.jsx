import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"
import { Link } from "react-router-dom"

export default function OrdenBarberos() {
  const [barberos, setBarberos] = useState([])
  const [estados, setEstados] = useState({})
  const [ordenIds, setOrdenIds] = useState([])
  const [indiceActual, setIndiceActual] = useState(0)
  const [historial, setHistorial] = useState([null, null])

  const [showConfirmColacion, setShowConfirmColacion] = useState(false)
  const [showConsejoSi, setShowConsejoSi] = useState(false)
  const [showConsejoNo, setShowConsejoNo] = useState(false)

  // =========================
  // CARGA INICIAL
  // =========================
  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    const { data: barberosData } = await supabase
      .from("barberos")
      .select("id, nombre")
      .order("nombre")

    const ids = barberosData.map((b) => b.id)

    const { data: estadosData } = await supabase
      .from("estado_actual")
      .select("barbero_id, estado")
      .in("barbero_id", ids)

    const mapEstados = {}
    estadosData.forEach((e) => {
      mapEstados[e.barbero_id] = e.estado
    })

    setBarberos(barberosData)
    setEstados(mapEstados)
    setOrdenIds(ids)
  }

  // =========================
  // BARBEROS ACTIVOS
  // =========================
  const activos = useMemo(() => {
    return ordenIds
      .map((id) => {
        const b = barberos.find((x) => x.id === id)
        if (!b) return null
        return {
          ...b,
          estado: estados[id] || "no_disponible",
        }
      })
      .filter(
        (b) =>
          b &&
          (b.estado === "disponible" || b.estado === "en_almuerzo")
      )
  }, [ordenIds, barberos, estados])

  const turnoActual = activos[indiceActual]
  const siguiente = activos[(indiceActual + 1) % activos.length]
  const luego = activos[(indiceActual + 2) % activos.length]

  // =========================
  // DETECTAR COLACIÓN
  // =========================
  useEffect(() => {
    if (!turnoActual) return
    if (turnoActual.estado !== "en_almuerzo") return

    const t = setTimeout(() => {
      setShowConfirmColacion(true)
    }, 500)

    return () => clearTimeout(t)
  }, [turnoActual])

  // =========================
  // RESPUESTAS COLACIÓN
  // =========================
  const sigueEnColacion = () => {
    setShowConfirmColacion(false)

    setShowConsejoSi(true)
    setTimeout(() => setShowConsejoSi(false), 8000)

    setHistorial((prev) => {
      const next = [...prev.slice(-1), turnoActual]
      while (next.length < 2) next.unshift(null)
      return next
    })

    setIndiceActual((i) => (i + 1) % activos.length)
  }

  const yaNoEstaEnColacion = async () => {
    setShowConfirmColacion(false)

    await supabase
      .from("estado_actual")
      .update({
        estado: "disponible",
        hora_vuelve: null,
        updated_at: new Date().toISOString(),
      })
      .eq("barbero_id", turnoActual.id)

    setShowConsejoNo(true)
    setTimeout(() => setShowConsejoNo(false), 10000)

    cargarTodo()
  }

  // =========================
  // ATENDIÓ
  // =========================
  const handleAtendio = () => {
    if (!turnoActual || showConfirmColacion) return

    setHistorial((prev) => {
      const next = [...prev.slice(-1), turnoActual]
      while (next.length < 2) next.unshift(null)
      return next
    })

    setIndiceActual((i) => (i + 1) % activos.length)
  }

  const moveInOrder = (id, dir) => {
    setOrdenIds((prev) => {
      const idx = prev.indexOf(id)
      const next = dir === "up" ? idx - 1 : idx + 1
      if (idx < 0 || next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
  }

  const estadoLabel = (estado) => {
    if (estado === "disponible")
      return { text: "Disponible", cls: "text-green-700" }
    if (estado === "en_almuerzo")
      return { text: "En colación", cls: "text-orange-600" }
    return { text: "No disponible", cls: "text-red-700" }
  }

  const MiniCard = ({ title, name }) => (
    <div className="w-[140px] h-[80px] border border-zinc-400 bg-white flex items-center justify-center text-center">
      <div>
        <div className="text-[11px] text-zinc-500">{title}</div>
        <div className="text-sm font-medium text-zinc-800">
          {name || "—"}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-5 relative">
      <h1 className="text-xl font-semibold mb-5">
        Orden de barberos
      </h1>

      {/* MODAL COLACIÓN */}
      {showConfirmColacion && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white border border-zinc-400 p-6 w-[380px] text-center">
            <h2 className="text-lg font-semibold mb-4 text-orange-600">
              Barbero en colación
            </h2>
            <p className="text-sm mb-6">
              ¿Sigue <b>{turnoActual.nombre}</b> en colación?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={sigueEnColacion}
                className="px-5 py-2 border border-zinc-400 text-sm"
              >
                Sí
              </button>
              <button
                onClick={yaNoEstaEnColacion}
                className="px-5 py-2 bg-green-700 text-white text-sm"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENSAJE SI */}
      {showConsejoSi && (
        <div className="flex justify-center mb-4">
          <div className="bg-zinc-800 text-white text-xl px-8 py-4 border border-zinc-600 text-center">
            Si marcaste "Sí" por error, puedes corregirlo dando la vuelta completa.
          </div>
        </div>
      )}

      {/* MENSAJE NO */}
      {showConsejoNo && (
        <div className="flex justify-center mb-4">
          <div className="bg-red-800 text-white text-2xl px-10 py-5 border border-red-600 text-center font-semibold">
            Si marcaste "No" por error, debes corregirlo en "Estado diario", es IMPORTANTE.
          </div>
        </div>
      )}

      {/* FLUJO */}
      <div className="flex justify-center items-center gap-6 mb-6">
        <div className="flex gap-3">
          <MiniCard title="Ya atendió" name={historial[0]?.nombre} />
          <MiniCard title="Ya atendió" name={historial[1]?.nombre} />
        </div>

        <div className="w-[280px] h-[180px] border border-zinc-400 bg-white flex flex-col items-center justify-center">
          <div className="text-xs text-zinc-500 mb-1">
            Turno actual
          </div>
          <div className="text-3xl font-bold text-green-700 mb-3">
            {turnoActual?.nombre || "—"}
          </div>
          <button
            onClick={handleAtendio}
            disabled={showConfirmColacion}
            className="px-6 py-2 bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            Atendió
          </button>
        </div>

        <div className="flex gap-3">
          <MiniCard title="Siguiente" name={siguiente?.nombre} />
          <MiniCard title="Luego" name={luego?.nombre} />
        </div>
      </div>

      {/* ORDEN */}
      <div className="flex justify-center gap-6">
        <div className="w-[620px] border border-zinc-400 bg-white p-4">
          <h2 className="text-base font-semibold mb-3">
            Configurar orden
          </h2>

          <div className="flex flex-col gap-2">
            {activos.map((b, idx) => {
              const st = estadoLabel(b.estado)
              return (
                <div
                  key={b.id}
                  className="h-[48px] border border-zinc-400 flex items-center justify-between px-3"
                >
                  <div className="text-sm font-medium">
                    {idx + 1}. {b.nombre}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${st.cls}`}>
                      {st.text}
                    </span>
                    <button
                      onClick={() => moveInOrder(b.id, "up")}
                      disabled={idx === 0}
                      className="w-8 h-8 border border-zinc-400 text-sm disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveInOrder(b.id, "down")}
                      disabled={idx === activos.length - 1}
                      className="w-8 h-8 border border-zinc-400 text-sm disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* NO DISPONIBLES */}
        <div className="w-[480px] border border-zinc-400 bg-white p-4">
          <h2 className="text-base font-semibold text-red-700 mb-1">
            Barberos no disponibles{" "}
            <span className="text-sm font-normal text-zinc-600">
              (Para añadir o quitar un barbero debes ir a{" "}
              <Link
                to="/estado-diario"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Estado diario
              </Link>
              )
            </span>
          </h2>

          {barberos
            .filter((b) => estados[b.id] === "no_disponible")
            .map((b) => (
              <div
                key={b.id}
                className="h-[44px] border border-zinc-400 flex items-center px-3 text-sm"
              >
                {b.nombre}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
