import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useBarberia } from "./BarberiaContext";

const EstadoContext = createContext();

export function EstadoProvider({ children }) {
  const { barberia } = useBarberia();
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barberia) {
      setLoading(false);
      return;
    }

    async function fetchEstado() {
      setLoading(true);

      const { data, error } = await supabase
        .from("estado_diario") // ✅ TABLA CORRECTA
        .select("*")
        .eq("barberia_id", barberia.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error cargando estado diario:", error);
        setEstado(null);
      } else {
        setEstado(data);
      }

      setLoading(false);
    }

    fetchEstado();
  }, [barberia]);

  return (
    <EstadoContext.Provider value={{ estado, loading }}>
      {children}
    </EstadoContext.Provider>
  );
}

export function useEstado() {
  const context = useContext(EstadoContext);
  if (!context) {
    throw new Error("useEstado debe usarse dentro de EstadoProvider");
  }
  return context;
}
