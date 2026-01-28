import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function BotOrderModal({
  plantilla,
  valores,
  setValores,
  onCancel,
  onConfirm,
  children,
}) {
  const { recinto } = useAuth();

  const autoCloseTimer = useRef(null);
  const isOpenRef = useRef(false);
  const handleCloseRef = useRef(null);

  const [sending, setSending] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  // 🟡 doble confirmación (high)
  const [requireSecondConfirm, setRequireSecondConfirm] = useState(false);

  // 🔴 PIN (critical)
  const [requirePin, setRequirePin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  /* ===============================
     CONTROL DE APERTURA
  =============================== */
  useEffect(() => {
    isOpenRef.current = Boolean(plantilla);

    if (plantilla) {
      setSending(false);
      setAnimateOut(false);
      setRequireSecondConfirm(false);
      setRequirePin(false);
      setPinInput("");
      setPinError(false);
      clearTimeout(autoCloseTimer.current);
    }
  }, [plantilla]);

  /* ===============================
     IMPORTANCE LEVEL
  =============================== */
  const importanceLevel = (plantilla?.importance_level || "normal").toLowerCase();
  const isHighImportance = importanceLevel === "high";
  const isCriticalImportance = importanceLevel === "critical";

  const needsDoubleConfirm =
    isHighImportance &&
    !isCriticalImportance &&
    (plantilla?.categoria === "Reservas" ||
     plantilla?.categoria === "Emergencias");

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
    if (sending) return;

    // 🔴 CRITICAL → SOLO PIN
    if (isCriticalImportance && !requirePin) {
      setRequirePin(true);
      return;
    }

    // 🟡 HIGH → doble confirmación
    if (needsDoubleConfirm && !requireSecondConfirm) {
      setRequireSecondConfirm(true);
      return;
    }

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
          <div className="text-lg font-bold">
            {plantilla.titulo}
          </div>
        </div>

        {/* AVISO POR IMPORTANCIA */}
        {(isHighImportance || isCriticalImportance) && (
          <div
            className={`rounded-xl p-4 text-sm border ${
              isCriticalImportance
                ? "bg-red-500/10 border-red-400 text-red-200"
                : "bg-amber-500/10 border-amber-400 text-amber-200"
            }`}
          >
            {isCriticalImportance ? (
              <>
                <strong>🚨 ACCIÓN CRÍTICA</strong>
                <div className="mt-1">
                  Esta acción enviará mensajes irreversibles a clientes.
                  <br />
                  Ejecuta esta orden <strong>solo si estás completamente seguro</strong>.
                </div>
              </>
            ) : (
              <>
                <strong>⚠️ IMPORTANTE</strong>
                <div className="mt-1">
                  Esta acción podrá reagendar una o más reservas y notificar a los clientes afectados, según corresponda a la orden seleccionada.
                </div>
              </>
            )}
          </div>
        )}

        {/* CONTENIDO DINÁMICO */}
        <div className="space-y-4">
          {children}
        </div>

        {/* 🟡 DOBLE CONFIRMACIÓN (HIGH) */}
        {requireSecondConfirm && (
          <div className="rounded-xl p-4 text-sm border bg-amber-500/10 border-amber-400 text-amber-200">
            <strong>⚠️ CONFIRMACIÓN REQUERIDA</strong>
            <p className="mt-2">
              ¿Estás seguro de ejecutar esta orden?
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRequireSecondConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500"
              >
                No
              </button>

              <button
                onClick={executeConfirm}
                className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-500"
              >
                Sí, ejecutar
              </button>
            </div>
          </div>
        )}

        {/* 🔴 PIN OBLIGATORIO (CRITICAL) */}
        {requirePin && (
          <div className="rounded-xl p-4 text-sm border bg-red-500/10 border-red-400 text-red-200">
            <strong>🔐 ACCIÓN CRÍTICA – INGRESA PIN</strong>

            <input
              type="password"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              className="mt-3 w-full bg-[#020617] border border-red-500 rounded-lg px-4 py-2 text-white"
              placeholder="PIN del recinto"
            />

            {pinError && (
              <p className="mt-2 text-xs text-red-400">
                PIN incorrecto.
              </p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRequirePin(false);
                  setPinInput("");
                }}
                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  if (!recinto?.pin_code || pinInput !== recinto.pin_code) {
                    setPinError(true);
                    return;
                  }
                  executeConfirm();
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500"
              >
                Confirmar con PIN
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        {!requireSecondConfirm && !requirePin && (
          <div className="flex justify-between items-center pt-4 border-t border-blue-900">
            <button
              onClick={handleClose}
              className="text-sm text-blue-300 hover:text-white"
            >
              Cancelar
            </button>

            <button
              onClick={handleConfirm}
              disabled={sending}
              className="px-6 py-2 rounded-lg font-extrabold
                bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
            >
              Enviar orden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
