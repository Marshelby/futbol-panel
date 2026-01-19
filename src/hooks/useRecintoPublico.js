import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const toLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function useRecintoPublico(slug) {
  const [recinto, setRecinto] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaInicio = toLocalDate(hoy);

  // 90 días hacia adelante
  const fechaFin = new Date(hoy);
  fechaFin.setDate(hoy.getDate() + 90);
  const fechaHasta = toLocalDate(fechaFin);

  useEffect(() => {
    if (!slug) return;

    const cargar = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("v_recinto_disponibilidad_publica")
        .select(`
          recinto_id,
          recinto_nombre,
          direccion,
          telefono_whatsapp,
          cancha_id,
          cancha_nombre,
          fecha,
          hora,
          estado,
          nombre_cliente
        `)
        .eq("slug", slug)
        .gte("fecha", fechaInicio)
        .lte("fecha", fechaHasta)
        .order("fecha")
        .order("hora");

      if (error) {
        setError("Error cargando disponibilidad");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("Recinto no encontrado");
        setLoading(false);
        return;
      }

      setRecinto({
        id: data[0].recinto_id,
        nombre: data[0].recinto_nombre,
        direccion: data[0].direccion,
        telefono_whatsapp: data[0].telefono_whatsapp,
      });

      setDisponibilidad(data);
      setLoading(false);
    };

    cargar();
  }, [slug, fechaInicio, fechaHasta]);

  return {
    recinto,
    disponibilidad,
    loading,
    error,
    fechaHoy: fechaInicio,
  };
}
