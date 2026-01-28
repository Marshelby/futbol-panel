import { format } from "date-fns";

const formatCLP = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n || 0);

export default function DetalleReservaLecturaModal({ data, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[420px] overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="font-black text-lg">Reserva pagada</div>
          <button onClick={onClose} className="text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm">

          <div className="font-bold text-gray-500">Datos de la reserva</div>

          <Fila label="Cliente" value={data.cliente} />
          <Fila label="Teléfono" value={data.telefono} />
          <Fila label="Fecha" value={data.fecha} />
          <Fila label="Hora" value={data.hora} />
          <Fila label="Cancha" value={data.cancha} />

          <hr />

          <div className="font-bold text-gray-500">Resumen de pago</div>

          <Fila label="Total" value={formatCLP(data.total)} />
          <Fila label="Abono" value={formatCLP(data.abonado)} />
          <Fila
            label="Saldo"
            value={formatCLP(data.saldo)}
            valueClass="text-green-600 font-bold"
          />
        </div>

        {/* Footer */}
        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Fila({ label, value, valueClass = "" }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="text-gray-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
