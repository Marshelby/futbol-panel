import { useEffect, useRef, useState, useMemo } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const MONTHS = [
  { value: 1, label: "Enero", days: 31 },
  { value: 2, label: "Febrero", days: 28 },
  { value: 3, label: "Marzo", days: 31 },
  { value: 4, label: "Abril", days: 30 },
  { value: 5, label: "Mayo", days: 31 },
  { value: 6, label: "Junio", days: 30 },
  { value: 7, label: "Julio", days: 31 },
  { value: 8, label: "Agosto", days: 31 },
  { value: 9, label: "Septiembre", days: 30 },
  { value: 10, label: "Octubre", days: 31 },
  { value: 11, label: "Noviembre", days: 30 },
  { value: 12, label: "Diciembre", days: 31 },
];

export default function BotOrderModal({
  plantilla,
  valores,
  setValores,
  canchas = [],
  onCancel,
  onConfirm,
}) {
  const autoCloseTimer = useRef(null);
  const [sending, setSending] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const isOpenRef = useRef(false);
  const handleCloseRef = useRef(null);

  /* ===============================
     CONTROL DE APERTURA MODAL
  =============================== */
  useEffect(() => {
    isOpenRef.current = Boolean(plantilla);

    if (plantilla) {
      setSending(false);
      setAnimateOut(false);
      setShowFinalConfirm(false);
      clearTimeout(autoCloseTimer.current);
    }
  }, [plantilla]);

  /* ===============================
     HELPERS
  =============================== */
  const isCanchaVar = (v) =>
    v?.type === "cancha" || v?.key === "cancha_id" || v?.key === "cancha";

  const isMensajeMasivoReservas =
    plantilla?.codigo === "MENSAJE_MASIVO_RESERVAS";

  /* ===============================
     VALIDACIONES
  =============================== */
  const timeFields = useMemo(() => {
    return plantilla?.variables?.filter((v) => v.type === "time") || [];
  }, [plantilla]);

  const canchaField = useMemo(() => {
    return plantilla?.variables?.find((v) => isCanchaVar(v));
  }, [plantilla]);

  const selectFields = useMemo(() => {
    return plantilla?.variables?.filter((v) => v.type === "select") || [];
  }, [plantilla]);

  const missingTimeKeys = useMemo(() => {
    return timeFields
      .filter((v) => !v.optional && !valores[v.key])
      .map((v) => v.key);
  }, [timeFields, valores]);

  const hasMissingRequiredTime = missingTimeKeys.length > 0;
  const isMissingCancha = Boolean(canchaField && !valores[canchaField.key]);

  const isCierreInmediato = plantilla?.codigo === "CIERRE_INMEDIATO";

  const isMissingMotivo = useMemo(() => {
    if (selectFields.length === 0) return false;
    if (isCierreInmediato) {
      return selectFields.some((v) => !valores[v.key]);
    }
    const first = selectFields[0];
    return Boolean(first && !valores[first.key]);
  }, [selectFields, valores, isCierreInmediato]);

  const invalidTimeOrder = useMemo(() => {
    if (timeFields.length < 2) return false;
    const [openKey, closeKey] = timeFields.map((v) => v.key);
    const open = valores[openKey];
    const close = valores[closeKey];
    if (!open || !close) return false;
    return open >= close;
  }, [timeFields, valores]);

  /* ===============================
     VALIDACIÓN DÍA / MES
  =============================== */
  const selectedMonth = MONTHS.find(
    (m) => m.value === Number(valores.mes)
  );

  const daysInMonth = selectedMonth?.days || 31;

  const isMissingDayMonth =
    isMensajeMasivoReservas && (!valores.dia || !valores.mes);

  /* ===============================
     HANDLERS
  =============================== */
  const handleClose = () => {
    if (animateOut) return;
    setAnimateOut(true);
    clearTimeout(autoCloseTimer.current);
    setTimeout(onCancel, 180);
  };

  useEffect(() => {
    handleCloseRef.current = handleClose;
  });

  const executeConfirm = async () => {
    setSending(true);
    try {
      await onConfirm();
      setAnimateOut(true);
      setTimeout(onCancel, 220);
    } catch (err) {
      console.error("Error enviando orden:", err);
      setSending(false);
    }
  };

  const handleConfirm = () => {
    if (
      sending ||
      hasMissingRequiredTime ||
      invalidTimeOrder ||
      isMissingCancha ||
      isMissingMotivo ||
      isMissingDayMonth
    )
      return;

    executeConfirm();
  };

  /* ===============================
     ESC
  =============================== */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (!isOpenRef.current) return;
      handleCloseRef.current?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!plantilla) return null;

  /* ===============================
     RENDER
  =============================== */
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
      bg-black/70 backdrop-blur-sm transition-opacity duration-200
      ${animateOut ? "opacity-0" : "opacity-100"}`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl bg-[#0F172A]
        border border-blue-800 rounded-2xl
        p-6 space-y-6 text-white
        shadow-2xl max-h-[90vh] overflow-y-auto
        transition-all duration-200
        ${animateOut ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
      >
        {/* HEADER */}
        <div>
          <h3 className="text-2xl font-extrabold">
            Orden operativa al chatbot
          </h3>
          <p className="text-sm text-blue-300">
            Esta instrucción será ejecutada inmediatamente por el sistema
          </p>
        </div>

        {/* ORDEN */}
        <div className="bg-[#020617] border border-blue-900 rounded-xl p-4">
          <div className="text-xs uppercase text-blue-400 mb-1">
            Orden seleccionada
          </div>
          <div className="text-lg font-bold">{plantilla.titulo}</div>
        </div>

        {/* EXPLICACIÓN MENSAJE MASIVO RESERVAS */}
        {isMensajeMasivoReservas && (
          <div className="bg-blue-500/10 border border-blue-400 rounded-xl p-4 text-sm text-blue-200">
            <strong>ℹ️ Importante:</strong>  
            Esta orden envía un mensaje a todas las reservas del día que
            selecciones. Debes indicar el día y el mes. El bot se comunicará
            automáticamente con todas las personas que tengan reservas en esa
            fecha.
          </div>
        )}

        {/* DÍA / MES */}
        {isMensajeMasivoReservas && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                Día
              </label>
              <select
                value={valores.dia || ""}
                onChange={(e) =>
                  setValores({ ...valores, dia: e.target.value })
                }
                className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
              >
                <option value="">Día</option>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-blue-400 mb-1">
                Mes
              </label>
              <select
                value={valores.mes || ""}
                onChange={(e) =>
                  setValores({ ...valores, mes: e.target.value, dia: null })
                }
                className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
              >
                <option value="">Mes</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {isMissingDayMonth && (
              <p className="col-span-2 text-xs text-red-400">
                Debes seleccionar día y mes.
              </p>
            )}
          </div>
        )}

        {/* VARIABLES EXISTENTES */}
        <div className="space-y-4">
          {plantilla.variables?.map((v, idx) => {
            if (
  isMensajeMasivoReservas &&
  (v.key === "fecha_objetivo" || v.key === "dia" || v.key === "mes")
) {
  return null;
}


            const canchaLike = isCanchaVar(v);
            const isMissingTime =
              v.type === "time" && missingTimeKeys.includes(v.key);
            const isClosingTimeError =
              v.type === "time" && idx === 1 && invalidTimeOrder;

            const value = valores[v.key] || "00:00";
            const [h, m] = value.split(":");

            return (
              <div key={v.key}>
                <label className="block text-xs uppercase text-blue-400 mb-1">
                  {v.label || v.key.replace("_", " ")}
                </label>

                {canchaLike ? (
                  <select
                    value={valores[v.key] || ""}
                    onChange={(e) =>
                      setValores({
                        ...valores,
                        [v.key]: e.target.value || null,
                      })
                    }
                    className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
                  >
                    <option value="">SELECCIONA LA CANCHA</option>
                    {canchas.map((cancha) => (
                      <option key={cancha.id} value={cancha.id}>
                        {cancha.nombre}
                      </option>
                    ))}
                  </select>
                ) : v.type === "select" ? (
                  <select
                    value={valores[v.key] || ""}
                    onChange={(e) =>
                      setValores({ ...valores, [v.key]: e.target.value })
                    }
                    className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
                  >
                    <option value="">Selecciona una opción</option>
                    {v.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : v.type === "time" ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={h}
                      onChange={(e) =>
                        setValores({
                          ...valores,
                          [v.key]: `${e.target.value}:${m}`,
                        })
                      }
                      className="bg-[#020617] border border-blue-900 rounded-lg px-3 py-2"
                    >
                      {HOURS.map((hh) => (
                        <option key={hh} value={hh}>
                          {hh}
                        </option>
                      ))}
                    </select>
                    <span>:</span>
                    <select
                      value={m}
                      onChange={(e) =>
                        setValores({
                          ...valores,
                          [v.key]: `${h}:${e.target.value}`,
                        })
                      }
                      className="bg-[#020617] border border-blue-900 rounded-lg px-3 py-2"
                    >
                      {MINUTES.map((mm) => (
                        <option key={mm} value={mm}>
                          {mm}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={valores[v.key] || ""}
                    onChange={(e) =>
                      setValores({ ...valores, [v.key]: e.target.value })
                    }
                    className="w-full bg-[#020617] border border-blue-900 rounded-lg px-4 py-2"
                  />
                )}

                {v.type === "select" && isMissingMotivo && (
                  <p className="mt-1 text-xs text-red-400">
                    Este campo es obligatorio.
                  </p>
                )}

                {isMissingTime && (
                  <p className="mt-1 text-xs text-red-400">
                    Este campo es obligatorio.
                  </p>
                )}

                {isClosingTimeError && (
                  <p className="mt-1 text-xs text-red-400">
                    La hora final debe ser posterior a la inicial.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4 border-t border-blue-900">
          <button
            onClick={handleClose}
            className="text-sm text-blue-300 hover:text-white"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={
              sending ||
              hasMissingRequiredTime ||
              invalidTimeOrder ||
              isMissingCancha ||
              isMissingMotivo ||
              isMissingDayMonth
            }
            className="px-6 py-2 rounded-lg font-extrabold bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
          >
            Enviar orden
          </button>
        </div>
      </div>
    </div>
  );
}
