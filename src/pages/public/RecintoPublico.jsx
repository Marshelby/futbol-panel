import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import useRecintoPublico from "../../hooks/useRecintoPublico";
import MiniCancha from "../../components/public/MiniCancha";
import CanchaModal from "../../components/public/CanchaModal";
import { supabase } from "../../lib/supabase";

/* =========================
   HELPERS FECHA / HORA
========================= */
const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const toLocalISO = (d) => d.toLocaleDateString("sv-SE");

const normalizeFechaISO = (f) => {
  if (!f) return "";
  if (typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
  const d = new Date(f);
  return Number.isNaN(d.getTime()) ? "" : toLocalISO(d);
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const fmtHora = (h) => String(h).slice(0, 5);

const getNumeroCancha = (nombre = "") => {
  const match = nombre.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
};

export default function RecintoPublico() {
  const { slug } = useParams();
  const { loading, error, recinto, disponibilidad, fechaHoy } =
    useRecintoPublico(slug);

  const hoyISO = useMemo(() => toLocalISO(new Date()), []);
  const VENTANA = 7;

  const [offset, setOffset] = useState(0);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [precios, setPrecios] = useState({ semana: [], finDeSemana: [] });

  useEffect(() => {
    if (!fechaHoy) return;
    const backendISO = normalizeFechaISO(fechaHoy);
    setFechaSeleccionada(backendISO < hoyISO ? hoyISO : backendISO);
  }, [fechaHoy, hoyISO]);

  useEffect(() => {
    if (!recinto?.id) return;

    const cargarPrecios = async () => {
      const { data } = await supabase
        .from("precios_cancha")
        .select("hora_inicio, hora_fin, dias_semana, precio")
        .eq("recinto_id", recinto.id)
        .order("hora_inicio");

      if (!data) return;

      const semana = [];
      const finDeSemana = [];

      data.forEach((p) => {
        const item = {
          desde: fmtHora(p.hora_inicio),
          hasta: fmtHora(p.hora_fin),
          precio: p.precio,
        };

        const dias = p.dias_semana || [];
        const esFinde = dias.includes(0) || dias.includes(6);

        if (esFinde) finDeSemana.push(item);
        else semana.push(item);
      });

      setPrecios({ semana, finDeSemana });
    };

    cargarPrecios();
  }, [recinto]);

  const disponibilidadSafe = useMemo(
    () =>
      (Array.isArray(disponibilidad) ? disponibilidad : []).map((d) => ({
        ...d,
        __fechaISO: normalizeFechaISO(d.fecha),
      })),
    [disponibilidad]
  );

  const diasVisibles = useMemo(
    () =>
      Array.from({ length: VENTANA }).map((_, i) =>
        addDays(new Date(), offset + i)
      ),
    [offset]
  );

  const disponibilidadDia = useMemo(
    () =>
      disponibilidadSafe.filter((d) => d.__fechaISO === fechaSeleccionada),
    [disponibilidadSafe, fechaSeleccionada]
  );

  const horasDisponibles = useMemo(
    () =>
      [...new Set(disponibilidadDia.map((d) => fmtHora(d.hora)))].sort(),
    [disponibilidadDia]
  );

  useEffect(() => {
    setHoraSeleccionada(null);
    setCanchaSeleccionada(null);
  }, [fechaSeleccionada]);

  const canchasPorHora = useMemo(() => {
    if (!horaSeleccionada) return [];
    return disponibilidadDia
      .filter((d) => fmtHora(d.hora) === horaSeleccionada)
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
      <header className="h-14 border-b border-white/10 flex items-center px-6">
        <div className="font-semibold flex items-center gap-2">
          ⚽ <span>FútbolPanel</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <section className="text-center space-y-2 mb-12">
          <h1 className="text-4xl font-bold">{recinto.nombre}</h1>
          <p className="text-sm text-white/70">{recinto.direccion}</p>
          <div className="w-24 h-[2px] bg-green-500 mx-auto mt-4" />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-10">
          {/* ASIDE IZQ */}
          <aside className="hidden lg:block space-y-4">
            <div className="rounded-xl p-4 bg-black/40 border border-white/20">
              <h3 className="font-bold mb-2">VALORES DÍAS DE SEMANA</h3>
              {precios.semana.map((p, i) => (
                <div key={i} className="text-sm text-white/80">
                  {p.desde} – {p.hasta} hrs · ${p.precio}
                </div>
              ))}
            </div>
          </aside>

          {/* BLOQUE CENTRAL REALMENTE CENTRADO */}
          <section className="flex flex-col items-center w-full">
            <div className="w-full max-w-4xl flex flex-col items-center space-y-8">
              {/* Selector días */}
              <div className="flex items-center justify-center gap-2">
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
                        className={`px-4 py-3 border rounded ${
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
              </div>

              {/* Horas */}
              {fechaSeleccionada && (
                <div className="flex justify-center gap-3 flex-wrap">
                  {horasDisponibles.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHoraSeleccionada(h)}
                      className={`px-5 py-3 border rounded ${
                        horaSeleccionada === h
                          ? "bg-green-600 border-green-400 text-white"
                          : "bg-white text-black border-black hover:bg-gray-200"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-center text-white/60">
                {horaSeleccionada
                  ? "⚽ Escoge una cancha"
                  : "🕒 Escoge un horario"}
              </p>

              {/* Canchas */}
              {horaSeleccionada && (
                <div className="w-full rounded-xl p-6 border border-white/20 bg-[#0f3d2e]">
                  <div className="text-lg font-semibold mb-4 text-center">
                    ⏱ {horaSeleccionada}
                  </div>

                  <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">

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
                </div>
              )}
            </div>
          </section>

          {/* ASIDE DER */}
          <aside className="hidden lg:block space-y-4">
            <div className="rounded-xl p-4 bg-black/40 border border-white/20">
              <h3 className="font-bold mb-2">VALORES FIN DE SEMANA</h3>
              {precios.finDeSemana.map((p, i) => (
                <div key={i} className="text-sm text-white/80">
                  {p.desde} – {p.hasta} hrs · ${p.precio}
                </div>
              ))}
            </div>
          </aside>
        </div>

        <footer className="text-center text-xs text-white/60 pt-12">
          ⚽ FútbolPanel · Plataforma de reservas deportivas
        </footer>
      </main>

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
