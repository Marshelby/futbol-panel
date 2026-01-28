// src/components/bot/utils/resolverValores.js

export default function resolverValores({
  plantilla,
  valores,
  canchas = [],
}) {
  if (!plantilla?.variables || !valores) return {};

  const resultado = {};

  plantilla.variables.forEach((variable) => {
    const { key, type } = variable;
    const valor = valores[key];

    // Valor inexistente
    if (valor === undefined || valor === null) {
      resultado[key] = "";
      return;
    }

    /* ===============================
       FECHA
    =============================== */
    if (type === "date") {
      const { day, month, year } = valor || {};
      if (day && month && year) {
        resultado[key] = `${day}/${month}/${year}`;
      } else {
        resultado[key] = "";
      }
      return;
    }

    /* ===============================
       HORA
    =============================== */
    if (type === "time") {
      const { hour, minute } = valor || {};
      if (hour !== undefined && minute !== undefined) {
        resultado[key] = `${hour}:${minute}`;
      } else {
        resultado[key] = "";
      }
      return;
    }

    /* ===============================
       CANCHA (tolerante)
       acepta: cancha | cancha_id
    =============================== */
    if (type === "cancha" || type === "cancha_id") {
      const cancha = canchas.find((c) => c.id === valor);
      resultado[key] = cancha ? cancha.nombre : "";
      return;
    }

    /* ===============================
       SELECT
       (el valor ya es el texto final)
    =============================== */
    if (type === "select") {
      resultado[key] = String(valor);
      return;
    }

    /* ===============================
       TEXTAREA
    =============================== */
    if (type === "textarea") {
      resultado[key] = String(valor);
      return;
    }

    /* ===============================
       CONFIRM
       (solo control UI, no va al mensaje)
    =============================== */
    if (type === "confirm") {
      resultado[key] = "";
      return;
    }

    /* ===============================
       TEXTO / FALLBACK
    =============================== */
    resultado[key] = String(valor);
  });

  return resultado;
}
