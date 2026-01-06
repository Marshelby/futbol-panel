import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function EstadoPublico() {
  const [barberos, setBarberos] = useState([]);
  const [estados, setEstados] = useState([]);

  useEffect(() => {
    cargar();

    const channel = supabase
      .channel("estado-publico-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estado_diario" },
        cargar
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function cargar() {
    const { data: barberosData } = await supabase
      .from("barberos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre");

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { data: estadosData } = await supabase
      .from("estado_diario")
      .select("barbero_id, tipo, mensaje, created_at")
      .gte("created_at", hoy.toISOString())
      .order("created_at", { ascending: false });

    setBarberos(barberosData || []);
    setEstados(estadosData || []);
  }

  function estadoActual(barberoId) {
    return estados.find((e) => e.barbero_id === barberoId);
  }

  function labelEstado(tipo) {
    switch (tipo) {
      case "atendiendo":
        return "🟢 Atendiendo";
      case "almuerzo":
        return "🟡 En almuerzo";
      case "no_disponible":
        return "🔴 No disponible";
      case "demora":
        return "⚠️ Con demora";
      default:
        return "Sin estado";
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1>Estado de la barbería</h1>

      {barberos.map((b) => {
        const estado = estadoActual(b.id);

        return (
          <div
            key={b.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <strong>{b.nombre}</strong>
            <div>{labelEstado(estado?.tipo)}</div>
            {estado?.mensaje && (
              <small style={{ color: "#555" }}>{estado.mensaje}</small>
            )}
          </div>
        );
      })}
    </div>
  );
}
