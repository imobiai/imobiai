import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { User } from "@/api/entities";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import GerarDocumento from "./pages/GerarDocumento";
import ListaDocumentos from "./pages/ListaDocumentos";
import Historico from "./pages/Historico";
import Login from "./pages/Login";

function RotaProtegida({ children }) {
  const [usuario, setUsuario] = useState(undefined); // undefined = carregando

  useEffect(() => {
    User.me()
      .then((u) => setUsuario(u))
      .catch(() => setUsuario(null));
  }, []);

  if (usuario === undefined) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-blue-200">Carregando ImobiAI...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RotaProtegida><Dashboard /></RotaProtegida>} />
        <Route path="/chat" element={<RotaProtegida><Chat /></RotaProtegida>} />
        <Route path="/documentos/novo" element={<RotaProtegida><GerarDocumento /></RotaProtegida>} />
        <Route path="/documentos" element={<RotaProtegida><ListaDocumentos /></RotaProtegida>} />
        <Route path="/historico" element={<RotaProtegida><Historico /></RotaProtegida>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
