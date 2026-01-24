
import { useEffect, useMemo, useState, Fragment } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

/* =========================
   FECHAS
========================= */
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const DIAS_LARGO = [
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
  "DOMINGO",
];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/* fecha local YYYY-MM-DD */
const toLocalDate = (d) => {
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
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatCLP = (n) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Number(n || 0));

export default function Reservas() {
  const { recinto } = useAuth();
  const recintoId = recinto?.id;

  const hoy = new Date();
  const hoyISO = toLocalDate(hoy);

  const [inicioSemana, setInicioSemana] = useState(startOfWeek(hoy));
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);

  const [canchas, setCanchas] = useState([]);
  const [horas, setHoras] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [pagos, setPagos] = useState([]);

  const [modalData, setModalData] = useState(null);
  useEffect(() => {
    if (!modalData) return;

    const onKey = (e) => {
      if (e.key === "Escape") setModalData(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalData]);

  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);

  /* =========================
     CARGA BASE
  ========================= */
  useEffect(() => {
    if (!recintoId) return;

    const cargarBase = async () => {
      const [{ data: canchasData }, { data: horasData }] = await Promise.all([
        supabase
          .from("canchas")
          .select("id, nombre")
          .eq("recinto_id", recintoId)
          .eq("activa", true)
          .order("nombre"),

        supabase
          .from("horarios_base")
          .select("id, hora")
          .eq("activo", true)
          .order("hora"),
      ]);

      setCanchas(canchasData || []);
      setHoras(horasData || []);
    };

    cargarBase();
  }, [recintoId]);

  /* =========================
     AGENDA + PAGOS
  ========================= */
  const cargarAgendaSemana = async (weekStart) => {
    if (!recintoId) return;

    const diasSemanaISO = Array.from({ length: 7 }).map((_, i) =>
      toLocalDate(addDays(weekStart, i))
    );

    const diasPasados = diasSemanaISO.filter((d) => d < hoyISO);
    const diasActuales = diasSemanaISO.filter((d) => d >= hoyISO);

    let agendaData = [];
    let pagosData = [];

    if (diasActuales.length) {
      const { data } = await supabase
        .from("agenda_canchas")
        .select("id, fecha, cancha_id, horario_id, nombre_cliente")
        .eq("recinto_id", recintoId)
        .in("fecha", diasActuales);
      agendaData.push(...(data || []));
    }

    if (diasPasados.length) {
      const { data } = await supabase
        .from("agenda_canchas_historico")
        .select("id, fecha, cancha_id, horario_id, nombre_cliente")
        .eq("recinto_id", recintoId)
        .in("fecha", diasPasados);
      agendaData.push(...(data || []));
    }

    const idsActuales = agendaData.filter(a => a.fecha >= hoyISO).map(a => a.id);
    const idsPasados = agendaData.filter(a => a.fecha < hoyISO).map(a => a.id);

    if (idsActuales.length) {
      const { data } = await supabase
        .from("pagos_reservas")
        .select("agenda_cancha_id, estado_pago, monto_total, monto_abonado")
        .in("agenda_cancha_id", idsActuales);
      pagosData.push(...(data || []));
    }

    if (idsPasados.length) {
      const { data } = await supabase
        .from("pagos_reservas_historico")
        .select("agenda_cancha_id, estado_pago, monto_total, monto_abonado")
        .in("agenda_cancha_id", idsPasados);
      pagosData.push(...(data || []));
    }

    setAgenda(agendaData);
    setPagos(pagosData);
  };

  useEffect(() => {
    cargarAgendaSemana(inicioSemana);
  }, [inicioSemana, recintoId]);

  /* =========================
     MAPAS
  ========================= */
  const mapaAgenda = useMemo(() => {
    const map = {};
    agenda.forEach((a) => {
      map[`${a.fecha}_${a.cancha_id}_${a.horario_id}`] = a;
    });
    return map;
  }, [agenda]);

  const mapaPagos = useMemo(() => {
    const map = {};
    pagos.forEach((p) => {
      map[p.agenda_cancha_id] = p;
    });
    return map;
  }, [pagos]);

  const diasSemana = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(inicioSemana, i)),
    [inicioSemana]
  );

  const mesVisible = `${MESES[inicioSemana.getMonth()]} ${inicioSemana.getFullYear()}`;

  const fechaSeleccionadaTexto = useMemo(() => {
    const d = new Date(`${fechaSeleccionada}T00:00:00`);
    const dia = DIAS_LARGO[d.getDay() === 0 ? 6 : d.getDay() - 1];
    return `${dia} ${d.getDate()}/${d.getMonth() + 1}`;
  }, [fechaSeleccionada]);

  /* =========================
     PRECIO (RPC)
  ========================= */
  const obtenerPrecio = async ({ fecha, hora }) => {
    if (!recintoId) return null;

    const { data, error } = await supabase.rpc("get_precio_cancha", {
      p_recinto_id: recintoId,
      p_fecha: fecha,
      p_hora: hora,
    });

    if (error) return null;
    if (data === null || typeof data === "undefined") return null;
    return Number(data);
  };

  /* =========================
     ABRIR MODAL
  ========================= */
  const abrirModal = async (agendaItem, pago, hora) => {
    if (agendaItem.fecha < hoyISO) return;

    let pagoActual = pago
      ? {
          ...pago,
          monto_abonado: Number(pago.monto_abonado || 0),
          monto_total: Number(pago.monto_total || 0),
        }
      : null;

    const necesitaTotal =
      !pagoActual || pagoActual.monto_total === 0 || Number.isNaN(pagoActual.monto_total);

    if (necesitaTotal) {
      const precio = await obtenerPrecio({ fecha: agendaItem.fecha, hora });

      if (precio !== null) {
        const montoAbonado = pagoActual?.monto_abonado ?? 0;
        const estadoPago = pagoActual?.estado_pago === "pagado" ? "pagado" : "abono";

        await supabase
          .from("pagos_reservas")
          .upsert(
            {
              agenda_cancha_id: agendaItem.id,
              monto_total: precio,
              monto_abonado: montoAbonado,
              estado_pago: estadoPago,
            },
            { onConflict: "agenda_cancha_id" }
          );

        pagoActual = {
          agenda_cancha_id: agendaItem.id,
          monto_total: precio,
          monto_abonado: montoAbonado,
          estado_pago: estadoPago,
        };

        setPagos((prev) => {
          const sin = prev.filter((x) => x.agenda_cancha_id !== agendaItem.id);
          return [...sin, pagoActual];
        });
      }
    } else if (pagoActual.estado_pago !== "pagado") {
      pagoActual.estado_pago = "abono";
    }

    setModalData({ agenda: agendaItem, pago: pagoActual, hora });
  };

  /* =========================
     PAGAR
  ========================= */
  const ejecutarPago = async () => {
    if (!modalData?.agenda?.id) return;

    const total = Number(modalData.pago?.monto_total || 0);

    await supabase
      .from("pagos_reservas")
      .upsert(
        {
          agenda_cancha_id: modalData.agenda.id,
          estado_pago: "pagado",
          monto_total: total,
          monto_abonado: total,
        },
        { onConflict: "agenda_cancha_id" }
      );

    setMostrarAdvertencia(false);
    setModalData(null);
    await cargarAgendaSemana(inicioSemana);
  };

  const marcarPagado = () => {
    if (fechaSeleccionada !== hoyISO) {
      setMostrarAdvertencia(true);
      return;
    }
    ejecutarPago();
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Reservas</h1>
      <p className="text-gray-500 mb-3">Estado de pagos por cancha y horario</p>

      <div className="text-lg font-bold">{mesVisible}</div>
      <div className="text-xl font-black text-blue-700 mb-4">
        {fechaSeleccionadaTexto}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setInicioSemana(addDays(inicioSemana, -7))}>◀</button>

        <div className="flex gap-2">
          {diasSemana.map((d, i) => {
            const iso = toLocalDate(d);
            const activo = iso === fechaSeleccionada;

            return (
              <button
                key={i}
                onClick={() => setFechaSeleccionada(iso)}
                className={`px-3 py-2 rounded-lg border ${
                  activo ? "bg-black text-white" : "bg-white"
                }`}
              >
                <div>{DIAS[i]}</div>
                <div className="text-xs">
                  {d.getDate()}/{d.getMonth() + 1}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={() => setInicioSemana(addDays(inicioSemana, 7))}>▶</button>
      </div>

      <table className="w-full border-2 border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 border-b-4 border-gray-400">
          <tr>
            <th className="p-3 border-r border-gray-300">Hora</th>
            {canchas.map((c) => (
              <th key={c.id} className="p-3 border-r border-gray-300">{c.nombre}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {horas.map((h, idx) => (
            <Fragment key={h.id}>
              <tr className="group hover:bg-blue-50 transition-colors">
                <td className="p-5 border font-black bg-gray-100 whitespace-nowrap">
                  ⏰ {String(h.hora).slice(0, 5)}
                </td>

                {canchas.map((c) => {
                  const agendaItem =
                    mapaAgenda[`${fechaSeleccionada}_${c.id}_${h.id}`];
                  const pago = agendaItem ? mapaPagos[agendaItem.id] : null;

                  let texto = "Libre";
                  let color = "bg-green-100 text-green-700";

                  if (agendaItem) {
                    const montoAbonado = Number(pago?.monto_abonado || 0);
                    const estado = pago?.estado_pago;

                    if (estado === "pagado") {
                      texto = "Pagado";
                      color = "bg-blue-100 text-blue-700";
                    } else {
                      texto = `Abono $${formatCLP(montoAbonado)}`;
                      color = "bg-purple-100 text-purple-700";
                    }
                  }

                  return (
                    <td
                      key={c.id}
                      className="p-5 border text-center cursor-pointer"
                      onClick={() => agendaItem && abrirModal(agendaItem, pago, h.hora)}
                    >
                      <span className={`px-4 py-2 rounded-full text-xs font-semibold ${color}`}>
                        {texto}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {idx !== horas.length - 1 && (
                <tr aria-hidden="true">
                  <td colSpan={canchas.length + 1} className="p-0 border-0">
                    <div className="h-3 bg-gray-300/70" />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {modalData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 transition-opacity animate-fadeIn" onClick={() => setModalData(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-black/10 transition-transform animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const total = Number(modalData.pago?.monto_total || 0);
              const abono = Number(modalData.pago?.monto_abonado || 0);
              const saldo = Math.max(0, total - abono);

              const isPagado = modalData.pago?.estado_pago === "pagado" || saldo === 0;
              const isConAbono = !isPagado && abono > 0;

              const estadoLabel = isPagado
                ? "RESERVA PAGADA"
                : isConAbono
                ? "CON ABONO"
                : "PENDIENTE DE PAGO";

              const estadoIcon = isPagado ? "✅" : isConAbono ? "🟣" : "⚠️";
              const estadoClass = isPagado
                ? "bg-blue-600"
                : isConAbono
                ? "bg-purple-600"
                : "bg-red-600";

              return (
                <div>
                  {/* Header estado */}
                  <div className={`${estadoClass} text-white px-6 py-4`}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold tracking-wide opacity-90">
                        Reserva
                      </div>
                      <button
                        onClick={() => setModalData(null)}
                        className="text-white/90 hover:text-white text-xl leading-none"
                        aria-label="Cerrar"
                        title="Cerrar"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg">{estadoIcon}</span>
                      <div className="text-lg font-black tracking-wide">
                        {estadoLabel}
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    {/* Datos reserva */}
                    <div className="rounded-xl border border-black/10 bg-gray-50 p-4 mb-4">
                      <div className="text-xs font-semibold text-gray-500 mb-3 tracking-wide uppercase">
                        Datos de la reserva
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm text-gray-500">👤 Cliente</div>
                          <div className="text-sm font-bold text-gray-900 text-right break-words">
                            {modalData.agenda.nombre_cliente}
                          </div>
                        </div>

                        <div className="h-px bg-black/10" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm text-gray-500">📅 Fecha</div>
                          <div className="text-sm font-bold text-gray-900 text-right">
                            {modalData.agenda.fecha}
                          </div>
                        </div>

                        <div className="h-px bg-black/10" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm text-gray-500">⏰ Hora</div>
                          <div className="text-sm font-bold text-gray-900 text-right">
                            {String(modalData.hora || "").slice(0, 5)}
                          </div>
                        </div>

                        <div className="h-px bg-black/10" />

                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm text-gray-500">🏟️ Cancha</div>
                          <div className="text-sm font-bold text-gray-900 text-right">
                            {canchas.find(c => c.id === modalData.agenda.cancha_id)?.nombre || "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resumen pago */}
                    <div className="rounded-xl border border-black/10 bg-white p-4">
                      <div className="text-xs font-semibold text-gray-500 mb-3 tracking-wide uppercase">
                        Resumen de pago
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">Total</div>
                          <div className="text-sm font-extrabold text-gray-900">
                            ${formatCLP(total)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">Abono</div>
                          <div className="text-sm font-bold text-gray-900">
                            ${formatCLP(abono)}
                          </div>
                        </div>

                        <div className="h-px bg-black/10" />

                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-600">Saldo</div>
                          <div
                            className={`text-lg font-black ${
                              saldo === 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${formatCLP(saldo)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="mt-5 pt-4 border-t border-black/10 space-y-2">
                      {modalData.pago?.estado_pago !== "pagado" && (
                        <button
                          onClick={marcarPagado}
                          className="w-full bg-black text-white py-3 rounded-xl font-bold hover:opacity-95 active:opacity-90"
                        >
                          💰 Marcar como pagado
                        </button>
                      )}

                      <button
                        onClick={() => setModalData(null)}
                        className="w-full border border-black/20 py-3 rounded-xl font-semibold hover:bg-gray-50"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {mostrarAdvertencia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[420px] border-l-8 border-red-600">
            <h3 className="text-lg font-black text-red-700 mb-2">⚠️ Advertencia</h3>
            <p className="mb-3">
              Estás marcando como <strong>PAGADO</strong> una reserva del día{" "}
              <strong>{fechaSeleccionadaTexto}</strong>, no de HOY.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción <strong>no se puede deshacer</strong>.
            </p>

            <div className="flex gap-2">
              <button
                onClick={ejecutarPago}
                className="flex-1 bg-red-600 text-white py-2 rounded"
              >
                Confirmar pago
              </button>
              <button
                onClick={() => setMostrarAdvertencia(false)}
                className="flex-1 border py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
