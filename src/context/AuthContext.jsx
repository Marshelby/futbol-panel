import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [recinto, setRecinto] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSessionAndRecinto = async () => {
    setLoading(true);

    // 1️⃣ Obtener sesión
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setRecinto(null);
      setLoading(false);
      return;
    }

    // 2️⃣ Obtener recinto por owner_user_id (modelo correcto)
    const { data, error } = await supabase
      .from("recintos")
      .select("*")
      .eq("owner_user_id", currentUser.id)
      .limit(1)
      .single();

    if (error || !data) {
      console.error("Error cargando recinto:", error);
      setRecinto(null);
      setLoading(false);
      return;
    }

    setRecinto(data);
    setLoading(false);
  };

  // 3️⃣ Carga inicial + listener auth
  useEffect(() => {
    loadSessionAndRecinto();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSessionAndRecinto();
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRecinto(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        recinto, // ← SIEMPRE viene de DB
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
