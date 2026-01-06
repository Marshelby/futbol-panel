import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

export default function SelectBarberia() {
  const { user, setBarberiaId } = useAuth()
  const [barberias, setBarberias] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("barberias")
        .select("*")
        .eq("owner_id", user.id)

      if (data.length === 1) {
        setBarberiaId(data[0].id)
        navigate("/dashboard")
      } else {
        setBarberias(data)
      }
    }
    load()
  }, [])

  return (
    <div style={{ padding: 40 }}>
      <h2>Selecciona barbería</h2>

      {barberias.map((b) => (
        <button
          key={b.id}
          onClick={() => {
            setBarberiaId(b.id)
            navigate("/dashboard")
          }}
        >
          {b.nombre}
        </button>
      ))}
    </div>
  )
}
