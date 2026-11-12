import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "./components/AppLayout";
import Calendar from "./pages/Calendar";
import Placeholder from "./pages/Placeholder";
import Subscriptions from "./pages/Subscriptions";
import Transactions from "./pages/Transactions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Placeholder title="Dashboard" />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Placeholder title="Ustawienia" />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}