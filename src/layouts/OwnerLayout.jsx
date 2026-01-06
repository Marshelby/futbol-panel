import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function OwnerLayout() {
  return (
    <div className="h-screen flex bg-zinc-100 text-zinc-900 overflow-hidden">
      {/* Sidebar fijo y altura completa */}
      <aside className="flex-shrink-0 h-full">
        <Sidebar />
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header fijo */}
        <header className="flex-shrink-0">
          <Header />
        </header>

        {/* Contenido scrolleable */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
