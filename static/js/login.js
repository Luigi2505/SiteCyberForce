// ─── ALTERNAR ABAS LOGIN/CADASTRO ───
function switchTab(tab) {
    const loginPanel = document.getElementById('panel-login');
    const cadPanel = document.getElementById('panel-cadastro');
    const tabs = document.querySelectorAll('.auth-tab');

    if (tab === 'login') {
        loginPanel.classList.add('active');
        cadPanel.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginPanel.classList.remove('active');
        cadPanel.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// ─── FUNÇÕES DE VALIDAÇÃO ───

// Valida se o email tem o formato correto (ex: nome@dominio.com)
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validação matemática do CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g,'');
    if(cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i=0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    return rev == parseInt(cpf.charAt(10));
}

// Função auxiliar para exibir mensagens de erro/sucesso
function mostrarMensagem(texto, tipo) {
    const msgBox = document.getElementById('msg-cadastro');
    msgBox.className = "msg-box " + tipo; // 'error' ou 'success' baseado no seu CSS
    msgBox.innerText = texto;
    msgBox.style.display = "block"; // Força a mensagem a aparecer
}


// ─── PROTOCOLO DE CADASTRO ───
async function fazerCadastro() {
    // Esconde a mensagem anterior antes de tentar novamente
    document.getElementById('msg-cadastro').style.display = "none";

    // 1. Coleta e limpeza dos dados (.trim() remove espaços em branco acidentais)
    const nome = document.getElementById('cad-nome').value.trim();
    const cpf = document.getElementById('cad-cpf').value.trim();
    const data_nascimento = document.getElementById('cad-nasc').value.trim();
    const email = document.getElementById('cad-email').value.trim();
    const senha = document.getElementById('cad-senha').value; 

    // 2. Validação: Algum campo está vazio?
    if (!nome || !cpf || !data_nascimento || !email || !senha) {
        mostrarMensagem("// ERRO: TODOS OS CAMPOS DEVEM SER PREENCHIDOS", "error");
        return; // Para a execução aqui, não envia para o servidor
    }

    // 3. Validação: O Email é válido?
    if (!validarEmail(email)) {
        mostrarMensagem("// ERRO: FORMATO DE E-MAIL INVÁLIDO", "error");
        return;
    }

    // 4. Validação: O CPF é válido?
    if (!validarCPF(cpf)) {
        mostrarMensagem("// ERRO: CPF MATEMATICAMENTE INVÁLIDO", "error");
        return;
    }

    // Se passou em todas as verificações, monta o objeto para enviar
    const payload = {
        nome: nome,
        cpf: cpf,
        data_nascimento: data_nascimento,
        email: email,
        senha: senha
    };

    // Envia para o Flask
    try {
        const response = await fetch('/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.sucesso) {
            mostrarMensagem("// ACESSO_GERADO_COM_SUCESSO", "success");
            // Espera 2 segundos e joga o usuário para a aba de login
            setTimeout(() => switchTab('login'), 2000);
        } else {
            // Mostra o erro retornado pelo Python (ex: Email já existe)
            mostrarMensagem("// ERRO_SISTEMA: " + result.mensagem, "error");
        }
    } catch (e) {
        mostrarMensagem("// FALHA_DE_CONEXÃO_COM_SERVIDOR", "error");
    }
}
// Função auxiliar para exibir mensagens de erro/sucesso
function mostrarMensagem(texto, tipo) {
    const msgBox = document.getElementById('msg-cadastro');
    if (msgBox) {
        msgBox.className = "msg-box " + tipo; // 'error' ou 'success'
        msgBox.innerText = texto;
        msgBox.style.display = "block"; // Força a exibição
    } else {
        console.error("A div 'msg-cadastro' não foi encontrada no HTML!");
    }
}
// Adicione isto no final do seu login.js
async function fazerLogin() {
    const msgBox = document.getElementById('msg-login');
    if (msgBox) msgBox.style.display = "none";

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) {
        mostrarMensagem("// ERRO: PREENCHA EMAIL E SENHA", "error");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, senha: senha })
        });

        const result = await response.json();

        if (result.sucesso) {
            // LOGIN APROVADO! Redireciona para a página principal (index)
            window.location.href = '/'; 
        } else {
            // Mostra o erro (Ex: Senha incorreta)
            mostrarMensagem("// ACESSO NEGADO: " + result.mensagem, "error");
        }
    } catch (e) {
        mostrarMensagem("// FALHA DE CONEXÃO", "error");
    }
}
// ─── MÁSCARAS DE ENTRADA (NOVO) ───

// Formata o CPF como: 000.000.000-00
function mascaraCPF(valor) {
    let v = valor.replace(/\D/g, ""); // Remove tudo o que não for número
    if (v.length > 11) v = v.substring(0, 11); // Limita a 11 números reais
    
    v = v.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o primeiro ponto
    v = v.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o segundo ponto
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca o traço
    return v;
}

// Formata a Data como: DD/MM/AAAA
function mascaraData(valor) {
    let v = valor.replace(/\D/g, ""); // Remove tudo o que não for número
    if (v.length > 8) v = v.substring(0, 8); // Limita a 8 números reais
    
    v = v.replace(/(\d{2})(\d)/, "$1/$2"); // Coloca a primeira barra
    v = v.replace(/(\d{2})(\d)/, "$1/$2"); // Coloca a segunda barra
    return v;
}
async function fazerLogin() {
    const msgBox = document.getElementById('msg-login');
    if (msgBox) msgBox.style.display = "none";

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) {
        mostrarMensagem("// ERRO: PREENCHA EMAIL E SENHA", "error");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, senha: senha })
        });

        const result = await response.json();

        if (result.sucesso) {
            // SALVA O TIPO DE CONTA (Ex: 2 para Professor, 3 para Aluno)
            // O seu backend Flask deve enviar 'tipo_conta' no JSON de resposta
            localStorage.setItem('cyberforce_user_type', result.tipo_conta);
            localStorage.setItem('cyberforce_user_name', result.nome);

            // LOGIN APROVADO! Redireciona para a página principal
            window.location.href = '/'; 
        } else {
            mostrarMensagem("// ACESSO NEGADO: " + result.mensagem, "error");
        }
    } catch (e) {
        mostrarMensagem("// FALHA DE CONEXÃO", "error");
    }
}

