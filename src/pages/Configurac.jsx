import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [recinto, setRecinto] = useState(null);
  const [config, setConfig] = useState({});
  const [cantidadCanchas, setCantidadCanchas] = useState(0);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      const { data: recintoData, error: recintoError } = await supabase
        .from("recintos")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();

      if (recintoError) throw recintoError;

      setRecinto(recintoData);

      const { data: configData, error: configError } = await supabase
        .from("configuracion_recinto")
        .select("clave, valor")
        .eq("recinto_id", recintoData.id);

      if (configError) throw configError;

      const configMap = {};
      configData?.forEach((item) => {
        configMap[item.clave] = item.valor;
      });

      setConfig(configMap);

      const { count, error: countError } = await supabase
        .from("canchas")
        .select("*", { count: "exact", head: true })
        .eq("recinto_id", recintoData.id)
        .eq("activa", true);

      if (countError) throw countError;

      setCantidadCanchas(count ?? 0);
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500">Cargando configuración…</div>;
  }

  const whatsappLink = `https://wa.me/0000000000?text=${encodeURIComponent(
    `Hola 👋  
Soy el dueño del recinto "${recinto?.nombre}".  
ID del recinto: ${recinto?.id}

Quiero solicitar el siguiente cambio de configuración:
- `
  )}`;

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-1">Configuración</h1>
      <p className="text-gray-500 mb-6">
        Ajustes generales del recinto
      </p>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* INFORMACIÓN RECINTO */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-black p-6">
          <h2 className="text-xl font-extrabold mb-4">
            Información del recinto
          </h2>

          <Campo label="Nombre del recinto" valor={recinto?.nombre || "—"} />
          <Campo label="Dirección" valor={recinto?.direccion || "—"} />
          <Campo label="Cantidad de canchas" valor={cantidadCanchas} />
        </div>

        {/* COLUMNA DERECHA */}
        <div className="flex flex-col gap-6">

          {/* SERVICIOS */}
          <div className="bg-white rounded-xl border-2 border-black p-6">
            <h2 className="text-xl font-extrabold mb-4">
              Servicios activos
            </h2>

            <Toggle
              label="Reservas automáticas"
              activo={config.mostrar_disponibilidad_publica === "true"}
            />
            <Toggle label="Chatbot activo" activo />
            <Toggle
              label="Visualización pública de horarios"
              activo={config.mostrar_disponibilidad_publica === "true"}
            />
          </div>

          {/* SOLICITAR CAMBIOS */}
          <div className="bg-blue-50 rounded-xl border-2 border-black p-6">
            <h2 className="text-xl font-extrabold mb-2">
              Solicitar cambios
            </h2>

            <p className="text-sm text-blue-900 mb-4">
              Los cambios de configuración se solicitan al equipo de{" "}
              <strong>FútbolPanel</strong>.
            </p>

            <div className="mb-3">
              <div className="text-xs font-semibold mb-1">
                ID del recinto
              </div>
              <div className="font-mono text-xs bg-white border-2 border-black rounded px-2 py-1">
                {recinto?.id}
              </div>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
            >
              Solicitar cambios por WhatsApp
            </a>

            <p className="text-xs text-blue-900 mt-3">
              * Este canal será automatizado en el futuro.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ========================= */

function Campo({ label, valor }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <div className="mt-1 px-3 py-2 rounded-lg border-2 border-black bg-gray-50">
        {valor}
      </div>
    </div>
  );
}

function Toggle({ label, activo }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`text-sm font-bold ${
          activo ? "text-green-600" : "text-gray-500"
        }`}
      >
        {activo ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}
