import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";
import { DataProvider } from "./data/store.tsx";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import { purgeStaleStorage } from "./lib/cleanup";

purgeStaleStorage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
);
