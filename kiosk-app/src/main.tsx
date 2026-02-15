import React from "react";
import ReactDOM from "react-dom/client";
import ElectronWrapper from "./ElectronWrapper";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ElectronWrapper />
  </React.StrictMode>,
);
