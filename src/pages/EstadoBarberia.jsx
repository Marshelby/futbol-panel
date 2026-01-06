import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ESTADOS = {
  atendiendo: { label: "Atendiendo", color: "green" },
  almuerzo: { label: "En almuerzo", color: "orange" },
  no_disponible: { label: "No disponible", color: "red" },
  demora: { label: "Con demora", color: "yellow" },
};

export default function EstadoBarberia() {
  const [barberos, setBarberos] = useState([]);
  const [estados, setEstados] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);

    // 1. Barberos
    const { data: barberosData } = await supabase
      .from("barberos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre");

    // 2. Último estado por barbero
    const { data: estadosData } = await supabase
      .from("estado_diario")
      .select("barbero_id, tipo")
      .order("created_at", { ascending: false });

    const mapaEstados = {};
    estadosData?.forEach((e) => {
      if (!mapaEstados[e.barbero_id]) {
        mapaEstados[e.barbero_id] = e.tipo;
      }
    });

    setBarberos(barberosData || []);
    setEstados(mapaEstados);
    setLoading(false);
  }

  if (loading) {
    return <p>Cargando estado de la barbería…</p>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Estado de la barbería</h2>

      {barberos.map((b) => {
        const estado = estados[b.id];
        const conf = ESTADOS[estado];

        return (
          <div
            key={b.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              border: "1px solid #ddd",
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <strong>{b.nombre}</strong>

            {conf ? (
              <span style={{ color: conf.color }}>
                ● {conf.label}
              </span>
            ) : (
              <span style={{ color: "#999" }}>Sin estado</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
