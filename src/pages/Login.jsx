import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div style={{ padding: 40, maxWidth: 400 }}>
      <h2>Ingreso al panel</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            cursor: "pointer",
          }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: 10 }}>
            {error}
          </p>
        )}
      </form>
    </div>
  )
}
