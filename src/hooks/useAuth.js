import { useContext } from "react";
import { AuthContextInstance } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContextInstance);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
