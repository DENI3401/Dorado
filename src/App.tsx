import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "./components/AppLayout";
import Placeholder from "./pages/Placeholder";
import Transactions from "./pages/Transactions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Placeholder title="Dashboard" />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/subscriptions" element={<Placeholder title="Subskrypcje" />} />
          <Route path="/calendar" element={<Placeholder title="Kalendarz płatności" />} />
          <Route path="/settings" element={<Placeholder title="Ustawienia" />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}