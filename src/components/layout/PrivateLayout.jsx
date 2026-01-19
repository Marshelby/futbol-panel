import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { useAuth } from "../../hooks/useAuth";

const PrivateLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PrivateLayout;
