import EstadoBadge from "./EstadoBadge"

export default function EstadoList({ eventos }) {
  return (
    <div className="bg-white rounded-lg shadow divide-y max-w-xl">
      {eventos.map((e) => (
        <div key={e.id} className="p-4 flex justify-between items-start">
          <div>
            <p className="font-semibold">{e.barbero}</p>
            <p className="text-sm text-zinc-600">{e.mensaje}</p>
            <p className="text-xs text-zinc-400">⏰ {e.hora}</p>
          </div>

          <EstadoBadge estado={e.estado} />
        </div>
      ))}
    </div>
  )
}
