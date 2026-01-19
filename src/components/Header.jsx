import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header style={styles.header}>
      <h1 style={styles.title} onClick={() => navigate("/")}>
        ⚽ FutbolPanel
      </h1>
    </header>
  );
}

const styles = {
  header: {
    height: "60px",
    background: "#0b0b0b",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid #222",
  },
  title: {
    cursor: "pointer",
    fontSize: "18px",
  },
};
