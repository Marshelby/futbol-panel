export default function ConfirmarHorarioEspecialModal({
  open,
  loading,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
        <h3 className="text-lg font-bold text-yellow-700 mb-2">
          ⚠️ Confirmación requerida
        </h3>

        <p className="text-sm text-gray-700">
          Has modificado el horario de este día.  
          Te recomendamos revisar las reservas para evitar dejar clientes esperando.
        </p>

        <p className="text-sm text-gray-700 mt-2">
          Si existen reservas, puedes reprogramarlas desde el <b>Chat Bot</b>.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded font-semibold bg-yellow-400 text-black hover:bg-yellow-500"
          >
            Confirmar y guardar
          </button>
        </div>
      </div>
    </div>
  );
}
