import React from "react";
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Contenido público */}
      <Outlet />
    </div>
  );
};

export default PublicLayout;
