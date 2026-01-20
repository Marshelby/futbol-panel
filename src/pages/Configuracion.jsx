import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [recinto, setRecinto] = useState(null);
  const [config, setConfig] = useState({});
  const [cantidadCanchas, setCantidadCanchas] = useState(0);

  // ✅ NUEVO: datos rígidos del negocio (los lee el chatbot)
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

      // ✅ NUEVO: leer horarios_base
      const { data: horariosData, error: horariosError } = await supabase
        .from("horarios_base")
        .select("id, hora, activo, recinto_id")
        .eq("recinto_id", recintoData.id)
        .order("hora", { ascending: true });

      if (horariosError) throw horariosError;
      setHorariosBase(horariosData ?? []);

      // ✅ NUEVO: leer precios_cancha
      const { data: preciosData, error: preciosError } = await supabase
        .from("precios_cancha")
        .select("id, recinto_id, hora_inicio, hora_fin, dias_semana, precio")
        .eq("recinto_id", recintoData.id)
        .order("hora_inicio", { ascending: true })
        .order("hora_fin", { ascending: true });

      if (preciosError) throw preciosError;
      setPreciosCancha(preciosData ?? []);
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setLoading(false);
    }
  }

  const resumenBot = useMemo(() => {
    const activos = horariosBase?.filter((h) => h.activo).length ?? 0;
    const total = horariosBase?.length ?? 0;
    const tramos = preciosCancha?.length ?? 0;

    return { activos, total, tramos };
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
    <div>
      <h1 className="text-3xl font-extrabold mb-1">Configuración</h1>
      <p className="text-gray-500 mb-6">Ajustes generales del recinto</p>

      {/* ✅ NUEVO: mensaje guía */}
      <div className="mb-6 bg-blue-50 rounded-xl border-2 border-black p-5">
        <h2 className="text-lg font-extrabold mb-2">¿Para qué sirve esta sección?</h2>
        <p className="text-sm text-blue-900 leading-relaxed">
          Aquí se muestran los <strong>datos rígidos</strong> del recinto (horarios y precios).
          <br />
          El <strong>chatbot</strong> y las <strong>reservas automáticas</strong> se basan en esta configuración para:
        </p>
        <ul className="mt-3 text-sm text-blue-900 list-disc pl-5 space-y-1">
          <li>Decirle al cliente qué horas existen y cuáles están habilitadas.</li>
          <li>Calcular el valor correcto según tramo horario y día de la semana.</li>
          <li>Evitar errores de precio y reservas fuera de rango.</li>
        </ul>

        <div className="mt-3 text-xs text-blue-900">
          Resumen actual:{" "}
          <strong>
            {resumenBot.activos}/{resumenBot.total}
          </strong>{" "}
          horarios activos · <strong>{resumenBot.tramos}</strong> tramos de precio.
        </div>

        <div className="mt-3 text-xs text-blue-900">
          * Si necesitas cambiar horarios o precios, usa el botón de WhatsApp para solicitarlo.
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INFORMACIÓN RECINTO */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-black p-6">
          <h2 className="text-xl font-extrabold mb-4">Información del recinto</h2>

          <Campo label="Nombre del recinto" valor={recinto?.nombre || "—"} />
          <Campo label="Dirección" valor={recinto?.direccion || "—"} />
          <Campo label="Cantidad de canchas" valor={cantidadCanchas} />
        </div>

        {/* COLUMNA DERECHA */}
        <div className="flex flex-col gap-6">
          {/* SERVICIOS */}
          <div className="bg-white rounded-xl border-2 border-black p-6">
            <h2 className="text-xl font-extrabold mb-4">Servicios activos</h2>

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
            <h2 className="text-xl font-extrabold mb-2">Solicitar cambios</h2>

            <p className="text-sm text-blue-900 mb-4">
              Los cambios de configuración se solicitan al equipo de{" "}
              <strong>FútbolPanel</strong>.
            </p>

            <div className="mb-3">
              <div className="text-xs font-semibold mb-1">ID del recinto</div>
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

      {/* ✅ NUEVO: BLOQUES CLAROS (Horarios base + Precios cancha) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HORARIOS BASE */}
        <div className="bg-white rounded-xl border-2 border-black p-6">
          <h2 className="text-xl font-extrabold mb-2">Horarios base</h2>
          <p className="text-sm text-gray-500 mb-4">
            Estas son las horas disponibles que el sistema considera (base del calendario y del chatbot).
          </p>

          <TablaHorarios horarios={horariosBase} />
        </div>

        {/* PRECIOS CANCHA */}
        <div className="bg-white rounded-xl border-2 border-black p-6">
          <h2 className="text-xl font-extrabold mb-2">Precios por tramo</h2>
          <p className="text-sm text-gray-500 mb-4">
            El precio se determina por rango horario y días de la semana.
          </p>

          <TablaPrecios precios={preciosCancha} />
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

/* ========================= */
/* ✅ NUEVO: tablas de visualización */

function TablaHorarios({ horarios }) {
  if (!horarios || horarios.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No hay horarios base cargados para este recinto.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-2 border-black rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-3 py-2 border-b-2 border-black">Hora</th>
            <th className="text-left px-3 py-2 border-b-2 border-black">Estado</th>
          </tr>
        </thead>
        <tbody>
          {horarios.map((h) => (
            <tr key={h.id} className="border-b border-black/20">
              <td className="px-3 py-2 font-mono">{formatearHora(h.hora)}</td>
              <td className="px-3 py-2">
                <Badge activo={!!h.activo} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TablaPrecios({ precios }) {
  if (!precios || precios.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No hay precios por tramo configurados para este recinto.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-2 border-black rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-3 py-2 border-b-2 border-black">Rango</th>
            <th className="text-left px-3 py-2 border-b-2 border-black">Días</th>
            <th className="text-right px-3 py-2 border-b-2 border-black">Precio</th>
          </tr>
        </thead>
        <tbody>
          {precios.map((p) => (
            <tr key={p.id} className="border-b border-black/20">
              <td className="px-3 py-2 font-mono">
                {formatearHora(p.hora_inicio)} - {formatearHora(p.hora_fin)}
              </td>
              <td className="px-3 py-2">{formatearDias(p.dias_semana)}</td>
              <td className="px-3 py-2 text-right font-extrabold">
                {formatearPrecio(p.precio)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ activo }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border-2 border-black ${
        activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

/* ========================= */
/* helpers */

function formatearHora(value) {
  if (!value) return "—";
  // puede venir como "15:00:00" o "15:00"
  const s = String(value);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function formatearPrecio(value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("es-CL").format(n);
}

function formatearDias(dias) {
  if (!dias) return "—";

  // puede venir como int[] o como string[]
  const arr = Array.isArray(dias) ? dias : [];
  const nums = arr
    .map((d) => Number(d))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  // 1..7 (Lun..Dom)
  const map = {
    1: "Lun",
    2: "Mar",
    3: "Mié",
    4: "Jue",
    5: "Vie",
    6: "Sáb",
    7: "Dom",
  };

  // Si están todos los días, muestra "Todos"
  if (nums.length === 7 && nums.every((n, i) => n === i + 1)) return "Todos";

  return nums.map((n) => map[n] || String(n)).join(", ");
}
