import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const RECINTO_ID = "7815073b-e90a-4c19-b5da-9ba5a6e7c848";

export default function Header() {
  const [userEmail, setUserEmail] = useState("Administrador/a");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(user.email);
      }
    };

    getUser();
  }, []);

  return (
    <header
      style={{
        height: "72px",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxSizing: "border-box",
      }}
    >
      {/* IZQUIERDA: NOMBRE + PELOTA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: "56px", // CASI ALTURA COMPLETA DEL HEADER
            fontWeight: "800",
            letterSpacing: "2px",
            lineHeight: "1",
            textTransform: "uppercase",
            fontFamily:
              "'Inter', 'Helvetica Neue', Arial, sans-serif",
            userSelect: "none",
          }}
        >
          MATI14
        </span>

        <img
          src="/ball.png"
          alt="Fútbol"
          style={{
            height: "44px",
            width: "44px",
            objectFit: "contain",
          }}
        />
      </div>

      {/* DERECHA: USUARIO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#fff",
          fontSize: "14px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
          }}
        >
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <span>{userEmail}</span>
      </div>
    </header>
  );
}
