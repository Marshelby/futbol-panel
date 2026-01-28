import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import HorarioEspecialForm from "./HorarioEspecialForm";
import ConfirmarHorarioEspecialModal from "./ConfirmarHorarioEspecialModal";

/* =========================
   ESTADOS
========================= */
const ESTADOS = {
  NORMAL: "NORMAL",
  CERRADO: "CERRADO",
  HORARIO_ESPECIAL: "HORARIO_ESPECIAL",
};

const ESTADO_LABEL = {
  NORMAL: "Normal",
  CERRADO: "Cierre total",
  HORARIO_ESPECIAL: "Horario especial",
};

const ESTADO_DESC = {
  NORMAL: "Día normal según horarios base",
  CERRADO: "El recinto permanece cerrado todo el día",
  HORARIO_ESPECIAL: "Horario distinto al habitual",
};

const ESTADO_UI = {
  NORMAL: {
    card: "border-gray-300 bg-gray-50 text-gray-700",
    active: "border-gray-400 bg-gray-100",
    badge: "bg-gray-200 text-gray-700",
    insite: "bg-white border-gray-200",
    primaryBtn: "bg-gray-700 text-white hover:bg-gray-800",
  },
  CERRADO: {
    card: "border-red-200 bg-red-50 text-red-700",
    active: "border-red-600 bg-red-100",
    badge: "bg-red-600 text-white",
    insite: "bg-red-50 border-red-200",
    primaryBtn: "bg-red-600 text-white hover:bg-red-700",
  },
  HORARIO_ESPECIAL: {
    card: "border-yellow-200 bg-yellow-50 text-yellow-800",
    active: "border-yellow-500 bg-yellow-100",
    badge: "bg-yellow-400 text-black",
    insite: "bg-yellow-50 border-yellow-200",
    primaryBtn: "bg-yellow-400 text-black hover:bg-yellow-500",
  },
};

