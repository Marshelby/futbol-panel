export default function BarberStatusBadge({ status }) {
  const styles = {
    activo: "bg-green-100 text-green-700",
    almuerzo: "bg-yellow-100 text-yellow-700",
    ausente: "bg-red-100 text-red-700",
  }

  const labels = {
    activo: "Activo",
    almuerzo: "Almuerzo",
    ausente: "Ausente",
  }

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] || "Desconocido"}
    </span>
  )
}
