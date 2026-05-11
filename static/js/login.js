// ─── ALTERNAR ABAS LOGIN/CADASTRO ───
function switchTab(tab) {
  const loginPanel = document.getElementById("panel-login");
  const cadPanel = document.getElementById("panel-cadastro");
  const tabs = document.querySelectorAll(".auth-tab");
  const loginBox = document.querySelector(".login-box");

  if (tab === "login") {
    loginPanel.classList.add("active");
    cadPanel.classList.remove("active");
    tabs[0].classList.add("active");
    tabs[1].classList.remove("active");
    loginBox.classList.remove("wide"); // Reduz a caixa
  } else {
    loginPanel.classList.remove("active");
    cadPanel.classList.add("active");
    tabs[0].classList.remove("active");
    tabs[1].classList.add("active");
    loginBox.classList.add("wide"); // Expande a caixa
  }
}

// ─── MÁSCARAS DE ENTRADA ───
function mascaraCPF(valor) {
  let v = valor.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);

  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

function mascaraData(valor) {
  let v = valor.replace(/\D/g, "");
  if (v.length > 8) v = v.substring(0, 8);

  v = v.replace(/(\d{2})(\d)/, "$1/$2");
  v = v.replace(/(\d{2})(\d)/, "$1/$2");
  return v;
}

// ─── FUNÇÕES DE VALIDAÇÃO ───

// 1. Validar Nome (Só letras e espaços, com acentos)
function validarNome(nome) {
  const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
  // O nome precisa passar no teste de letras E ter tamanho 3 ou maior
  return regex.test(nome) && nome.trim().length >= 3;
}

// 2. Validar Data (Não pode ser no futuro)
function validarDataNascimento(dataTexto) {
  const partes = dataTexto.split("/");
  if (partes.length !== 3) return false;

  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1; // Meses no JS começam em 0
  const ano = parseInt(partes[2], 10);

  const dataInserida = new Date(ano, mes, dia);
  const hoje = new Date();

  if (isNaN(dataInserida.getTime())) return false;
  if (dataInserida > hoje) return false;

  return true;
}

// 3. Validar Senha (Mínimo 8 caracteres, Maiúscula, Número e Caractere Especial)
function validarSenha(senha) {
  const temTamanhoSuficiente = senha.length >= 8;
  const temMaiuscula = /[A-Z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temEspecial = /[^A-Za-z0-9]/.test(senha);

  return temTamanhoSuficiente && temMaiuscula && temNumero && temEspecial;
}

// 4. Validar Email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 5. Validar CPF Matemático
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  if (rev != parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev == 10 || rev == 11) rev = 0;
  return rev == parseInt(cpf.charAt(10));
}

// ─── EXIBIR MENSAGENS DE ERRO/SUCESSO ───
function mostrarMensagem(texto, tipo, isLogin = false) {
  const idCaixa = isLogin ? "msg-login" : "msg-cadastro";
  const msgBox = document.getElementById(idCaixa);

  if (msgBox) {
    msgBox.className = "msg-box " + tipo;
    msgBox.innerText = texto;
    msgBox.style.display = "block";
  }
}

