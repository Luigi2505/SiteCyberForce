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
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

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

// ─── EXIBIR MENSAGENS DE ERRO/SUCESSO ───
// Adicionei o parâmetro 'isLogin' para a mensagem aparecer no lugar certo
function mostrarMensagem(texto, tipo, isLogin = false) {
    const idCaixa = isLogin ? 'msg-login' : 'msg-cadastro';
    const msgBox = document.getElementById(idCaixa);
    
    if (msgBox) {
        msgBox.className = "msg-box " + tipo; 
        msgBox.innerText = texto;
        msgBox.style.display = "block"; 
    }
}

// ─── PROTOCOLO DE CADASTRO ───
async function fazerCadastro() {
    document.getElementById('msg-cadastro').style.display = "none";

    const nome = document.getElementById('cad-nome').value.trim();
    const cpf = document.getElementById('cad-cpf').value.trim();
    const data_nascimento = document.getElementById('cad-nasc').value.trim();
    const email = document.getElementById('cad-email').value.trim();
    const senha = document.getElementById('cad-senha').value; 

    if (!nome || !cpf || !data_nascimento || !email || !senha) {
        mostrarMensagem("// ERRO: TODOS OS CAMPOS DEVEM SER PREENCHIDOS", "error", false);
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

    const payload = {
        nome: nome,
        cpf: cpf,
        data_nascimento: data_nascimento,
        email: email,
        senha: senha
    };

    try {
        const response = await fetch('/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.sucesso) {
            mostrarMensagem("// ACESSO_GERADO_COM_SUCESSO", "success", false);
            setTimeout(() => switchTab('login'), 2000);
        } else {
            mostrarMensagem("// ERRO_SISTEMA: " + result.mensagem, "error", false);
        }
    } catch (e) {
        mostrarMensagem("// FALHA_DE_CONEXÃO_COM_SERVIDOR", "error", false);
    }
}

// ─── PROTOCOLO DE LOGIN ───
async function fazerLogin() {
    const msgBox = document.getElementById('msg-login');
    if (msgBox) msgBox.style.display = "none";

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!email || !senha) {
        // Agora passa 'true' no final para a mensagem aparecer na aba de login
        mostrarMensagem("// ERRO: PREENCHA EMAIL E SENHA", "error", true);
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
            // Salva as informações recebidas do Python
            localStorage.setItem('cyberforce_user_type', result.perfil);
            localStorage.setItem('cyberforce_user_name', result.nome);
            localStorage.setItem('cyberforce_user_email', result.email);

            // Redireciona para a página principal
            window.location.href = '/'; 
        } else {
            mostrarMensagem("// ACESSO NEGADO: " + result.mensagem, "error", true);
        }
    } catch (e) {
        mostrarMensagem("// FALHA DE CONEXÃO", "error", true);
        console.error("Erro no login:", e);
    }
}