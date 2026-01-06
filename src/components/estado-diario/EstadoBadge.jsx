const colores = {
  Activo: "bg-green-100 text-green-700",
  Almuerzo: "bg-yellow-100 text-yellow-700",
  Ausente: "bg-red-100 text-red-700",
  Incidente: "bg-purple-100 text-purple-700"
}

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${colores[estado]}`}
    >
      {estado}
    </span>
  )
}
