import { createClient } from "@supabase/supabase-js";

/* ===============================
   CLIENTE SUPABASE
================================ */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/* ===============================
   QUERIES DE LECTURA
================================ */

/**
 * Obtener recinto por slug (ej: mati14)
 */
export async function getRecintoBySlug(slug) {
  const { data, error } = await supabase
    .from("recintos")
    .select("id, nombre, slug, direccion")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtener horarios base (selector de horas)
 */
export async function getHorariosBase() {
  const { data, error } = await supabase
    .from("horarios_base")
    .select("id, hora")
    .eq("activo", true)
    .order("hora");

  if (error) throw error;
  return data;
}

/**
 * Obtener estado de todas las canchas
 * para un recinto, fecha y horario
 */
export async function getEstadoCanchas({
  recintoId,
  fecha,
  horarioId
}) {
  const { data, error } = await supabase
    .from("canchas")
    .select(`
      id,
      nombre,
      reservas (
        estado,
        nombre_cliente,
        telefono,
        fecha,
        horario_id
      )
    `)
    .eq("recinto_id", recintoId)
    .eq("activa", true)
    .eq("reservas.fecha", fecha)
    .eq("reservas.horario_id", horarioId);

  if (error) throw error;

  // Normalizamos el resultado
  return data.map((cancha) => {
    const reserva = cancha.reservas?.[0];

    return {
      cancha_id: cancha.id,
      cancha_nombre: cancha.nombre,
      estado: reserva?.estado ?? "disponible",
      nombre_cliente: reserva?.nombre_cliente ?? null,
      telefono: reserva?.telefono ?? null
    };
  });
}
