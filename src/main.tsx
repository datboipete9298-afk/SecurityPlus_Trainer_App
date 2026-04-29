import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ProgressProvider } from "./context/ProgressContext";
import { PdfLibraryProvider } from "./context/PdfLibraryContext";
import AppErrorBoundary from "./components/AppErrorBoundary";
import App from "./App";
import { registerServiceWorker } from "./utils/registerServiceWorker";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProgressProvider>
        <PdfLibraryProvider>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </PdfLibraryProvider>
      </ProgressProvider>
    </BrowserRouter>
  </React.StrictMode>
);

registerServiceWorker();
