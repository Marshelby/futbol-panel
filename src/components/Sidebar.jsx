import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 bg-gradient-to-b from-[#0a1a33] to-[#050b16] text-white sticky top-0 flex flex-col">
      {/* LOGO / HEADER */}
      <div className="h-[72px] flex items-center justify-center border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* ICONO PELOTA ROTANDO */}
          <span
            className="ball-spin"
            style={{
              fontSize: "26px",
              lineHeight: "1",
              display: "inline-block",
            }}
          >
            ⚽
          </span>

          {/* TEXTO */}
          <span className="text-lg font-black tracking-wide">
            FutbolPanel
          </span>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Item to="/" label="Inicio" />
        <Item to="/reservas" label="Reservas" />
        <Item to="/calendario" label="Calendario" />
        <Item to="/contabilidad" label="Contabilidad" />

        {/* NUEVO: CHAT BOT */}
        <Item to="/chat-bot" label="Chat Bot" />

        <Item to="/configuracion" label="Configuración" />
      </nav>

      {/* FOOTER */}
      <div className="p-4 text-xs text-white/40 border-t border-white/10">
        © {new Date().getFullYear()} FutbolPanel
      </div>

      {/* ANIMACIÓN */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .ball-spin {
          animation: spin 6s linear infinite;
        }
      `}</style>
    </aside>
  );
}

function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `
        flex items-center px-4 py-2 rounded-lg text-sm font-medium transition
        ${
          isActive
            ? "bg-white text-[#0a1a33] shadow"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }
        `
      }
    >
      {label}
    </NavLink>
  );
}
