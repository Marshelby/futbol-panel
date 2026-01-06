import { createBrowserRouter } from "react-router-dom";
import OwnerLayout from "../layouts/OwnerLayout";

// páginas privadas
import Dashboard from "../pages/Dashboard";
import Barberos from "../pages/Barberos";
import EstadoDiario from "../pages/EstadoDiario";
import Contabilidad from "../pages/Contabilidad";
import RegistrarCorte from "../pages/RegistrarCorte";
import OrdenBarberos from "../pages/OrdenBarberos";

// pública
import EstadoPublico from "../pages/EstadoPublico";

const router = createBrowserRouter([
  {
    path: "/",
    element: <OwnerLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> }, // compatibilidad
      { path: "barberos", element: <Barberos /> },
      { path: "estado-diario", element: <EstadoDiario /> },
      { path: "contabilidad", element: <Contabilidad /> },
      { path: "registrar-corte", element: <RegistrarCorte /> },
      { path: "orden-barberos", element: <OrdenBarberos /> },
    ],
  },
  {
    path: "/estado-barberia",
    element: <EstadoPublico />,
  },
]);

export default router;
