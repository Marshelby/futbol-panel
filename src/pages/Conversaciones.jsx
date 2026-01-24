import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

import BotControlPanel from "../components/bot/BotControlPanel";
// import ChatCliente from "../components/chat/ChatCliente"; // futuro

const CANAL_BOT = {
  id: "admin-bot",
  tipo: "bot",
};

export default function Conversaciones() {
  const { recinto } = useAuth();

  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(CANAL_BOT);

  const esCanalBot = conversacionActiva.tipo === "bot";

  /* ========================= */
  /* MOCK DE CONVERSACIONES    */
  /* ========================= */
  useEffect(() => {
    const mockConversaciones = [
      CANAL_BOT,
      {
        id: "1",
        tipo: "cliente",
        telefono_cliente: "+56911111111",
        nombre_cliente: "Juan Pérez",
      },
      {
        id: "2",
        tipo: "cliente",
        telefono_cliente: "+56922222222",
        nombre_cliente: "María Soto",
      },
      {
        id: "3",
        tipo: "cliente",
        telefono_cliente: "+56933333333",
        nombre_cliente: "Pedro Rojas",
      },
    ];

    setConversaciones(mockConversaciones);
  }, []);

  /* ========================= */
  /* RENDER                    */
  /* ========================= */
  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* LISTA IZQUIERDA */}
      <div className="w-80 bg-white border-2 border-black rounded-xl overflow-hidden flex flex-col">
        {/* HEADER NEGRO */}
        <div className="p-4 bg-black text-white border-b border-black">
          <h2 className="font-extrabold text-2xl">Conversaciones</h2>
          <p className="text-sm font-semibold">
            Chats del bot por WhatsApp
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversaciones.map((c) => {
            const activo = conversacionActiva.id === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setConversacionActiva(c)}
                className={`flex items-start gap-3 p-4 border-b cursor-pointer transition
                  ${
                    activo
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                {/* PUNTO / AVATAR */}
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1 ${
                    activo ? "bg-blue-600" : "bg-gray-400"
                  }`}
                />

                <div>
                  {c.tipo === "bot" ? (
                    <>
                      <div className="font-bold text-sm text-gray-900">
                        DALE UNA ORDEN AL CHATBOT
                      </div>
                      <div className="text-xs text-gray-500">
                        Panel de control
                      </div>
                    </>
                  ) : (
                    <>
                      {/* TELÉFONO */}
                      <div className="text-lg font-extrabold text-gray-900">
                        {c.telefono_cliente}
                      </div>

                      {/* NOMBRE */}
                      <div className="text-sm font-medium text-gray-500">
                        {c.nombre_cliente}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="flex-1 bg-white border-2 border-black rounded-xl overflow-hidden">
        {esCanalBot ? (
          <BotControlPanel />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Selecciona una conversación
            {/* <ChatCliente conversacion={conversacionActiva} /> */}
          </div>
        )}
      </div>
    </div>
  );
}
