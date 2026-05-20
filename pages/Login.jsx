import { useState } from "react";
import { User } from "@/api/entities";

export default function Login() {
  const [modo, setModo] = useState("login"); // login | cadastro | recuperar
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("Imobiliária");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const TIPOS = ["Imobiliária", "Corretor", "Proprietário", "Advogado"];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await User.login(email, senha);
      window.location.href = "/";
    } catch (err) {
      setErro("E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await User.signup(email, senha, { full_name: nome, tipo_usuario: tipoUsuario });
      setMensagem("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
      setModo("login");
    } catch (err) {
      setErro(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await User.requestPasswordReset(email);
      setMensagem("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setModo("login");
    } catch (err) {
      setErro("Erro ao enviar e-mail. Verifique o endereço informado.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏢</div>
          <h1 className="text-3xl font-bold text-white">ImobiAI</h1>
          <p className="text-blue-200 mt-1">IA especializada em Direito Imobiliário</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {mensagem && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-5">
              ✅ {mensagem}
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              ⚠️ {erro}
            </div>
          )}

          {/* LOGIN */}
          {modo === "login" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Entrar na sua conta</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
                >
                  {carregando ? "Entrando..." : "Entrar"}
                </button>
              </form>
              <div className="flex justify-between mt-5 text-sm">
                <button onClick={() => { setModo("recuperar"); setErro(null); }} className="text-blue-600 hover:underline">
                  Esqueci minha senha
                </button>
                <button onClick={() => { setModo("cadastro"); setErro(null); }} className="text-blue-600 hover:underline">
                  Criar conta
                </button>
              </div>
            </>
          )}

          {/* CADASTRO */}
          {modo === "cadastro" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Criar conta</h2>
              <form onSubmit={handleCadastro} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome ou nome da imobiliária"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                  <select
                    value={tipoUsuario}
                    onChange={(e) => setTipoUsuario(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {TIPOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
                >
                  {carregando ? "Criando conta..." : "Criar conta"}
                </button>
              </form>
              <button onClick={() => { setModo("login"); setErro(null); }} className="mt-4 text-sm text-blue-600 hover:underline w-full text-center">
                ← Voltar para o login
              </button>
            </>
          )}

          {/* RECUPERAR SENHA */}
          {modo === "recuperar" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Recuperar senha</h2>
              <p className="text-sm text-gray-500 mb-6">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
              <form onSubmit={handleRecuperar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
                >
                  {carregando ? "Enviando..." : "Enviar link de recuperação"}
                </button>
              </form>
              <button onClick={() => { setModo("login"); setErro(null); }} className="mt-4 text-sm text-blue-600 hover:underline w-full text-center">
                ← Voltar para o login
              </button>
            </>
          )}
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          ⚠️ Respostas orientativas — não substituem consultoria jurídica formal
        </p>
      </div>
    </div>
  );
}
