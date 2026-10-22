import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Placeholder from "./pages/Placeholder";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Placeholder title="Dashboard" />} />
          <Route path="/transactions" element={<Placeholder title="Transakcje" />} />
          <Route path="/subscriptions" element={<Placeholder title="Subskrypcje" />} />
          <Route path="/calendar" element={<Placeholder title="Kalendarz płatności" />} />
          <Route path="/settings" element={<Placeholder title="Ustawienia" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}