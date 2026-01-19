import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/reservas">Reservas</NavLink>
      <NavLink to="/calendario">Calendario</NavLink>
      <NavLink to="/contabilidad">Contabilidad</NavLink> {/* ✅ NUEVO */}
      <NavLink to="/configuracion">Configuración</NavLink>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    background: "#0f172a",
    color: "#fff",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
};
