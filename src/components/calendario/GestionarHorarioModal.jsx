import React, { useEffect } from "react";

export default function GestionarHorarioModal({
  visible,
  contexto,
  nombreCliente,
  setNombreCliente,
  telefono,
  setTelefono,
  abono,
  setAbono,
  errorNombre,
  errorTelefono,
  errorAbono,
  errorLiberarPagado,
  precioMaximo,
  onReservar,
  onBloquear,
  onLiberar,
  onCancelar,
}) {
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancelar();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onCancelar]);

  if (!visible) return null;

  const handleTelefonoChange = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, "").slice(0, 8);
    setTelefono(soloNumeros);
  };

  const telefonoValido = telefono.length === 8;

  const handleAbonoChange = (e) => {
    let valor = Number(e.target.value);
    if (precioMaximo !== null && valor > precioMaximo) {
      valor = precioMaximo;
    }
    setAbono(valor);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onCancelar}
    >
      <div
        className="bg-white p-6 rounded-xl w-80"
        onClick={(e) => e.stopPropagation()}
      >
        {contexto && (
          <div className="text-base font-bold text-gray-800 mb-3">
            {contexto.fecha} · {contexto.hora} · {contexto.cancha_nombre}
          </div>
        )}

        <h3 className="font-bold mb-3">Gestionar horario</h3>

        {/* Nombre */}
        <label className="block text-sm font-semibold text-black mb-1">
          Nombre del cliente *
        </label>
        <input
          className={`border w-full p-2 rounded ${
            errorNombre ? "border-red-500" : ""
          }`}
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
        />
        {errorNombre && (
          <p className="text-red-600 text-sm mt-1">
            * este campo es obligatorio
          </p>
        )}

        {/* Whatsapp */}
        <label className="block text-sm font-semibold text-black mt-3 mb-1">
          Whatsapp *
        </label>
        <div
          className={`flex items-center border rounded ${
            errorTelefono || !telefonoValido ? "border-red-500" : ""
          }`}
        >
          <span className="px-3 text-gray-600 select-none">+569</span>
          <input
            className="w-full p-2 outline-none"
            placeholder="________"
            value={telefono}
            onChange={handleTelefonoChange}
            inputMode="numeric"
          />
        </div>
        {(errorTelefono || !telefonoValido) && (
          <p className="text-red-600 text-sm mt-1">
            * este campo es obligatorio
          </p>
        )}

        {/* Abono */}
        <label className="block text-sm font-semibold text-black mt-3 mb-1">
          Abono
        </label>
        <input
          type="number"
          className={`border w-full my-1 p-2 rounded ${
            errorAbono ? "border-red-500" : ""
          }`}
          value={abono}
          min="0"
          max={precioMaximo ?? undefined}
          onChange={handleAbonoChange}
        />
        {precioMaximo !== null && (
          <p className="text-gray-500 text-xs">
            Máximo permitido: ${precioMaximo}
          </p>
        )}
        {errorAbono && (
          <p className="text-red-600 text-sm mt-1">
            El abono no puede superar el valor de la cancha
          </p>
        )}

        <div className="flex gap-2 mb-4 mt-4">
          <button
            className="flex-1 bg-green-600 text-white py-2 rounded disabled:opacity-50"
            disabled={!telefonoValido || errorAbono}
            onClick={onReservar}
          >
            Reservar
          </button>

          <button
            className="flex-1 bg-gray-600 text-white py-2 rounded"
            onClick={onBloquear}
          >
            Bloquear
          </button>
        </div>

        {errorLiberarPagado && (
          <p className="text-red-600 text-sm mt-2 text-center">
            Esta reserva está <strong>pagada</strong> y no puede modificarse
          </p>
        )}

        <button
          className="w-full border py-2 rounded mb-2"
          onClick={onLiberar}
        >
          Liberar
        </button>

        <button
          className="w-full text-sm text-gray-500"
          onClick={onCancelar}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
