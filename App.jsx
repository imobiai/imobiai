import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import GerarDocumento from "./pages/GerarDocumento";
import ListaDocumentos from "./pages/ListaDocumentos";
import Historico from "./pages/Historico";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/documentos/novo" element={<GerarDocumento />} />
        <Route path="/documentos" element={<ListaDocumentos />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
