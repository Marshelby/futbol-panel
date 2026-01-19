import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import useRecintoPublico from "../../hooks/useRecintoPublico";
import MiniCancha from "../../components/public/MiniCancha";
import CanchaModal from "../../components/public/CanchaModal";

/* =========================
   HELPERS FECHA
========================= */
const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const toLocalISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const getNumeroCancha = (nombre = "") => {
  const match = nombre.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
};

export default function RecintoPublico() {
  const { slug } = useParams();
  const { loading, error, recinto, disponibilidad, fechaHoy } =
    useRecintoPublico(slug);

  const hoy = useMemo(() => startOfDay(new Date()), []);
  const hoyISO = useMemo(() => toLocalISO(hoy), [hoy]);

  const VENTANA = 7;

  const [offset, setOffset] = useState(0);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);

  useEffect(() => {
    if (!fechaHoy) return;
    const d = startOfDay(new Date(fechaHoy));
    const diff = Math.floor((d - hoy) / (1000 * 60 * 60 * 24));
    setOffset(Math.max(0, Math.floor(diff / VENTANA) * VENTANA));
    setFechaSeleccionada(toLocalISO(d < hoy ? hoy : d));
  }, [fechaHoy, hoy]);

  const disponibilidadSafe = useMemo(
    () => (Array.isArray(disponibilidad) ? disponibilidad : []),
    [disponibilidad]
  );

  const diasVisibles = useMemo(
    () =>
      Array.from({ length: VENTANA }).map((_, i) =>
        addDays(hoy, offset + i)
      ),
    [hoy, offset]
  );

  const disponibilidadDia = useMemo(
    () => disponibilidadSafe.filter((d) => d.fecha === fechaSeleccionada),
    [disponibilidadSafe, fechaSeleccionada]
  );

  const horasDisponibles = useMemo(
    () => [...new Set(disponibilidadDia.map((d) => d.hora))].sort(),
    [disponibilidadDia]
  );

  useEffect(() => {
    setHoraSeleccionada(null);
    setCanchaSeleccionada(null);
  }, [fechaSeleccionada]);

  const canchasPorHora = useMemo(() => {
    if (!horaSeleccionada) return [];
    return disponibilidadDia
      .filter((d) => d.hora === horaSeleccionada)
      .sort(
        (a, b) =>
          getNumeroCancha(a.cancha_nombre) -
          getNumeroCancha(b.cancha_nombre)
      );
  }, [disponibilidadDia, horaSeleccionada]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0b1f16]">
        Cargando…
      </div>
    );

  if (error) return <div className="p-6 text-white">Error: {error}</div>;
  if (!recinto)
    return <div className="p-6 text-white">Recinto no encontrado</div>;

  return (
    <div className="min-h-screen bg-[#0b1f16] text-white">

      {/* HEADER */}
      <header className="h-14 border-b border-white/10 flex items-center px-6">
        <div className="font-semibold flex items-center gap-2">
          ⚽ <span>FútbolPanel</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* TITULO */}
        <section className="text-center space-y-2">
          <h1 className="text-4xl font-bold">{recinto.nombre}</h1>
          <p className="text-sm text-white/70">{recinto.direccion}</p>
          <div className="w-24 h-[2px] bg-green-500 mx-auto mt-4" />
        </section>

        {/* FECHAS */}
        <section className="flex items-center justify-center gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - VENTANA))}
            className="px-3 py-2 bg-black/40 border border-white/20 rounded disabled:opacity-30"
          >
            ◀
          </button>

          <div className="flex gap-2 overflow-x-auto">
            {diasVisibles.map((d) => {
              const iso = toLocalISO(d);
              const activo = iso === fechaSeleccionada;

              return (
                <button
                  key={iso}
                  onClick={() => setFechaSeleccionada(iso)}
                  className={`px-4 py-3 border rounded transition ${
                    activo
                      ? "bg-green-600 text-white border-green-400"
                      : "bg-white text-black border-black hover:bg-gray-200"
                  }`}
                >
                  <div className="font-medium">{DIAS[d.getDay()]}</div>
                  <div className="text-xs opacity-70">
                    {d.getDate()}/{d.getMonth() + 1}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setOffset((o) => o + VENTANA)}
            className="px-3 py-2 bg-black/40 border border-white/20 rounded"
          >
            ▶
          </button>
        </section>

        {/* HORAS */}
        {fechaSeleccionada && (
          <section className="flex justify-center gap-3 overflow-x-auto">
            {horasDisponibles.map((h) => (
              <button
                key={h}
                onClick={() => setHoraSeleccionada(h)}
                className={`px-5 py-3 border rounded transition ${
                  horaSeleccionada === h
                    ? "bg-green-600 border-green-400 text-white"
                    : "bg-white text-black border-black hover:bg-gray-200"
                }`}
              >
                {String(h).slice(0, 5)}
              </button>
            ))}
          </section>
        )}

        {/* MENSAJE UX */}
        <p className="text-center text-white/60">
          {horaSeleccionada ? "⚽ Escoge una cancha" : "🕒 Escoge un horario"}
        </p>

        {/* CANCHAS */}
        {horaSeleccionada && (
          <section className="rounded-xl p-6 border border-white/20 bg-[#0f3d2e]">
            <div className="text-lg font-semibold mb-4">
              ⏱ {String(horaSeleccionada).slice(0, 5)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {canchasPorHora.map((c) => (
                <div
                  key={c.cancha_id}
                  className="rounded-xl p-2 bg-green-700/30 border border-white/20"
                >
                  <MiniCancha
                    nombre={c.cancha_nombre}
                    estado={c.estado}
                    onClick={() => setCanchaSeleccionada(c)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-white/60 pt-10">
          ⚽ FútbolPanel · Plataforma de reservas deportivas
        </footer>
      </main>

      {/* MODAL */}
      <CanchaModal
        open={!!canchaSeleccionada}
        cancha={canchaSeleccionada}
        fecha={fechaSeleccionada}
        hora={horaSeleccionada}
        onClose={() => setCanchaSeleccionada(null)}
      />
    </div>
  );
}
