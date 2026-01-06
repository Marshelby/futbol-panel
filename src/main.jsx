import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BarberiaProvider } from "./context/BarberiaContext";
import { BarberProvider } from "./context/BarberContext";
import { EstadoProvider } from "./context/EstadoContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BarberiaProvider>
      <BarberProvider>
        <EstadoProvider>
          <App />
        </EstadoProvider>
      </BarberProvider>
    </BarberiaProvider>
  </React.StrictMode>
);
