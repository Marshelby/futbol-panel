import { createBrowserRouter, Navigate } from "react-router-dom";

/* layouts */
import PublicLayout from "../components/layout/PublicLayout";
import PrivateLayout from "../components/layout/PrivateLayout";

/* pages */
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Reservas from "../pages/Reservas";
import Calendario from "../pages/Calendario";
import Cronograma from "../pages/Cronograma";
import Contabilidad from "../pages/Contabilidad";
import Conversaciones from "../pages/Conversaciones";
import Configuracion from "../pages/Configuracion";

/* public pages */
import RecintoPublico from "../pages/public/RecintoPublico";

const router = createBrowserRouter([
  /* ---------- ROOT ---------- */
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  /* ---------- AUTH ---------- */
  {
    path: "/login",
    element: <Login />,
  },

  /* ---------- PUBLIC ---------- */
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/:slug",
        element: <RecintoPublico />,
      },
    ],
  },

  /* ---------- PRIVATE ---------- */
  {
    element: <PrivateLayout />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/reservas",
        element: <Reservas />,
      },
      {
        path: "/calendario",
        element: <Calendario />,
      },
      {
        path: "/cronograma",
        element: <Cronograma />,
      },
      {
        path: "/contabilidad",
        element: <Contabilidad />,
      },
      {
        path: "/chat-bot",
        element: <Conversaciones />,
      },
      {
        path: "/configuracion",
        element: <Configuracion />,
      },
    ],
  },
]);

export default router;