/* =========================
   HELPERS
========================= */
function formatFecha(fecha) {
  const d = new Date(fecha + "T00:00:00");
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function timeToMinutes(h, m) {
  if (!h || !m) return null;
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function hhmm(h, m) {
  if (!h || !m) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* =========================
   COMPONENTE
========================= */
export default function CronogramaDiaModal({
  fecha,
  recintoId,
  cronogramaInicial,
  horariosBase,
  onCancel,
  onSaved,
}) {
  const insiteRef = useRef(null);
const normalRef = useRef(null);
const cerradoRef = useRef(null);
const horarioEspecialRef = useRef(null);

  // Solo consideramos "existe cronograma" si realmente es un estado no-normal
  const existeCronograma = useMemo(() => {
    if (!cronogramaInicial) return false;
    return !!(cronogramaInicial.local_cerrado || cronogramaInicial.horario_extra);
  }, [cronogramaInicial]);

  const [estado, setEstado] = useState(ESTADOS.NORMAL);
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorHorario, setErrorHorario] = useState("");
  const [errorRPC, setErrorRPC] = useState("");

  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  // ✅ NUEVO: doble confirmación SOLO para horario especial al guardar
  const [confirmarGuardarHorarioEspecial, setConfirmarGuardarHorarioEspecial] =
    useState(false);

  const [horarioEspecial, setHorarioEspecial] = useState({
    haH: "",
    haM: "",
    hcH: "",
    hcM: "",
  });

useEffect(() => {
  if (!estado) return;

  let ref = null;

  if (estado === ESTADOS.NORMAL) ref = normalRef;
  if (estado === ESTADOS.CERRADO) ref = cerradoRef;
  if (estado === ESTADOS.HORARIO_ESPECIAL) ref = horarioEspecialRef;

  if (ref?.current) {
    ref.current.scrollIntoView({
      behavior: "smooth",
       block: estado === ESTADOS.CERRADO ? "center" : "start",
    });
  }
}, [estado]);

  /* =========================
     INIT desde cronogramaInicial
  ========================= */
  useEffect(() => {
    setConfirmarBorrado(false);
    setConfirmarGuardarHorarioEspecial(false); // ✅ reset confirmación
    setErrorRPC("");

    if (!cronogramaInicial) {
      // Crear nuevo: parte normal
      setEstado(ESTADOS.NORMAL);
      setMotivo("");
      setHorarioEspecial({ haH: "", haM: "", hcH: "", hcM: "" });
      return;
    }

    if (cronogramaInicial.local_cerrado) {
      setEstado(ESTADOS.CERRADO);
    } else if (cronogramaInicial.horario_extra) {
      setEstado(ESTADOS.HORARIO_ESPECIAL);

      if (cronogramaInicial.hora_apertura && cronogramaInicial.hora_cierre) {
        const [haH, haM] = String(cronogramaInicial.hora_apertura)
          .slice(0, 5)
          .split(":");
        const [hcH, hcM] = String(cronogramaInicial.hora_cierre)
          .slice(0, 5)
          .split(":");
        setHorarioEspecial({ haH, haM, hcH, hcM });
      } else {
        setHorarioEspecial({ haH: "", haM: "", hcH: "", hcM: "" });
      }
    } else {
      setEstado(ESTADOS.NORMAL);
    }

    setMotivo(cronogramaInicial.motivo || "");
  }, [cronogramaInicial]);

  // ✅ Si cambia el estado manualmente, reseteamos confirmación de guardado
  useEffect(() => {
    setConfirmarGuardarHorarioEspecial(false);
  }, [estado]);

  /* =========================
     SCROLL a insite SOLO si existe cronograma (no-normal)
  ========================= */
  useEffect(() => {
    if (!existeCronograma) return;
    if (!insiteRef.current) return;

    insiteRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [existeCronograma, fecha]);

  /* =========================
     VALIDACIÓN horario especial SOLO al CREAR
  ========================= */
  useEffect(() => {
    setErrorHorario("");

    if (existeCronograma) return; // no se edita
    if (estado !== ESTADOS.HORARIO_ESPECIAL) return;

    const { haH, hcH } = horarioEspecial;

if (!haH || !hcH) {
  setErrorHorario("Debes definir hora de apertura y cierre.");
  return;
}

if (Number(hcH) <= Number(haH)) {
  setErrorHorario("La hora de cierre debe ser posterior a la hora de apertura.");
}
  }, [horarioEspecial, estado, existeCronograma]);

  const ui = ESTADO_UI[estado];

  /* =========================
     GUARDAR SOLO si NO existe cronograma y estado != NORMAL
     ✅ ahora con doble confirmación para HORARIO_ESPECIAL
  ========================= */
  async function handleGuardar(force = false) {
    if (!recintoId || !fecha) return;
    if (existeCronograma) return; // no editar
    if (estado === ESTADOS.NORMAL) return; // normal no registra nada
    if (errorHorario) return;

    // ✅ Gate de confirmación: solo para horario especial y solo la primera vez
    if (
      estado === ESTADOS.HORARIO_ESPECIAL &&
      !force &&
      !confirmarGuardarHorarioEspecial
    ) {
      setConfirmarGuardarHorarioEspecial(true);
      return;
    }

    setLoading(true);
    setErrorRPC("");

    const { error } = await supabase.rpc("rpc_set_cronograma_dia", {
      p_recinto_id: recintoId,
      p_fecha: fecha,
      p_local_cerrado: estado === ESTADOS.CERRADO,
      p_horario_extra: estado === ESTADOS.HORARIO_ESPECIAL,
      p_hora_apertura:
        estado === ESTADOS.HORARIO_ESPECIAL
          ? `${hhmm(horarioEspecial.haH, horarioEspecial.haM)}`
          : null,
      p_hora_cierre:
        estado === ESTADOS.HORARIO_ESPECIAL
          ? `${hhmm(horarioEspecial.hcH, horarioEspecial.hcM)}`
          : null,
      p_motivo: motivo.trim() || null,
    });

    setLoading(false);

    if (error) {
      setErrorRPC(error.message || "No se pudo guardar el cronograma.");
      return;
    }

    onSaved?.();
  }

  /* =========================
     BORRAR (solo si existe)
  ========================= */
  async function handleBorrar() {
    if (!recintoId || !fecha) return;

    setLoading(true);
    setErrorRPC("");

    const { error } = await supabase
      .from("cronograma_total")
      .delete()
      .eq("recinto_id", recintoId)
      .eq("fecha", fecha);

    setLoading(false);

    if (error) {
      setErrorRPC(error.message || "No se pudo borrar el cronograma.");
      return;
    }

    setConfirmarBorrado(false);
    onSaved?.();
  }

  /* =========================
     TEXTO PLANO DEL CRONOGRAMA (cuando existe)
  ========================= */
  const textoPlano = useMemo(() => {
    if (!existeCronograma) return "";

    if (cronogramaInicial?.local_cerrado) {
      return "Cierre total del recinto.";
    }

    if (cronogramaInicial?.horario_extra) {
      const ha = String(cronogramaInicial?.hora_apertura || "").slice(0, 5);
      const hc = String(cronogramaInicial?.hora_cierre || "").slice(0, 5);

      if (ha && hc) {
        return `Horario especial: Abierto desde las ${ha} a las ${hc} horas.`;
      }

      return "Horario especial definido.";
    }

    return "";
  }, [existeCronograma, cronogramaInicial]);

  return (
    <>
    <div ref={insiteRef} className={`rounded-xl border p-6 ${ui.insite}`}>
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold capitalize">{formatFecha(fecha)}</h2>
          <p className="text-sm text-gray-500">
            {existeCronograma ? "Estado del día" : "Crear cronograma"}
          </p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ui.badge}`}>
          {ESTADO_LABEL[estado]}
        </span>
      </div>

      {/* =========================
          MODO EXISTE: SOLO TEXTO + BORRAR
      ========================= */}
      {existeCronograma ? (
        <div className="mt-6 space-y-4">
          <div className="text-sm">
            <p className="font-semibold mb-1">Cronograma del día:</p>
            <p className="whitespace-pre-wrap">{textoPlano}</p>

            {cronogramaInicial?.motivo && (
              <>
                <p className="font-semibold mt-4 mb-1">Motivo:</p>
                <p className="whitespace-pre-wrap">{cronogramaInicial.motivo}</p>
              </>
            )}
          </div>

          {errorRPC && <p className="text-sm text-red-700 font-semibold">⚠️ {errorRPC}</p>}

          <div className="pt-4 border-t flex items-center justify-between gap-3">
            {!confirmarBorrado ? (
              <button
                onClick={() => setConfirmarBorrado(true)}
                className="text-sm text-red-700 hover:underline"
              >
                🗑️ Borrar cronograma
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">¿Deseas borrar este cronograma?</span>
                <button
                  onClick={() => setConfirmarBorrado(false)}
                  className="px-3 py-1 border rounded"
                  disabled={loading}
                >
                  No
                </button>
                <button
                  onClick={handleBorrar}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                  disabled={loading}
                >
                  Sí, borrar
                </button>
              </div>
            )}

            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-white/60"
              disabled={loading}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        /* =========================
            MODO CREAR: SELECTOR + (form si corresponde) + GUARDAR
        ========================= */
        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm font-semibold mb-2">¿Qué deseas configurar?</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.values(ESTADOS).map((e) => {
                const cfg = ESTADO_UI[e];
                const active = estado === e;

                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEstado(e)}
                    className={`
                      border rounded-lg p-3 text-left cursor-pointer
                      transition-all hover:-translate-y-0.5 hover:shadow-md
                      ${active ? cfg.active : cfg.card}
                    `}
                  >
                    <p className="font-semibold text-sm">{ESTADO_LABEL[e]}</p>
                    <p className="text-xs opacity-80 mt-1">{ESTADO_DESC[e]}</p>
                  </button>
                );
              })}
            </div>

            {estado === ESTADOS.NORMAL && (
              <p className="text-xs text-gray-500 mt-2">
                Para registrar un cambio, elige <b>Cierre total</b> o{" "}
                <b>Horario especial</b>.
              </p>
            )}
          </div>

          {estado === ESTADOS.HORARIO_ESPECIAL && (
  <div ref={horarioEspecialRef}>
    <HorarioEspecialForm
      value={horarioEspecial}
      onChange={setHorarioEspecial}
      horariosBase={horariosBase}
    />

    {errorHorario && (
      <p className="text-sm text-red-700 font-semibold">⚠️ {errorHorario}</p>
    )}
  </div>
)}

{estado === ESTADOS.CERRADO && (
  <div ref={cerradoRef}>
    <p className="text-sm text-red-700 font-semibold text-center">
      El recinto permanecerá cerrado todo el día.
    </p>
  </div>
)}
          {estado !== ESTADOS.NORMAL && (
            <div>
              <label className="text-sm font-semibold block mb-1">
                Motivo <span className="text-gray-400">(opcional)</span>
              </label>

              <textarea
                value={motivo}
                maxLength={30}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                className="w-full border rounded-md p-2 text-sm bg-white"
              />

              <div className="text-xs text-gray-500 text-right mt-1">
                {motivo.length}/30
              </div>
            </div>
          )}

          {errorRPC && <p className="text-sm text-red-700 font-semibold">⚠️ {errorRPC}</p>}

          <div className="pt-4 border-t flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cerrar
            </button>

            <button
              onClick={() => handleGuardar(false)}
              disabled={loading || estado === ESTADOS.NORMAL || !!errorHorario}
              className={`px-4 py-2 rounded font-semibold transition ${ui.primaryBtn} disabled:opacity-50`}
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
<ConfirmarHorarioEspecialModal
  open={confirmarGuardarHorarioEspecial}
  loading={loading}
  onCancel={() => setConfirmarGuardarHorarioEspecial(false)}
  onConfirm={() => handleGuardar(true)}
/>

</>

  );
}
