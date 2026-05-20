#!/bin/bash
# ============================================================
# 🧪 TESTE AUTOMATIZADO — Tela de Login ImobiAI
# Valida: estrutura do código, fluxos, campos e navegação
# ============================================================

LOGIN_FILE="/app/pages/Login.jsx"
APP_FILE="/app/App.jsx"

PASS=0
FAIL=0

check() {
  local label="$1"
  local condicao="$2"
  if eval "$condicao" > /dev/null 2>&1; then
    echo "  ✅ $label"
    PASS=$((PASS+1))
  else
    echo "  ❌ $label"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "================================================"
echo "  🧪 TESTE — Tela de Login ImobiAI"
echo "  📅 $(date '+%d/%m/%Y %H:%M:%S')"
echo "================================================"
echo ""

# ── BLOCO 1: Arquivo existe ──────────────────────────────
echo "📂 1. Estrutura de arquivos"
check "Login.jsx existe"         "[ -f $LOGIN_FILE ]"
check "App.jsx existe"           "[ -f $APP_FILE ]"
check "Login.jsx não está vazio" "[ -s $LOGIN_FILE ]"
echo ""

# ── BLOCO 2: Tela de Login ───────────────────────────────
echo "🔐 2. Formulário de Login"
check "Campo e-mail presente"         "grep -q 'type=\"email\"' $LOGIN_FILE"
check "Campo senha presente"          "grep -q 'type=\"password\"' $LOGIN_FILE"
check "Botão de submit (Entrar)"      "grep -q 'Entrar' $LOGIN_FILE"
check "Handler onSubmit no form"      "grep -q 'onSubmit' $LOGIN_FILE"
check "Estado de carregando"          "grep -q 'carregando' $LOGIN_FILE"
check "Exibe mensagem de erro"        "grep -q 'setErro' $LOGIN_FILE"
check "Chama User.login()"            "grep -q 'User.login' $LOGIN_FILE"
echo ""

# ── BLOCO 3: Cadastro ────────────────────────────────────
echo "📝 3. Formulário de Cadastro"
check "Modo cadastro implementado"          "grep -q 'modo.*cadastro\|cadastro.*modo' $LOGIN_FILE"
check "Campo nome completo"                 "grep -q 'nome\|full_name' $LOGIN_FILE"
check "Select de tipo de usuário"           "grep -q 'tipoUsuario\|tipo_usuario' $LOGIN_FILE"
check "Opção Imobiliária"                   "grep -q 'Imobiliária' $LOGIN_FILE"
check "Opção Corretor"                      "grep -q 'Corretor' $LOGIN_FILE"
check "Opção Advogado"                      "grep -q 'Advogado' $LOGIN_FILE"
check "Chama User.signup()"                 "grep -q 'User.signup' $LOGIN_FILE"
check "Senha mínimo 6 caracteres"           "grep -q 'minLength\|min.*6\|6.*min' $LOGIN_FILE"
echo ""

# ── BLOCO 4: Recuperação de Senha ───────────────────────
echo "🔑 4. Recuperação de Senha"
check "Modo recuperar implementado"         "grep -q 'recuperar' $LOGIN_FILE"
check "Link 'Esqueci minha senha'"          "grep -q 'Esqueci' $LOGIN_FILE"
check "Chama User.requestPasswordReset()"   "grep -q 'requestPasswordReset' $LOGIN_FILE"
check "Mensagem de confirmação de envio"    "grep -q 'enviado\|Enviado' $LOGIN_FILE"
echo ""

# ── BLOCO 5: Navegação entre modos ──────────────────────
echo "🔄 5. Navegação entre modos"
check "Botão para ir ao cadastro"           "grep -q 'Criar conta' $LOGIN_FILE"
check "Botão voltar para login"             "grep -q 'Voltar\|voltar' $LOGIN_FILE"
check "Estado 'modo' controla telas"        "grep -q 'setModo' $LOGIN_FILE"
echo ""

# ── BLOCO 6: UX e Acessibilidade ────────────────────────
echo "🎨 6. UX e Acessibilidade"
check "Label no campo e-mail"               "grep -q '<label' $LOGIN_FILE"
check "Placeholder nos inputs"              "grep -q 'placeholder' $LOGIN_FILE"
check "Botão desabilitado ao carregar"      "grep -q 'disabled.*carregando\|carregando.*disabled' $LOGIN_FILE"
check "Aviso legal exibido"                 "grep -q 'consultoria jurídica\|orientativas' $LOGIN_FILE"
check "Logo ImobiAI na tela"                "grep -q 'ImobiAI' $LOGIN_FILE"
echo ""

# ── BLOCO 7: Proteção de Rotas ──────────────────────────
echo "🛡️  7. Proteção de Rotas (App.jsx)"
check "Componente RotaProtegida"            "grep -q 'RotaProtegida' $APP_FILE"
check "Login importado no App"              "grep -q 'import.*Login' $APP_FILE"
check "Rota /login definida"                "grep -q 'path.*login\|login.*path' $APP_FILE"
check "Redirecionamento sem auth"           "grep -q 'Navigate.*login\|login.*Navigate' $APP_FILE"
check "User.me() para verificar sessão"     "grep -q 'User.me' $APP_FILE"
echo ""

# ── RESUMO ───────────────────────────────────────────────
TOTAL=$((PASS+FAIL))
echo "================================================"
echo "  📊 RESULTADO FINAL"
echo "================================================"
echo "  Total:    $TOTAL testes"
echo "  ✅ Passou: $PASS"
echo "  ❌ Falhou: $FAIL"
if [ $FAIL -eq 0 ]; then
  echo ""
  echo "  🎉 TODOS OS TESTES PASSARAM!"
else
  echo ""
  echo "  ⚠️  $FAIL teste(s) falharam — revisar acima."
fi
echo "================================================"
echo ""

exit $FAIL
