import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./pages/Chat";
import GerarDocumento from "./pages/GerarDocumento";
import ListaDocumentos from "./pages/ListaDocumentos";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Chat />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/documentos/novo" element={<GerarDocumento />} />
        <Route path="/documentos" element={<ListaDocumentos />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
