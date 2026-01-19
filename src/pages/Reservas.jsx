import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

/* =========================
   CONFIG
========================= */
const RECINTO_ID = "7815073b-e90a-4c19-b5da-9ba5a6e7c848";

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

const toISO = (d) => d.toISOString().split("T")[0];
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
  const hoy = new Date();
  const hoyISO = toISO(hoy);

  const [inicioSemana, setInicioSemana] = useState(startOfWeek(hoy));
  const [fechaSeleccionada, setFechaSeleccionada] = useState(toISO(hoy));

  const [canchas, setCanchas] = useState([]);
  const [horas, setHoras] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [pagos, setPagos] = useState([]);

  const [modalData, setModalData] = useState(null);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);

  /* =========================
     CARGA BASE
  ========================= */
  useEffect(() => {
    const cargarBase = async () => {
      const [{ data: canchasData }, { data: horasData }] = await Promise.all([
        supabase
          .from("canchas")
          .select("id, nombre")
          .eq("recinto_id", RECINTO_ID)
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
  }, []);

  /* =========================
     AGENDA + PAGOS
  ========================= */
  const cargarAgendaSemana = async (weekStart) => {
    const inicio = toISO(weekStart);
    const fin = toISO(addDays(weekStart, 6));

    const { data: agendaData } = await supabase
      .from("agenda_canchas")
      .select("id, fecha, cancha_id, horario_id, nombre_cliente")
      .eq("recinto_id", RECINTO_ID)
      .gte("fecha", inicio)
      .lte("fecha", fin);

    const agendaIds = (agendaData || []).map((a) => a.id);

    let pagosData = [];
    if (agendaIds.length) {
      const res = await supabase
        .from("pagos_reservas")
        .select("agenda_cancha_id, estado_pago, monto_total, monto_abonado")
        .in("agenda_cancha_id", agendaIds);
      pagosData = res.data || [];
    }

    setAgenda(agendaData || []);
    setPagos(pagosData);
  };

  useEffect(() => {
    cargarAgendaSemana(inicioSemana);
  }, [inicioSemana]);

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
    const { data, error } = await supabase.rpc("get_precio_cancha", {
      p_recinto_id: RECINTO_ID,
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
            const iso = toISO(d);
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

      <table className="w-full border rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Hora</th>
            {canchas.map((c) => (
              <th key={c.id} className="p-2 border">{c.nombre}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {horas.map((h) => (
            <tr key={h.id}>
              <td className="p-2 border font-semibold">
                {String(h.hora).slice(0, 5)}
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
                    className="p-2 border text-center cursor-pointer"
                    onClick={() => agendaItem && abrirModal(agendaItem, pago, h.hora)}
                  >
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
                      {texto}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {modalData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <h2 className="text-lg font-bold mb-2">Reserva</h2>

            <p><strong>Cliente:</strong> {modalData.agenda.nombre_cliente}</p>
            <p><strong>Fecha:</strong> {modalData.agenda.fecha}</p>

            <p><strong>Abono:</strong> ${formatCLP(modalData.pago?.monto_abonado ?? 0)}</p>
            <p><strong>Total:</strong> ${formatCLP(modalData.pago?.monto_total ?? 0)}</p>

            {(() => {
              const total = Number(modalData.pago?.monto_total || 0);
              const abono = Number(modalData.pago?.monto_abonado || 0);
              const saldo = Math.max(0, total - abono);
              return (
                <p className="mb-4"><strong>Saldo:</strong> ${formatCLP(saldo)}</p>
              );
            })()}

            {modalData.pago?.estado_pago !== "pagado" && (
              <button
                onClick={marcarPagado}
                className="w-full bg-black text-white py-2 rounded mb-2"
              >
                Marcar como pagado
              </button>
            )}

            <button
              onClick={() => setModalData(null)}
              className="w-full border py-2 rounded"
            >
              Cerrar
            </button>
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
