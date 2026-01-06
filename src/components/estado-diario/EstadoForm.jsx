import { useState } from "react"

export default function EstadoForm({ onAdd }) {
  const [barbero, setBarbero] = useState("")
  const [estado, setEstado] = useState("")
  const [mensaje, setMensaje] = useState("")

  function handleSubmit(e) {
    e.preventDefault()

    if (!barbero || !estado) return

    onAdd({
      id: Date.now(),
      barbero,
      estado,
      mensaje,
      hora: new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit"
      })
    })

    setBarbero("")
    setEstado("")
    setMensaje("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg p-4 shadow flex flex-col gap-4 max-w-xl"
    >
      <select
        value={barbero}
        onChange={(e) => setBarbero(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">Seleccionar barbero</option>
        <option>Miguel</option>
        <option>Juan</option>
        <option>Pedro</option>
      </select>

      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">Tipo de estado</option>
        <option>Activo</option>
        <option>Almuerzo</option>
        <option>Ausente</option>
        <option>Incidente</option>
      </select>

      <input
        type="text"
        placeholder="Mensaje opcional"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        className="border p-2 rounded"
      />

      <button className="bg-black text-white py-2 rounded hover:bg-zinc-800">
        Registrar estado
      </button>
    </form>
  )
}
