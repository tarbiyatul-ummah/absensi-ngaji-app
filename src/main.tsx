import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/main.css";
import { applyOrganizationMetadata } from "./config/organization";

applyOrganizationMetadata();

const REDIRECT_STORAGE_KEY = "absensi-ngaji:redirect-path";

if (typeof window !== "undefined") {
  const redirectPath = window.sessionStorage.getItem(REDIRECT_STORAGE_KEY);
  if (redirectPath) {
    window.sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    window.history.replaceState(null, "", redirectPath);
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find root element with id 'root'");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

