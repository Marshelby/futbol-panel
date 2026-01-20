import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { user, recinto, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const userEmail = user?.email || "Administrador/a";
  const recintoNombre = recinto?.nombre || "Sin recinto";

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
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* IZQUIERDA */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            color: "#fff",
            fontSize: "40px",
            fontWeight: "400",
            letterSpacing: "0.5px",
            fontFamily:
              "'Inter', 'Helvetica Neue', Arial, sans-serif",
            userSelect: "none",
            lineHeight: "1",
          }}
        >
          {recintoNombre}
        </span>

        <span
          style={{
            color: "#fff",
            fontSize: "18px",
            fontWeight: "500",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          fútbol
        </span>
      </div>

      {/* DERECHA */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#fff",
        }}
      >
        {/* CLICK + HOVER AREA */}
        <div
          onClick={() => setOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            transition: "transform 0.2s ease, opacity 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.85";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
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
              fontWeight: "600",
            }}
          >
            {userEmail.charAt(0).toUpperCase()}
          </div>

          <span>{userEmail}</span>
        </div>

        {/* DROPDOWN */}
        {open && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "8px",
              backgroundColor: "#111",
              border: "1px solid #222",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "13px",
              color: "#fff",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            onClick={logout}
          >
            Cerrar sesión
          </div>
        )}
      </div>
    </header>
  );
}
