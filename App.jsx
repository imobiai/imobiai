import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import GerarDocumento from "./pages/GerarDocumento";
import ListaDocumentos from "./pages/ListaDocumentos";
import Historico from "./pages/Historico";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/documentos/novo" element={<GerarDocumento />} />
        <Route path="/documentos" element={<ListaDocumentos />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
