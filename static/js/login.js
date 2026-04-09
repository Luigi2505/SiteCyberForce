// ─── NAVEGAÇÃO ENTRE ABAS ───
function switchTab(tab) {
    const panelLogin = document.getElementById('panel-login');
    const panelCad = document.getElementById('panel-cadastro');
    const tabs = document.querySelectorAll('.auth-tab');

    if (tab === 'login') {
        panelLogin.classList.add('active');
        panelCad.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        panelLogin.classList.remove('active');
        panelCad.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// ─── BUSCA DE CEP ───
async function buscarCEP(input) {
    const cep = input.value.replace(/\D/g, '');
    const hint = document.getElementById('hint-cep');
    if (cep.length === 8) {
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                document.getElementById('cad-logradouro').value = data.logradouro;
                document.getElementById('cad-bairro').value = data.bairro;
                document.getElementById('cad-cidade').value = data.localidade;
                document.getElementById('cad-uf').value = data.uf;
                hint.className = "field-hint ok show";
                hint.innerText = "// SISTEMA_LOCALIZADO";
            } else {
                hint.className = "field-hint err show";
                hint.innerText = "// CEP_INVÁLIDO";
            }
        } catch (e) { console.error("Erro ViaCEP"); }
    }
}

// ─── FUNÇÃO DE CADASTRO ÚNICA ───
async function fazerCadastro() {
    const msgBox = document.getElementById('msg-cadastro');
    msgBox.style.display = "none"; // Garante que a caixa de erro apareça se necessário

    // Coleta dos dados usando os IDs exatos do seu formulário
    const payload = {
        nome:            document.getElementById('cad-nome').value,
        email:           document.getElementById('cad-email').value,
        senha:           document.getElementById('cad-senha').value,
        cpf:             document.getElementById('cad-cpf').value,
        data_nascimento: document.getElementById('cad-nasc').value, // ID do seu HTML
        celular:         document.getElementById('cad-cel').value,  // ID do seu HTML
        cep:             document.getElementById('cad-cep').value,
        logradouro:      document.getElementById('cad-logradouro').value,
        bairro:          document.getElementById('cad-bairro').value,
        cidade:          document.getElementById('cad-cidade').value,
        uf:              document.getElementById('cad-uf').value
    };

    // Validação básica antes de enviar
    if (!payload.nome || !payload.email || !payload.senha) {
        msgBox.className = "msg-box error";
        msgBox.innerText = "// ERRO: CAMPOS_OBRIGATÓRIOS_AUSENTES";
        msgBox.style.display = "block";
        return;
    }

    try {
        const response = await fetch('/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        msgBox.style.display = "block";

        if (result.sucesso) {
            msgBox.className = "msg-box success";
            msgBox.innerText = "// ACESSO_GERADO_COM_SUCESSO";
            setTimeout(() => switchTab('login'), 2000);
        } else {
            msgBox.className = "msg-box error";
            msgBox.innerText = "// ERRO: " + result.mensagem;
        }
    } catch (error) {
        msgBox.style.display = "block";
        msgBox.className = "msg-box error";
        msgBox.innerText = "// FALHA_DE_COMUNICAÇÃO_COM_SERVIDOR";
    }
}