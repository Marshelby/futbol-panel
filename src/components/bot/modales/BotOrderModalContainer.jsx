import BotOrderModal from "../BotOrderModal";

import HorariosFuncionamientoOrderModal from "./HorariosFuncionamientoOrderModal";
import ReservaOrderModal from "./ReservaOrderModal";
import EmergenciaOrderModal from "./EmergenciaOrderModal";
import ComunicacionOrderModal from "./ComunicacionOrderModal";

export default function BotOrderModalContainer({
  plantilla,
  valores,
  setValores,
  canchas = [],
  onCancel,
  onConfirm,
}) {
  if (!plantilla) return null;

  const renderContenido = () => {
    switch (plantilla.categoria) {
      case "Horarios y Funcionamiento":
        return (
          <HorariosFuncionamientoOrderModal
            plantilla={plantilla}
            valores={valores}
            setValores={setValores}
            canchas={canchas}
          />
        );

      case "Reservas":
        return (
          <ReservaOrderModal
            plantilla={plantilla}
            valores={valores}
            setValores={setValores}
            canchas={canchas}
          />
        );

      case "Emergencias":
        return (
          <EmergenciaOrderModal
            plantilla={plantilla}
            valores={valores}
            setValores={setValores}
            canchas={canchas}
          />
        );

      case "Comunicaciones":
        return (
          <ComunicacionOrderModal
            plantilla={plantilla}
            valores={valores}
            setValores={setValores}
          />
        );

      default:
        return null;
    }
  };

  return (
    <BotOrderModal
      plantilla={plantilla}
      valores={valores}
      setValores={setValores}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {renderContenido()}
    </BotOrderModal>
  );
}
