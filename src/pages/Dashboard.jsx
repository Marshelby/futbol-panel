import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [recinto, setRecinto] = useState(null);
  const [canchasActivas, setCanchasActivas] = useState(0);
  const [bloquesDisponiblesHoy, setBloquesDisponiblesHoy] = useState(0);
  const [reservasHoy, setReservasHoy] = useState(0);
  const [proximosBloques, setProximosBloques] = useState([]);

  const hoy = new Date().toISOString().slice(0, 10);
  const horaActual = new Date().toTimeString().slice(0, 5);

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cargarDashboard() {
    try {
      setLoading(true);

      // Usuario
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error("Usuario no autenticado");

      // Recinto
      const { data: recintoData, error: recintoError } = await supabase
        .from("recintos")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();

      if (recintoError) throw recintoError;
      setRecinto(recintoData);

      // Canchas activas
      const { count: canchasCount } = await supabase
        .from("canchas")
        .select("*", { count: "exact", head: true })
        .eq("recinto_id", recintoData.id)
        .eq("activa", true);

      setCanchasActivas(canchasCount ?? 0);

      // Horarios base activos
      const { data: horariosBase } = await supabase
        .from("horarios_base")
        .select("hora")
        .eq("recinto_id", recintoData.id)
        .eq("activo", true)
        .gte("hora", horaActual)
        .order("hora", { ascending: true });

      // Reservas de hoy
      const { data: reservasData } = await supabase
        .from("reservas")
        .select("hora, estado")
        .eq("recinto_id", recintoData.id)
        .eq("fecha", hoy);

      const reservasValidas =
        reservasData?.filter((r) => r.estado !== "cancelada") ?? [];

      setReservasHoy(reservasValidas.length);

      const horasReservadas = reservasValidas.map((r) => r.hora);

      const disponibles =
        horariosBase?.filter(
          (h) => !horasReservadas.includes(h.hora)
        ) ?? [];

      setBloquesDisponiblesHoy(disponibles.length);

      // Próximos bloques (preview)
      const preview = (horariosBase ?? []).slice(0, 6).map((h) => {
        const reservada = horasReservadas.includes(h.hora);
        return {
          hora: h.hora,
          estado: reservada ? "Reservado" : "Disponible",
        };
      });

      setProximosBloques(preview);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500">Cargando dashboard…</div>;
  }

  const estadoOk =
    canchasActivas > 0 && bloquesDisponiblesHoy > 0;

  return (
    <div>
      {/* Título */}
      <h1 className="text-2xl font-bold mb-1">Inicio</h1>
      <p className="text-gray-500 mb-6">
        Estado general del recinto
      </p>

      {/* Resumen superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ResumenCard
          titulo="Canchas activas"
          valor={canchasActivas}
          subtitulo="En funcionamiento"
        />
        <ResumenCard
          titulo="Bloques disponibles hoy"
          valor={bloquesDisponiblesHoy}
          subtitulo="Horas libres"
        />
        <ResumenCard
          titulo="Reservas activas"
          valor={reservasHoy}
          subtitulo="Para hoy"
        />
      </div>

      {/* Estado operativo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Estado operativo actual
          </h2>
          <span
            className={`text-sm font-semibold ${
              estadoOk ? "text-green-600" : "text-yellow-600"
            }`}
          >
            ● {estadoOk ? "En funcionamiento" : "Revisión recomendada"}
          </span>
        </div>

        <p className="text-gray-600">
          {estadoOk
            ? "El recinto está recibiendo reservas y mostrando disponibilidad en tiempo real."
            : "Revisa la configuración de horarios o canchas para asegurar el correcto funcionamiento."}
        </p>
      </div>

      {/* Próximos bloques */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">
          Próximos bloques horarios
        </h2>

        {proximosBloques.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay más bloques disponibles hoy.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {proximosBloques.map((b, i) => (
              <BloqueHora
                key={i}
                hora={formatearHora(b.hora)}
                estado={b.estado}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== */

function ResumenCard({ titulo, valor, subtitulo }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-gray-500 text-sm mb-1">{titulo}</p>
      <p className="text-3xl font-bold">{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>
    </div>
  );
}

function BloqueHora({ hora, estado }) {
  const colores = {
    Disponible: "bg-green-100 text-green-700",
    Reservado: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div
      className={`rounded-lg p-4 text-center font-semibold ${
        colores[estado] || "bg-gray-100 text-gray-600"
      }`}
    >
      <p className="text-lg">{hora}</p>
      <p className="text-xs mt-1">{estado}</p>
    </div>
  );
}

function formatearHora(hora) {
  if (!hora) return "—";
  return String(hora).slice(0, 5);
}
