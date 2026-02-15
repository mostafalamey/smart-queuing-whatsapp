import React from "react";
import ReactDOM from "react-dom/client";
import ElectronWrapper from "./ElectronWrapper";
import { LanguageProvider } from "./i18n";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <ElectronWrapper />
    </LanguageProvider>
  </React.StrictMode>,
);
