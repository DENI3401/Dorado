import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import "./index.css";
import App from "./App.tsx";
import { seedDemoDataOnFirstRun } from "./features/demo";

// F15: przy pierwszym uruchomieniu (puste magazyny) wczytaj dane demo. Przed renderem, żeby
// synchronizacja w AppLayout od razu zaksięgowała pensje i płatności subskrypcji demo.
seedDemoDataOnFirstRun();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);