import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const BarberiaContext = createContext();

export function BarberiaProvider({ children }) {
  const [barberia, setBarberia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBarberia() {
      setLoading(true);

      const { data, error } = await supabase
        .from("barberias")
        .select("*")
        .limit(1)
        .single();

      if (!error) {
        setBarberia(data);
      } else {
        console.error("Error cargando barbería:", error);
      }

      setLoading(false);
    }

    fetchBarberia();
  }, []);

  return (
    <BarberiaContext.Provider value={{ barberia, loading }}>
      {children}
    </BarberiaContext.Provider>
  );
}

export function useBarberia() {
  const context = useContext(BarberiaContext);
  if (!context) {
    throw new Error("useBarberia debe usarse dentro de BarberiaProvider");
  }
  return context;
}