// ─── PROTOCOLO DE CADASTRO ───
async function fazerCadastro() {
  document.getElementById("msg-cadastro").style.display = "none";

  const nome = document.getElementById("cad-nome").value.trim();
  const cpf = document.getElementById("cad-cpf").value.trim();
  const data_nascimento = document.getElementById("cad-nasc").value.trim();
  const email = document.getElementById("cad-email").value.trim();
  const senha = document.getElementById("cad-senha").value;
  const senhaConfirma = document.getElementById("cad-senha-confirma").value;
  const genero = document.getElementById("cad-genero").value;
  const peso = parseFloat(document.getElementById("cad-peso").value);
  const altura = parseInt(document.getElementById("cad-altura").value);

  // 1. Verificação de campos vazios
  if (!nome || !cpf || !data_nascimento || !email || !senha || !senhaConfirma) {
    mostrarMensagem(
      "// ERRO: TODOS OS CAMPOS DEVEM SER PREENCHIDOS",
      "error",
      false,
    );
    return;
  }

  if (senha !== senhaConfirma) {
    mostrarMensagem("// ERRO: AS SENHAS NÃO COINCIDEM", "error", false);
    return;
  }

  if (!validarNome(nome)) {
    mostrarMensagem("// ERRO: NOME INVALIDO", "error", false);
    return;
  }

  if (!validarDataNascimento(data_nascimento)) {
    mostrarMensagem(
      "// ERRO: DATA DE NASCIMENTO INVÁLIDA OU NO FUTURO",
      "error",
      false,
    );
    return;
  }

  if (!validarSenha(senha)) {
    mostrarMensagem(
      "// ERRO: SENHA DEVE TER NO MÍNIMO 8 CARACTERES, 1 MAIÚSCULA, 1 NÚMERO E 1 SÍMBOLO",
      "error",
      false,
    );
    return;
  }

  if (!validarEmail(email)) {
    mostrarMensagem("// ERRO: FORMATO DE E-MAIL INVÁLIDO", "error", false);
    return;
  }

  if (!validarCPF(cpf)) {
    mostrarMensagem("// ERRO: CPF MATEMATICAMENTE INVÁLIDO", "error", false);
    return;
  }

  if (!genero) {
    mostrarMensagem("// ERRO: SELECIONE UM GÊNERO", "error", false);
    return;
  }

  if (isNaN(peso) || peso < 30 || peso > 300) {
    mostrarMensagem(
      "// ERRO: PESO INVÁLIDO. DEVE SER ENTRE 30KG E 300KG",
      "error",
      false,
    );
    return;
  }

  if (isNaN(altura) || altura < 100 || altura > 250) {
    mostrarMensagem(
      "// ERRO: ALTURA INVÁLIDA. DEVE SER ENTRE 100CM E 250CM",
      "error",
      false,
    );
    return;
  }

  // Se tudo passar, monta o pacote e envia
  const payload = {
    nome: nome,
    cpf: cpf,
    data_nascimento: data_nascimento,
    email: email,
    senha: senha,
    genero: genero,
    peso: peso,
    altura: altura,
  };

  try {
    const response = await fetch("/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.sucesso) {
      mostrarMensagem("// ACESSO_GERADO_COM_SUCESSO", "success", false);
      // Aguarda 2 segundos e manda pra aba de login
      setTimeout(() => switchTab("login"), 2000);
    } else {
      mostrarMensagem("// ERRO_SISTEMA: " + result.mensagem, "error", false);
    }
  } catch (e) {
    mostrarMensagem("// FALHA_DE_CONEXÃO_COM_SERVIDOR", "error", false);
  }
}

// ─── PROTOCOLO DE LOGIN ───
async function fazerLogin() {
  const msgBox = document.getElementById("msg-login");
  if (msgBox) msgBox.style.display = "none";

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;

  if (!email || !senha) {
    mostrarMensagem("// ERRO: PREENCHA EMAIL E SENHA", "error", true);
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, senha: senha }),
    });

    const result = await response.json();

    if (result.sucesso) {
      // Salva as informações de apoio (o Flask já salvou a sessão segura no servidor)
      localStorage.setItem("cyberforce_user_type", result.perfil);
      localStorage.setItem("cyberforce_user_name", result.nome);
      localStorage.setItem("cyberforce_user_email", result.email);

      // Redireciona para a página principal
      window.location.href = "/";
    } else {
      mostrarMensagem("// ACESSO NEGADO: " + result.mensagem, "error", true);
    }
  } catch (e) {
    mostrarMensagem("// FALHA DE CONEXÃO", "error", true);
    console.error("Erro no login:", e);
  }
}

// ─── VISIBILIDADE DA SENHA (TEXTO CYBERPUNK) ───
function toggleSenha(inputId, spanElement) {
  const input = document.getElementById(inputId);

  if (input.type === "password") {
    input.type = "text";
    spanElement.innerText = "OCULTAR";
    spanElement.style.color = "var(--neon-red)"; // Cor de alerta quando a senha está visível
  } else {
    input.type = "password";
    spanElement.innerText = "EXIBIR";
    spanElement.style.color = "var(--cyan)"; // Cor normal
  }
}
