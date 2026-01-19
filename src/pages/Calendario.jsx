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
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const toISO = (d) => d.toISOString().split("T")[0];

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// JS: 0=Dom..6=Sa  -> 1=Lu..7=Do
const dayToDiasSemana = (jsDate) => {
  const d = jsDate.getDay();
  return d === 0 ? 7 : d;
};

export default function Calendario() {
  const hoy = new Date();
  const hoyISO = toISO(hoy);

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);
  const [inicioSemana, setInicioSemana] = useState(startOfWeek(hoy));

  const [canchas, setCanchas] = useState([]);
  const [horas, setHoras] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);

  const [celdaActiva, setCeldaActiva] = useState(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [abono, setAbono] = useState("0");
  const [errorNombre, setErrorNombre] = useState(false);

  const [preciosCancha, setPreciosCancha] = useState([]);
  const [precioMaximo, setPrecioMaximo] = useState(null);
  const [errorAbono, setErrorAbono] = useState(false);

  const [errorLiberarPagado, setErrorLiberarPagado] = useState(false);

  /* =========================
     CARGA BASE
  ========================= */
  useEffect(() => {
    const cargarBase = async () => {
      setLoading(true);

      const [{ data: canchasData }, { data: horasData }, { data: preciosData }] =
        await Promise.all([
          supabase
            .from("canchas")
            .select("id, nombre")
            .eq("activa", true)
            .eq("recinto_id", RECINTO_ID)
            .order("nombre"),

          supabase
            .from("horarios_base")
            .select("id, hora")
            .eq("activo", true)
            .order("hora"),

          supabase
            .from("precios_cancha")
            .select("hora_inicio, hora_fin, dias_semana, precio")
            .eq("recinto_id", RECINTO_ID),
        ]);

      setCanchas(canchasData || []);
      setHoras(horasData || []);
      setPreciosCancha(preciosData || []);
      setLoading(false);
    };

    cargarBase();
  }, []);

  /* =========================
     AGENDA
  ========================= */
  const cargarAgenda = async () => {
    const inicio = toISO(inicioSemana);
    const fin = toISO(addDays(inicioSemana, 6));

    const { data } = await supabase
      .from("agenda_canchas")
      .select("id, cancha_id, horario_id, estado, nombre_cliente, fecha")
      .eq("recinto_id", RECINTO_ID)
      .gte("fecha", inicio)
      .lte("fecha", fin);

    setAgenda(data || []);
  };

  useEffect(() => {
    cargarAgenda();
  }, [inicioSemana]);

  /* =========================
     MAPA
  ========================= */
  const mapaAgenda = useMemo(() => {
    const map = {};
    agenda.forEach((a) => {
      map[`${a.fecha}_${a.cancha_id}_${a.horario_id}`] = a;
    });
    return map;
  }, [agenda]);

  const diasSemana = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(inicioSemana, i)),
    [inicioSemana]
  );

  const mesVisible = `${MESES[inicioSemana.getMonth()]} ${inicioSemana.getFullYear()}`;

  /* =========================
     PRECIO MAXIMO
  ========================= */
  const calcularPrecioMaximo = (fechaISO, horaStr) => {
    if (!fechaISO || !horaStr || !preciosCancha?.length) return null;

    const d = new Date(`${fechaISO}T00:00:00`);
    const dia = dayToDiasSemana(d);

    const match = preciosCancha.find((p) => {
      const dias = Array.isArray(p.dias_semana) ? p.dias_semana.map(Number) : [];
      return (
        dias.includes(dia) &&
        horaStr >= p.hora_inicio &&
        horaStr < p.hora_fin
      );
    });

    return match ? Number(match.precio) : null;
  };

  /* =========================
     ACCIONES (FIX 406 + BLOQUEO PASADO)
  ========================= */
  const aplicarEstado = async (estado) => {
    if (!celdaActiva) return;

    // 🔒 BLOQUEO DE DÍAS PASADOS
    if (fechaSeleccionada < hoyISO) {
      return;
    }

    if (estado === "reservada" && nombreCliente.trim() === "") {
      setErrorNombre(true);
      return;
    }

    if (estado === "reservada" && precioMaximo !== null) {
      const abonoNumCheck = Number(abono);
      if (!Number.isFinite(abonoNumCheck) || abonoNumCheck > precioMaximo) {
        setErrorAbono(true);
        return;
      }
    }

    setErrorNombre(false);
    setErrorAbono(false);
    setErrorLiberarPagado(false);

    const { data: agendaRows } = await supabase
      .from("agenda_canchas")
      .select("id")
      .eq("fecha", fechaSeleccionada)
      .eq("recinto_id", RECINTO_ID)
      .eq("cancha_id", celdaActiva.cancha_id)
      .eq("horario_id", celdaActiva.horario_id)
      .limit(1);

    const agendaRow = agendaRows?.[0] || null;

    if (agendaRow?.id) {
      const { data: pagosRows } = await supabase
        .from("pagos_reservas")
        .select("estado_pago")
        .eq("agenda_cancha_id", agendaRow.id)
        .limit(1);

      const pagoRow = pagosRows?.[0] || null;

      if (pagoRow?.estado_pago === "pagado") {
        setErrorLiberarPagado(true);
        return;
      }
    }

    if (estado === "disponible" && agendaRow?.id) {
      await supabase
        .from("pagos_reservas")
        .delete()
        .eq("agenda_cancha_id", agendaRow.id);

      await supabase
        .from("agenda_canchas")
        .delete()
        .eq("id", agendaRow.id);
    }

    if (estado === "reservada" || estado === "bloqueada") {
      const { data: agendaUpsert } = await supabase
        .from("agenda_canchas")
        .upsert(
          {
            recinto_id: RECINTO_ID,
            fecha: fechaSeleccionada,
            cancha_id: celdaActiva.cancha_id,
            horario_id: celdaActiva.horario_id,
            estado,
            nombre_cliente:
              estado === "reservada" ? nombreCliente.trim() : "Bloqueado",
          },
          { onConflict: "fecha,cancha_id,horario_id" }
        )
        .select()
        .limit(1);

      const agendaFinal = agendaUpsert?.[0];
      const abonoNum = Number(abono) >= 0 ? Number(abono) : 0;

      if (estado === "reservada" && agendaFinal?.id) {
        await supabase
          .from("pagos_reservas")
          .upsert(
            {
              agenda_cancha_id: agendaFinal.id,
              monto_abonado: abonoNum,
              monto_total: 0,
              estado_pago: abonoNum > 0 ? "abonado" : "por_pagar",
            },
            { onConflict: "agenda_cancha_id" }
          );
      }
    }

    setCeldaActiva(null);
    setNombreCliente("");
    setAbono("0");
    setPrecioMaximo(null);
    setErrorNombre(false);
    setErrorAbono(false);
    setErrorLiberarPagado(false);
    cargarAgenda();
  };

  if (loading) return <p>Cargando calendario...</p>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Calendario</h1>
      <p className="text-gray-500 mb-3">Vista general de horarios y canchas</p>

      <div className="text-lg font-bold mb-4">{mesVisible}</div>

      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setInicioSemana(addDays(inicioSemana, -7))}>◀</button>

        <div className="flex gap-2">
          {diasSemana.map((d, i) => {
            const iso = toISO(d);
            const activo = iso === fechaSeleccionada;
            const esPasado = iso < hoyISO;

            return (
              <button
                key={i}
                onClick={() => !esPasado && setFechaSeleccionada(iso)}
                disabled={esPasado}
                className={`px-3 py-2 rounded-lg border ${
                  activo ? "bg-black text-white" : "bg-white"
                } ${esPasado ? "opacity-40 cursor-not-allowed" : ""}`}
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
              <td className="p-2 border font-semibold">{h.hora.slice(0, 5)}</td>

              {canchas.map((c) => {
                const a = mapaAgenda[`${fechaSeleccionada}_${c.id}_${h.id}`];
                const estado = a?.estado || "disponible";

                return (
                  <td
                    key={`${c.id}_${h.id}`}
                    className={`p-2 border text-center ${
                      fechaSeleccionada < hoyISO
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (fechaSeleccionada < hoyISO) return;

                      setCeldaActiva({ cancha_id: c.id, horario_id: h.id, hora: h.hora });
                      setErrorNombre(false);
                      setErrorAbono(false);
                      setErrorLiberarPagado(false);
                      setAbono("0");

                      const max = calcularPrecioMaximo(fechaSeleccionada, h.hora);
                      setPrecioMaximo(max);
                    }}
                  >
                    {estado === "reservada" && (
                      <div className="text-xs font-bold mb-1">{a.nombre_cliente}</div>
                    )}

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        estado === "disponible"
                          ? "bg-green-100 text-green-700"
                          : estado === "bloqueada"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {estado === "disponible"
                        ? "Libre"
                        : estado === "bloqueada"
                        ? "Bloqueada"
                        : "Ocupada"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {celdaActiva && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80">
            <h3 className="font-bold mb-3">Gestionar horario</h3>

            <label className="block text-sm font-semibold text-black mb-1">
              Nombre del cliente
            </label>
            <input
              className={`border w-full p-2 rounded ${
                errorNombre ? "border-red-500" : ""
              }`}
              placeholder="Nombre cliente *"
              value={nombreCliente}
              onChange={(e) => {
                setNombreCliente(e.target.value);
                if (e.target.value.trim()) setErrorNombre(false);
              }}
            />

            {errorNombre && (
              <p className="text-red-600 text-sm mt-1">
                Debe rellenar este campo
              </p>
            )}

            <label className="block text-sm font-semibold text-black mt-3 mb-1">
              Abono
            </label>
            <input
              type="number"
              className="border w-full my-1 p-2 rounded"
              value={abono}
              min="0"
              onChange={(e) => {
                const val = e.target.value;
                setAbono(val);

                if (precioMaximo !== null) {
                  const num = Number(val);
                  setErrorAbono(!Number.isFinite(num) || num > precioMaximo);
                } else {
                  setErrorAbono(false);
                }
              }}
            />

            {errorAbono && precioMaximo !== null && (
              <p className="text-red-600 text-sm mt-1">
                Máximo ${precioMaximo}
              </p>
            )}

            <div className="flex gap-2 mb-4 mt-3">
              <button
                className="flex-1 bg-green-600 text-white py-2 rounded disabled:opacity-50"
                disabled={errorAbono}
                onClick={() => aplicarEstado("reservada")}
              >
                Reservar
              </button>

              <button
                className="flex-1 bg-gray-600 text-white py-2 rounded"
                onClick={() => aplicarEstado("bloqueada")}
              >
                Bloquear
              </button>
            </div>

            {errorLiberarPagado && (
              <p className="text-red-600 text-sm mt-2 text-center">
                Esta reserva está <strong>pagada</strong> y no puede modificarse desde el calendario.
              </p>
            )}

            <button
              className="w-full border py-2 rounded mb-2"
              onClick={() => aplicarEstado("disponible")}
            >
              Liberar
            </button>

            <button
              className="w-full text-sm text-gray-500"
              onClick={() => {
                setCeldaActiva(null);
                setErrorLiberarPagado(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
