import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const BarberContext = createContext();

export function BarberProvider({ children }) {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);

  const BARBERIA_ID = "01a3f9d1-44c1-4251-a458-2efedf2be209";

  useEffect(() => {
    fetchBarberos();
  }, []);

  const fetchBarberos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("barberos")
      .select("*")
      .eq("barberia_id", BARBERIA_ID)
      .eq("activo", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error cargando barberos:", error);
      setBarberos([]);
    } else {
      setBarberos(data || []);
    }

    setLoading(false);
  };

  return (
    <BarberContext.Provider
      value={{
        barberos,
        loading,
        refetchBarberos: fetchBarberos,
      }}
    >
      {children}
    </BarberContext.Provider>
  );
}

export function useBarberos() {
  return useContext(BarberContext);
}
