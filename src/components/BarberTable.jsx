import BarberStatusBadge from "./BarberStatusBadge"

export default function BarberTable({ barberos }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <table className="w-full text-left">
        <thead className="border-b bg-zinc-50">
          <tr>
            <th className="p-4">Nombre</th>
            <th className="p-4">Estado</th>
            <th className="p-4">Turno</th>
          </tr>
        </thead>

        <tbody>
          {barberos.map((barbero) => (
            <tr key={barbero.id} className="border-b last:border-none">
              <td className="p-4 font-medium">{barbero.nombre}</td>
              <td className="p-4">
                <BarberStatusBadge status={barbero.estado} />
              </td>
              <td className="p-4 text-zinc-600">
                {barbero.turno || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
