import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import GestionarHorarioModal from "../components/calendario/GestionarHorarioModal";

/* =========================
   FECHAS (LOCAL)
========================= */
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const toISO = (d) => d.toLocaleDateString("sv-SE");

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

const dayToDiasSemana = (jsDate) => {
  const d = jsDate.getDay();
  return d === 0 ? 7 : d;
};

export default function Calendario() {
  const { recinto } = useAuth();
  const recintoId = recinto?.id;

  const hoy = new Date();
  const hoyISO = toISO(hoy);

  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);
  const [inicioSemana, setInicioSemana] = useState(startOfWeek(hoy));

  const [canchas, setCanchas] = useState([]);
  const [horas, setHoras] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     CRONOGRAMA RESUMEN
  ========================= */
  const [cronogramaSemana, setCronogramaSemana] = useState([]);

  const cronogramaMap = useMemo(() => {
    const map = {};
    cronogramaSemana.forEach((c) => {
      map[c.fecha] = c;
    });
    return map;
  }, [cronogramaSemana]);

  const cronogramaDelDia = cronogramaMap[fechaSeleccionada] || null;

  const diaCerrado = cronogramaDelDia?.tipo === "CERRADO";
  const diaHorarioEspecial = cronogramaDelDia?.tipo === "HORARIO_ESPECIAL";

  /* =========================
     MODAL
  ========================= */
  const [celdaActiva, setCeldaActiva] = useState(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [abono, setAbono] = useState("0");

  const [errorNombre, setErrorNombre] = useState(false);
  const [errorTelefono, setErrorTelefono] = useState(false);
  const [errorAbono, setErrorAbono] = useState(false);
  const [errorLiberarPagado, setErrorLiberarPagado] = useState(false);

  const [preciosCancha, setPreciosCancha] = useState([]);
  const [precioMaximo, setPrecioMaximo] = useState(null);

  /* =========================
     CARGA BASE
  ========================= */
  useEffect(() => {
    if (!recintoId) return;

    const cargarBase = async () => {
      setLoading(true);

      const [{ data: canchasData }, { data: horasData }, { data: preciosData }] =
        await Promise.all([
          supabase
            .from("canchas")
            .select("id, nombre")
            .eq("activa", true)
            .eq("recinto_id", recintoId)
            .order("nombre"),

          supabase
            .from("horarios_base")
            .select("id, hora")
            .eq("activo", true)
            .order("hora"),

          supabase
            .from("precios_cancha")
            .select("hora_inicio, hora_fin, dias_semana, precio")
            .eq("recinto_id", recintoId),
        ]);

      setCanchas(canchasData || []);
      setHoras(horasData || []);
      setPreciosCancha(preciosData || []);
      setLoading(false);
    };

    cargarBase();
  }, [recintoId]);

  /* =========================
     CRONOGRAMA SEMANAL
  ========================= */
  useEffect(() => {
    if (!recintoId) return;

    const cargarCronogramaSemana = async () => {
      const inicio = toISO(inicioSemana);
      const fin = toISO(addDays(inicioSemana, 6));

      const { data } = await supabase
        .from("cronograma_resumen")
        .select("fecha, tipo, hora_apertura, hora_cierre")
        .eq("recinto_id", recintoId)
        .gte("fecha", inicio)
        .lte("fecha", fin);

      setCronogramaSemana(data || []);
    };

    cargarCronogramaSemana();
  }, [inicioSemana, recintoId]);

  /* =========================
     AGENDA
  ========================= */
  const cargarAgenda = async () => {
    if (!recintoId) return;

    const inicio = toISO(inicioSemana);
    const fin = toISO(addDays(inicioSemana, 6));

    const { data } = await supabase
      .from("agenda_canchas")
      .select("id, cancha_id, horario_id, estado, nombre_cliente, fecha")
      .eq("recinto_id", recintoId)
      .gte("fecha", inicio)
      .lte("fecha", fin);

    setAgenda(data || []);
  };

  useEffect(() => {
    cargarAgenda();
  }, [inicioSemana, recintoId]);

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

  const calcularPrecioMaximo = (fechaISO, horaStr) => {
    if (!fechaISO || !horaStr || !preciosCancha.length) return null;

    const d = new Date(`${fechaISO}T00:00:00`);
    const dia = dayToDiasSemana(d);

    const match = preciosCancha.find((p) => {
      const dias = Array.isArray(p.dias_semana) ? p.dias_semana.map(Number) : [];
      return dias.includes(dia) && horaStr >= p.hora_inicio && horaStr < p.hora_fin;
    });

    return match ? Number(match.precio) : null;
  };

  /* =========================
     CERRAR MODAL SI CIERRE
  ========================= */
  useEffect(() => {
    if (diaCerrado && celdaActiva) {
      setCeldaActiva(null);
    }
  }, [diaCerrado, celdaActiva]);

  if (loading) return <p>Cargando calendario...</p>;

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Calendario</h1>
      <p className="text-gray-500 mb-3">Vista general de horarios y canchas</p>

      {diaCerrado && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 font-semibold">
          🚫 ESTE DÍA EL RECINTO ESTÁ CERRADO SEGÚN CRONOGRAMA
        </div>
      )}

      {diaHorarioEspecial && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-800 font-semibold">
          ⏰ DÍA CON HORARIO ESPECIAL
          {cronogramaDelDia?.hora_apertura && cronogramaDelDia?.hora_cierre && (
            <span className="ml-2">
              ({cronogramaDelDia.hora_apertura.slice(0,5)} –{" "}
              {cronogramaDelDia.hora_cierre.slice(0,5)})
            </span>
          )}
        </div>
      )}

      <div className="text-lg font-bold mb-4">{mesVisible}</div>

      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setInicioSemana(addDays(inicioSemana, -7))}>◀</button>

        <div className="flex gap-2">
          {diasSemana.map((d, i) => {
            const iso = toISO(d);
            const activo = iso === fechaSeleccionada;
            const esPasado = iso < hoyISO;
            const estadoDia = cronogramaMap[iso];

            const cerrado = estadoDia?.tipo === "CERRADO";
            const especial = estadoDia?.tipo === "HORARIO_ESPECIAL";

            return (
              <button
                key={i}
                onClick={() => !esPasado && setFechaSeleccionada(iso)}
                disabled={esPasado}
                className={`px-3 py-2 rounded-lg border relative
                  ${activo ? "bg-black text-white" : "bg-white"}
                  ${esPasado ? "opacity-40 cursor-not-allowed" : ""}
                  ${cerrado ? "border-red-500 bg-red-50" : ""}
                  ${especial ? "border-yellow-500 bg-yellow-50" : ""}
                `}
              >
                <div>{DIAS[i]}</div>
                <div className="text-xs">
                  {d.getDate()}/{d.getMonth() + 1}
                </div>

                {cerrado && (
                  <span className="absolute top-1 right-1 text-xs bg-red-600 text-white px-1 rounded">
                    CERRADO
                  </span>
                )}

                {especial && (
                  <span className="absolute top-1 right-1 text-xs bg-yellow-400 text-black px-1 rounded">
                    ESPECIAL
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button onClick={() => setInicioSemana(addDays(inicioSemana, 7))}>▶</button>
      </div>

      <table className={`w-full border rounded-lg ${diaCerrado ? "opacity-50 pointer-events-none" : ""}`}>
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Hora</th>
            {canchas.map((c) => (
              <th key={c.id} className="p-2 border">{c.nombre}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {horas.map((h) => {
            const fueraHorarioEspecial =
              diaHorarioEspecial &&
              (
                h.hora < cronogramaDelDia?.hora_apertura ||
                h.hora >= cronogramaDelDia?.hora_cierre
              );

            return (
              <tr key={h.id}>
                <td className="p-2 border font-semibold">{h.hora.slice(0,5)}</td>

                {canchas.map((c) => {
                  const a = mapaAgenda[`${fechaSeleccionada}_${c.id}_${h.id}`];
                  const estado = a?.estado || "disponible";

                  const bloqueadaPorHorario = fueraHorarioEspecial || diaCerrado;

                  return (
                    <td
                      key={`${c.id}_${h.id}`}
                      className={`p-2 border text-center ${
                        bloqueadaPorHorario || fechaSeleccionada < hoyISO
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      onClick={() => {
                        if (fechaSeleccionada < hoyISO) return;
                        if (bloqueadaPorHorario) return;

                        setCeldaActiva({
                          cancha_id: c.id,
                          cancha_nombre: c.nombre,
                          horario_id: h.id,
                          hora: h.hora.slice(0,5),
                          fecha: fechaSeleccionada,
                        });

                        setPrecioMaximo(
                          calcularPrecioMaximo(fechaSeleccionada, h.hora)
                        );
                      }}
                      title={
                        fueraHorarioEspecial
                          ? "Hora fuera del horario especial"
                          : diaCerrado
                          ? "Recinto cerrado"
                          : ""
                      }
                    >
                      {bloqueadaPorHorario ? (
                        <span className="text-xs text-gray-500">No disponible</span>
                      ) : (
                        <>
                          {estado === "reservada" && (
                            <div className="text-xs font-bold mb-1">
                              {a.nombre_cliente}
                            </div>
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
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <GestionarHorarioModal
        visible={!!celdaActiva}
        contexto={celdaActiva}
        nombreCliente={nombreCliente}
        setNombreCliente={setNombreCliente}
        telefono={telefono}
        setTelefono={setTelefono}
        abono={abono}
        setAbono={setAbono}
        errorNombre={errorNombre}
        errorTelefono={errorTelefono}
        errorAbono={errorAbono}
        errorLiberarPagado={errorLiberarPagado}
        precioMaximo={precioMaximo}
        onReservar={() => aplicarEstado("reservada")}
        onBloquear={() => aplicarEstado("bloqueada")}
        onLiberar={() => aplicarEstado("disponible")}
        onCancelar={() => setCeldaActiva(null)}
      />
    </div>
  );
}
