import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [recinto, setRecinto] = useState(null);
  const [config, setConfig] = useState({});
  const [cantidadCanchas, setCantidadCanchas] = useState(0);
  const [horariosBase, setHorariosBase] = useState([]);
  const [preciosCancha, setPreciosCancha] = useState([]);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: recintoData } = await supabase
        .from("recintos")
        .select("*")
        .eq("owner_user_id", user.id)
        .single();

      setRecinto(recintoData);

      const { data: configData } = await supabase
        .from("configuracion_recinto")
        .select("clave, valor")
        .eq("recinto_id", recintoData.id);

      const configMap = {};
      configData?.forEach((i) => (configMap[i.clave] = i.valor));
      setConfig(configMap);

      const { count } = await supabase
        .from("canchas")
        .select("*", { count: "exact", head: true })
        .eq("recinto_id", recintoData.id)
        .eq("activa", true);

      setCantidadCanchas(count ?? 0);

      const { data: horarios } = await supabase
        .from("horarios_base")
        .select("id, hora, activo")
        .eq("recinto_id", recintoData.id)
        .order("hora");

      setHorariosBase(horarios ?? []);

      const { data: precios } = await supabase
        .from("precios_cancha")
        .select("id, hora_inicio, hora_fin, dias_semana, precio")
        .eq("recinto_id", recintoData.id)
        .order("hora_inicio");

      setPreciosCancha(precios ?? []);
    } finally {
      setLoading(false);
    }
  }

  const resumenBot = useMemo(() => {
    return {
      activos: horariosBase.filter((h) => h.activo).length,
      total: horariosBase.length,
      tramos: preciosCancha.length,
    };
  }, [horariosBase, preciosCancha]);

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
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Configuración del sistema
        </h1>
        <p className="text-slate-600 mt-1">
          Reglas base que utiliza el calendario, el chatbot y las reservas automáticas.
        </p>
      </div>

      {/* CEREBRO */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-900">
          🧠 Cerebro del recinto
        </h2>

        <p className="text-blue-900 text-base leading-relaxed">
  Esta sección define los <strong>valores de las canchas</strong>, los{" "}
  <strong>horarios de apertura y cierre</strong>, y los{" "}
  <strong>datos del recinto</strong> como el nombre y la ubicación.
  <br />
  <br />
  Estos datos los utiliza el <strong>Bot de WhatsApp</strong> para operar
  correctamente y son de <strong>vital importancia</strong>.
  <br />
  Para realizar un cambio, debes hacer clic en{" "}
  <strong>“Solicitar cambios”</strong> y el equipo técnico lo gestionará.
</p>

        <ul className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
          <InfoItem text="Horas disponibles y habilitadas" />
          <InfoItem text="Cálculo automático de precios" />
          <InfoItem text="Prevención de reservas inválidas" />
        </ul>

        <div className="mt-4 text-sm text-blue-900">
          Estado actual:{" "}
          <strong>
            {resumenBot.activos}/{resumenBot.total}
          </strong>{" "}
          horarios activos · <strong>{resumenBot.tramos}</strong> reglas de precio
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-4">Información del recinto</h2>
          <Campo label="Nombre del recinto" valor={recinto?.nombre} />
          <Campo label="Dirección" valor={recinto?.direccion} />
          <Campo label="Cantidad de canchas" valor={cantidadCanchas} />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4">Servicios activos</h2>
            <Toggle label="Reservas automáticas" activo />
            <Toggle label="Chatbot activo" activo />
            <Toggle label="Horarios públicos" activo />
          </div>

          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6">
            <h2 className="text-lg font-bold mb-2">Solicitar cambios</h2>

            <div className="text-xs mb-2 text-slate-700">ID del recinto</div>
            <div className="font-mono text-xs bg-white border rounded px-2 py-1 mb-4">
              {recinto?.id}
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-emerald-600 hover:bg-emerald-700 transition text-white font-bold py-2 rounded-lg"
            >
              Solicitar cambios por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* HORARIOS */}
      <div className="rounded-2xl bg-white border border-blue-200 p-6">
        <h2 className="text-lg font-bold mb-4 text-blue-900">
          Horario de apertura y de cierre del recinto
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {horariosBase.map((h) => (
            <div
              key={h.id}
              className={`rounded-xl border px-3 py-2 text-center font-mono text-sm ${
                h.activo
                  ? "bg-blue-50 border-blue-300 text-blue-800"
                  : "bg-slate-100 border-slate-300 text-slate-500"
              }`}
            >
              {formatearHora(h.hora)}
            </div>
          ))}
        </div>
      </div>

      {/* PRECIOS */}
      <div className="rounded-2xl bg-white border border-blue-200 p-6">
        <h2 className="text-lg font-bold mb-4 text-blue-900">
          Precios de las canchas del recinto dependiendo de la hora y del día
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {preciosCancha.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-blue-200 p-4 bg-blue-50"
            >
              <div className="font-mono text-sm mb-1 text-blue-900">
                {formatearHora(p.hora_inicio)} – {formatearHora(p.hora_fin)}
              </div>

              <div className="text-xs text-blue-700 mb-2">
                {formatearDias(p.dias_semana)}
              </div>

              <div className="text-2xl font-extrabold text-blue-900">
                ${formatearPrecio(p.precio)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* COMPONENTES */

function Campo({ label, valor }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <div className="rounded-lg bg-slate-50 border px-3 py-2">
        {valor ?? "—"}
      </div>
    </div>
  );
}

function Toggle({ label, activo }) {
  return (
    <div className="flex justify-between text-sm mb-2">
      <span>{label}</span>
      <span className={activo ? "text-emerald-600 font-bold" : "text-slate-400"}>
        {activo ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
}

function InfoItem({ text }) {
  return (
    <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 text-blue-900">
      {text}
    </div>
  );
}

/* HELPERS */

function formatearHora(h) {
  return String(h)?.slice(0, 5) ?? "—";
}

function formatearPrecio(n) {
  return new Intl.NumberFormat("es-CL").format(n ?? 0);
}

function formatearDias(dias) {
  const map = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return dias?.map((d) => map[d]).join(", ") ?? "—";
}
