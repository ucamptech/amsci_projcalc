import "./index.css";

import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { BusyOverlayProvider } from "./contexts/BusyOverlayContext";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <BusyOverlayProvider>
        <App />
      </BusyOverlayProvider>
    </BrowserRouter>
  </StrictMode>,
);
