import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

import BotTemplate from "./BotTemplate";
import BotOrderModalContainer from "./modales/BotOrderModalContainer";

import OrderStatusPanel from "./OrderStatusPanel";
import OrderHistoryPanel from "./OrderHistoryPanel";

// 🔌 NUEVO: resolver de valores
import resolverValores from "./utils/resolverValores";

export default function BotControlPanel() {
  const { recinto } = useAuth();
  const recintoId = recinto?.id;

  const [plantillas, setPlantillas] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [valores, setValores] = useState({});

  const [canchas, setCanchas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);

  const categoriaTimeoutRef = useRef(null);

  /* ========================= */
  /* CARGA PLANTILLAS          */
  /* ========================= */
  useEffect(() => {
    const cargarPlantillas = async () => {
      const { data } = await supabase
        .from("bot_plantillas")
        .select("*")
        .eq("activo", true)
        .order("orden_categoria")
        .order("orden_item");

      setPlantillas(data || []);
    };

    cargarPlantillas();
  }, []);

  /* ========================= */
  /* CARGA CANCHAS             */
  /* ========================= */
  useEffect(() => {
    if (!recintoId) return;

    const cargarCanchas = async () => {
      const { data } = await supabase
        .from("canchas")
        .select("id, nombre")
        .eq("recinto_id", recintoId)
        .eq("activa", true)
        .order("nombre");

      setCanchas(data || []);
    };

    cargarCanchas();
  }, [recintoId]);

  /* ========================= */
  /* CARGA ÓRDENES             */
  /* ========================= */
  useEffect(() => {
    if (!recintoId) return;

    const cargarOrdenes = async () => {
      const { data } = await supabase
        .from("v_bot_ordenes_estado")
        .select("*")
        .eq("recinto_id", recintoId)
        .order("created_at", { ascending: false });

      setOrdenes(data || []);
    };

    cargarOrdenes();
  }, [recintoId]);

  /* ========================= */
  /* AUTO-CIERRE CATEGORÍA 15s */
  /* ========================= */
  useEffect(() => {
    if (!categoriaActiva) return;

    if (categoriaTimeoutRef.current) {
      clearTimeout(categoriaTimeoutRef.current);
    }

    categoriaTimeoutRef.current = setTimeout(() => {
      setCategoriaActiva(null);
    }, 15000);

    return () => {
      if (categoriaTimeoutRef.current) {
        clearTimeout(categoriaTimeoutRef.current);
      }
    };
  }, [categoriaActiva]);

  /* ========================= */
  /* CONFIRMAR ORDEN           */
  /* ========================= */
  const confirmarOrden = async () => {
    if (!plantillaSeleccionada || !recintoId) return;

    // 🧠 NUEVO: resolver valores antes de construir el mensaje
    const valoresResueltos = resolverValores({
      plantilla: plantillaSeleccionada,
      valores,
      canchas,
    });

    let mensaje = plantillaSeleccionada.mensaje_publico_template;

    Object.entries(valoresResueltos).forEach(([k, v]) => {
      mensaje = mensaje.replace(`{{${k}}}`, v);
    });

    const ordenOptimista = {
      id: `temp-${Date.now()}`,
      recinto_id: recintoId,
      mensaje_publico: mensaje,
      estado_orden: "enviando",
      created_at: new Date().toISOString(),
    };

    setOrdenes((prev) => [ordenOptimista, ...prev]);

    setPlantillaSeleccionada(null);
    setCategoriaActiva(null);
    setValores({});

    await supabase.from("bot_ordenes").insert({
      recinto_id: recintoId,
      tipo_orden: plantillaSeleccionada.tipo_orden,
      mensaje_publico: mensaje,
      estado_orden: "enviando",
      creada_por: "admin",
    });
  };

  /* ========================= */
  /* DERIVADOS                 */
  /* ========================= */
  const categorias = [...new Set(plantillas.map((p) => p.categoria))];

  const plantillasFiltradas = categoriaActiva
    ? plantillas.filter((p) => p.categoria === categoriaActiva)
    : [];

  const ordenesEnEjecucion = ordenes.filter(
    (o) => o.estado_orden === "en_ejecucion"
  );

  const ordenesActivas = ordenes.filter(
    (o) => o.estado_orden === "orden_activa"
  );

  /* ========================= */
  /* RENDER                    */
  /* ========================= */
  return (
    <div className="h-full w-full flex flex-col bg-[#F4F8FF] border border-black rounded-xl overflow-hidden">

      {/* HEADER */}
      <div className="p-4 bg-[#1E3A8A] text-white">
        <h2 className="text-2xl font-bold">
          Órdenes disponibles para el chatbot
        </h2>
        <p className="text-sm text-blue-200">
          Control operativo del bot que responde WhatsApp en automático
        </p>
      </div>

      {/* TEXTO GUÍA DESTACADO */}
      <div className="px-4 py-3 bg-white border-b border-black">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
          <p className="text-lg font-bold text-gray-900 tracking-tight">
            {categoriaActiva ? "Escoge una plantilla" : "Escoge una categoría"}
          </p>
        </div>
      </div>

      {/* CATEGORÍAS / PLANTILLAS */}
      <div className="bg-white border-b border-black">
        <BotTemplate
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          setCategoriaActiva={setCategoriaActiva}
          plantillasFiltradas={plantillasFiltradas}
          onSelectPlantilla={(p) => {
            setPlantillaSeleccionada(p);
            setValores({});
          }}
        />
      </div>

      {/* CUERPO */}
      <div className="flex-1 min-h-0 p-4">
        <div className="h-full grid grid-cols-2 gap-4">
          <OrderStatusPanel
            enEjecucion={ordenesEnEjecucion}
            activas={ordenesActivas}
          />
          <OrderHistoryPanel historial={ordenes} />
        </div>
      </div>

      {/* MODAL PLANTILLA */}
      <BotOrderModalContainer
        plantilla={plantillaSeleccionada}
        valores={valores}
        setValores={setValores}
        canchas={canchas}
        onCancel={() => setPlantillaSeleccionada(null)}
        onConfirm={confirmarOrden}
      />
    </div>
  );
}
