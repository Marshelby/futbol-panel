import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import CronogramaDiaModal from "../components/cronograma/CronogramaDiaModal";

/* =========================
   UI ESTADOS
========================= */
const ESTADO_UI = {
  CERRADO: {
    label: "Cerrado",
    color: "bg-red-200 text-red-800",
    icon: "⛔",
  },
  HORARIO_ESPECIAL: {
    label: "Horario especial",
    color: "bg-yellow-200 text-yellow-800",
    icon: "⏰",
  },
};

/* =========================
   FECHAS
========================= */
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const VENTANA_MESES = 6;

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/* =========================
   COMPONENTE
========================= */
export default function Cronograma() {
  const { recinto } = useAuth();
  const recintoId = recinto?.id;

  const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
  const [windowStart, setWindowStart] = useState(startOfMonth(new Date()));
  const [cronogramasMes, setCronogramasMes] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [horariosBase, setHorariosBase] = useState([]);

  const panelDiaRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayWeekIndex =
    (new Date(year, month, 1).getDay() + 6) % 7;

  const mesesVisibles = useMemo(
    () => Array.from({ length: VENTANA_MESES }, (_, i) => addMonths(windowStart, i)),
    [windowStart]
  );

  /* =========================
     CARGA DB
  ========================= */
  async function cargarCronogramaMes() {
    if (!recintoId) return;

    const inicio = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const fin = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data } = await supabase
      .from("cronograma_total")
      .select("*")
      .eq("recinto_id", recintoId)
      .gte("fecha", inicio)
      .lte("fecha", fin);

    setCronogramasMes(data || []);
  }

  async function cargarHorariosBase() {
    if (!recintoId) return;

    const { data } = await supabase
      .from("horarios_base")
      .select("hora")
      .eq("recinto_id", recintoId)
      .order("hora");

    setHorariosBase(data || []);
  }

  useEffect(() => {
    cargarCronogramaMes();
    cargarHorariosBase();
    // eslint-disable-next-line
  }, [currentDate, recintoId]);

  const cronogramaDelDia = (fecha) =>
    cronogramasMes.find((d) => d.fecha === fecha) || null;

  /* =========================
     SCROLL AUTOMÁTICO
  ========================= */
  useEffect(() => {
    if (diaSeleccionado && panelDiaRef.current) {
      panelDiaRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [diaSeleccionado]);

  if (!recintoId) {
    return <div className="text-gray-500">Cargando recinto…</div>;
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">
            Cronograma del recinto
          </h1>
          <p className="text-gray-500">
            Cierres y horarios especiales
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWindowStart(addMonths(windowStart, -1))}
            className="px-2 py-1 border rounded hover:bg-gray-100"
          >
            ◀
          </button>

          <div className="flex gap-1">
            {mesesVisibles.map((m) => {
              const active =
                m.getMonth() === month && m.getFullYear() === year;

              return (
                <button
                  key={m.toISOString()}
                  onClick={() => setCurrentDate(startOfMonth(m))}
                  className={`px-3 py-1 rounded text-sm transition
                    ${active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                    }`}
                >
                  {MESES[m.getMonth()]} {m.getFullYear()}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setWindowStart(addMonths(windowStart, 1))}
            className="px-2 py-1 border rounded hover:bg-gray-100"
          >
            ▶
          </button>
        </div>
      </div>

      {/* DÍAS SEMANA */}
      <div className="grid grid-cols-7 mb-2 text-center text-sm font-semibold text-gray-600">
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* CALENDARIO */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: firstDayWeekIndex }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const fechaISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const item = cronogramaDelDia(fechaISO);

          let ui = null;
          if (item?.local_cerrado) ui = ESTADO_UI.CERRADO;
          else if (item?.horario_extra) ui = ESTADO_UI.HORARIO_ESPECIAL;

          return (
            <div
              key={fechaISO}
              onClick={() => setDiaSeleccionado(fechaISO)}
              className="cursor-pointer border rounded p-2 h-28 bg-white hover:bg-gray-50"
            >
              <div className="font-bold">{day}</div>

              {ui && (
                <span
                  className={`mt-2 inline-flex text-xs px-2 py-1 rounded ${ui.color}`}
                >
                  {ui.icon} {ui.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* INSITE DÍA */}
      {diaSeleccionado && (
        <div ref={panelDiaRef} className="mt-10">
          <CronogramaDiaModal
            fecha={diaSeleccionado}
            recintoId={recintoId}
            cronogramaInicial={cronogramaDelDia(diaSeleccionado)}
            horariosBase={horariosBase}
            onCancel={() => setDiaSeleccionado(null)}
            onSaved={async () => {
              await cargarCronogramaMes();
              setDiaSeleccionado(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
