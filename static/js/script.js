// ==========================================
// 1. INICIALIZAÇÃO E DATA AO VIVO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Set live date
    const now = new Date();
    const days = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
    const dateStr = `// ${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} — ${days[now.getDay()]}-FEIRA`;
    if(document.getElementById('log-date')) document.getElementById('log-date').textContent = dateStr;

    // Recupera dados do localStorage
    const userType = localStorage.getItem('cyberforce_user_type');
    const userName = localStorage.getItem('cyberforce_user_name');
    const userEmail = localStorage.getItem('cyberforce_user_email');
    
    const menuProfessor = document.getElementById('menu-professor');
    const btnLoginIcon = document.getElementById('btn-login-icon');
    const userProfileDisplay = document.getElementById('user-profile-display');
    
    if (userType === "treinador" && menuProfessor) {
        menuProfessor.style.display = 'block';
    }

    if (userName) {
        if (btnLoginIcon) btnLoginIcon.style.display = 'none';
        if (userProfileDisplay) {
            userProfileDisplay.style.display = 'flex';
            const nomeDisplay = document.getElementById('user-display-name');
            const emailDisplay = document.getElementById('user-display-email');
            if(nomeDisplay) nomeDisplay.textContent = userName;
            if(emailDisplay && userEmail) emailDisplay.textContent = userEmail;
        }
    }
});


// ==========================================
// 2. NAVEGAÇÃO PRINCIPAL E HAMBÚRGUER
// ==========================================
function toggleMenu() {
    const navDrawer = document.getElementById('navDrawer');
    const hamburger = document.getElementById('hamburger');
    if (navDrawer) navDrawer.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
}

function closeMenu() {
    const navDrawer = document.getElementById('navDrawer');
    const hamburger = document.getElementById('hamburger');
    if (navDrawer) navDrawer.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
}

// A SUPER FUNÇÃO QUE TROCA AS TELAS SEM BUGAR
function showSection(sectionId) {
    // Lista blindada de todas as telas (adicionei home e home-section por segurança)
    const todasAsTelas = [
        'home', 'home-section', 'perfil', 'logbook', 'painel-professor', 'store', 'schedule', 'panel-login'
    ];

    // 1. Esconde TODAS as telas e desmarca botões do menu
    todasAsTelas.forEach(id => {
        const tela = document.getElementById(id);
        if (tela) tela.style.display = 'none';
    });
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // 2. Mostra APENAS a tela que você clicou
    const telaAtiva = document.getElementById(sectionId);
    if (telaAtiva) {
        telaAtiva.style.display = 'block';
    }

    // 3. Gatilhos automáticos: Se abrir a tela X, carrega os dados Y
    if (sectionId === 'perfil') {
        carregarDadosPerfil();
    } else if (sectionId === 'painel-professor') {
        carregarAlunosDoProfessor();
    }

    window.scrollTo({top: 0, behavior: 'smooth'});
}

function navegarParaHome() {
    showSection('home');
}


// ==========================================
// 3. UTILITÁRIOS DA INTERFACE (AVISOS)
// ==========================================
function mostrarAviso(msg, isError = false) {
    const toast = document.getElementById("cyber-toast");
    const toastMsg = document.getElementById("cyber-toast-msg");
    if(!toast) return; // Proteção caso o toast não exista no HTML
    
    toastMsg.innerText = msg;
    if (isError) {
        toast.classList.add("error");
    } else {
        toast.classList.remove("error");
    }

    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 4000);
}


// ==========================================
// 4. PERFIL DO USUÁRIO (CRUD)
// ==========================================
async function carregarDadosPerfil() {
    try {
        mostrarAviso("// ACESSANDO CORE NEURAL...");
        const response = await fetch('/api/usuario/perfil');
        const data = await response.json();
        
        if (response.ok) {
            if(document.getElementById('perfil-nome')) document.getElementById('perfil-nome').value = data.nome || '';
            if(document.getElementById('perfil-cpf')) document.getElementById('perfil-cpf').value = data.cpf || '';
            if(document.getElementById('perfil-email')) document.getElementById('perfil-email').value = data.email || '';
            if(document.getElementById('perfil-objetivo')) document.getElementById('perfil-objetivo').value = data.objetivo || '';
            if(document.getElementById('perfil-peso')) document.getElementById('perfil-peso').value = data.peso !== null ? data.peso : '';
            if(document.getElementById('perfil-altura')) document.getElementById('perfil-altura').value = data.altura !== null ? data.altura : '';
            if(data.genero && document.getElementById('perfil-genero')) document.getElementById('perfil-genero').value = data.genero;

            if (data.data_nascimento && document.getElementById('perfil-data')) {
                document.getElementById('perfil-data').value = data.data_nascimento;
            } else if (document.getElementById('perfil-data')) {
                document.getElementById('perfil-data').value = '';
            }

            const fotoUrl = data.foto_url || '/static/uploads/perfil/default_avatar.png';
            if(document.getElementById('perfil-img-display')) document.getElementById('perfil-img-display').src = fotoUrl;
            if(document.getElementById('header-profile-img')) document.getElementById('header-profile-img').src = fotoUrl;
        } else {
            mostrarAviso(`// ERRO: ${data.erro}`, true);
        }
    } catch (e) {
        console.error("Erro ao carregar perfil:", e);
        mostrarAviso("// ERRO CRÍTICO NA CONEXÃO NEURAL.", true);
    }
}

async function salvarPerfil() {
    try {
        const nome = document.getElementById('perfil-nome').value.trim();
        const cpf = document.getElementById('perfil-cpf').value.trim();
        const email = document.getElementById('perfil-email').value.trim();
        const data_nascimento = document.getElementById('perfil-data').value;
        const genero = document.getElementById('perfil-genero').value;
        const peso = document.getElementById('perfil-peso').value;
        const altura = document.getElementById('perfil-altura').value;
        const objetivo = document.getElementById('perfil-objetivo').value.trim();
        const senha_confirmacao = document.getElementById('perfil-senha-confirma').value;
        const fotoInput = document.getElementById('perfil-foto-input');
        const fotoArquivo = fotoInput ? fotoInput.files[0] : null;

        if (!nome || !email || !cpf) {
            mostrarAviso("// ERRO: NOME, CPF E EMAIL SÃO OBRIGATÓRIOS.", true);
            return;
        }
        if (!senha_confirmacao) {
            mostrarAviso("// SEGURANÇA: DIGITE SUA SENHA PARA CONFIRMAR.", true);
            return;
        }

        mostrarAviso("// INICIANDO TRANSFERÊNCIA...");

        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('cpf', cpf);
        formData.append('email', email);
        formData.append('data_nascimento', data_nascimento); 
        formData.append('genero', genero);
        formData.append('peso', peso);
        formData.append('altura', altura);
        formData.append('objetivo', objetivo);
        formData.append('senha_confirmacao', senha_confirmacao);
        if (fotoArquivo) formData.append('foto', fotoArquivo);

        const res = await fetch('/api/usuario/atualizar_completo', {
            method: 'POST',
            body: formData
        });

        if (!res.ok && res.status !== 403 && res.status !== 400) {
            mostrarAviso("// ERRO NO SERVIDOR.", true);
            return;
        }

        const result = await res.json();
        if (result.sucesso) {
            mostrarAviso("// PROTOCOLO ATUALIZADO COM SUCESSO.");
            document.getElementById('perfil-senha-confirma').value = '';
            setTimeout(() => { location.reload(); }, 2000);
        } else {
            mostrarAviso(`// ERRO: ${result.mensagem}`, true);
        }
    } catch (error) {
        console.error("Erro no JS:", error);
        mostrarAviso("// ERRO CRÍTICO NA TELA.", true);
    }
}

function previewFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('perfil-img-display').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function fazerLogout() {
    localStorage.removeItem('cyberforce_user_type');
    localStorage.removeItem('cyberforce_user_name');
    localStorage.removeItem('cyberforce_user_email');
    fetch('/logout').then(() => {
        window.location.href = '/';
    });
}


// ==========================================
// 5. LOGBOOK E TREINOS
// ==========================================
function switchLogTab(cat) {
    document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.log-panel').forEach(p => p.classList.remove('active'));
    
    document.querySelector(`.log-tab.${cat}`).classList.add('active');
    
    // Mostra o painel correto caso a versão antiga use display: none/block no painel
    const panel = document.getElementById(`panel-${cat}`);
    if (panel) panel.classList.add('active');

    carregarLogbook(cat);
}

async function carregarLogbook(categoria) {
    const tbody = document.getElementById('logbook-tbody') || document.querySelector(`#panel-${categoria} tbody`);
    const badge = document.getElementById('categoria-badge');
    const userPerfil = document.body.dataset.userPerfil; 
    
    if(!tbody) return; // Evita erro se não achar a tabela

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">// SINCRONIZANDO COM O SERVIDOR...</td></tr>';
    
    if (badge) {
        badge.textContent = categoria.toUpperCase();
        badge.className = `log-category-badge badge-${categoria}`;
    }

    try {
        const response = await fetch(`/api/aluno/meu_treino/${categoria}`);
        const data = await response.json();

        if (response.ok) {
            tbody.innerHTML = '';
            data.exercicios.forEach(ex => {
                const isReadOnly = userPerfil !== 'treinador' ? 'readonly' : '';
                const inputClass = userPerfil !== 'treinador' ? 'input-bloqueado' : '';

                const tr = `
                    <tr>
                        <td class="ex-name">${ex.nome}</td>
                        <td><input type="number" class="log-input" value="${ex.series}" readonly></td>
                        <td><input type="number" class="log-input" value="${ex.reps}" readonly></td>
                        <td>
                            <input type="number" 
                                   class="log-input weight ${inputClass}" 
                                   value="${ex.carga}" 
                                   ${isReadOnly}
                                   onchange="salvarCargaRapida(${ex.id_item}, this.value)">
                        </td>
                    </tr>
                `;
                tbody.innerHTML += tr;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-dim)">${data.mensagem || "// NENHUM TREINO ENCONTRADO"}</td></tr>`;
        }
    } catch (error) {
        console.error("Erro ao carregar logbook:", error);
    }
}

async function salvarCargaRapida(idItem, novaCarga) {
    await fetch('/api/treino/atualizar_carga', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_item_treino: idItem, nova_carga: novaCarga })
    });
}


// ==========================================
// 6. PAINEL DO PROFESSOR
// ==========================================
let alunoSelecionadoId = null;

async function carregarAlunosDoProfessor() {
    const grid = document.getElementById('grid-alunos');
    if(!grid) return;

    grid.innerHTML = '<p class="log-date">// ACESSANDO BANCO DE DADOS...</p>';
    
    const res = await fetch('/api/professor/meus_alunos');
    const alunos = await res.json();
    
    grid.innerHTML = '';
    alunos.forEach(a => {
        grid.innerHTML += `
            <div class="eq-card" onclick="abrirCriadorTreino(${a.id_aluno}, '${a.nome}')">
                <div class="eq-name">${a.nome}</div>
                <div class="eq-tag">ALUNO_ID: ${a.id_aluno}</div>
            </div>
        `;
    });
}

function abrirCriadorTreino(id, nome) {
    alunoSelecionadoId = id;
    document.getElementById('lista-alunos-container').style.display = 'none';
    document.getElementById('form-treino').style.display = 'block';
    document.getElementById('nome-aluno-selecionado').textContent = `ALUNO: ${nome}`;
    document.getElementById('corpo-treino-novo').innerHTML = ''; 
    adicionarLinhaExercicio(); 
}

function fecharCriadorTreino() {
    document.getElementById('lista-alunos-container').style.display = 'block';
    document.getElementById('form-treino').style.display = 'none';
}

function adicionarLinhaExercicio() {
    const tbody = document.getElementById('corpo-treino-novo');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="field-input ex-nome-input" placeholder="Ex: Supino"></td>
        <td><input type="number" class="log-input ex-series" value="3"></td>
        <td><input type="number" class="log-input ex-reps" value="12"></td>
        <td><input type="number" class="log-input weight ex-carga" value="0"></td>
        <td><button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:var(--neon-red); cursor:pointer;">X</button></td>
    `;
    tbody.appendChild(tr);
}

async function salvarTreinoCompleto() {
    const linhas = document.querySelectorAll('#corpo-treino-novo tr');
    const exercicios = [];
    
    linhas.forEach(linha => {
        exercicios.push({
            nome: linha.querySelector('.ex-nome-input').value,
            series: linha.querySelector('.ex-series').value,
            reps: linha.querySelector('.ex-reps').value,
            carga: linha.querySelector('.ex-carga').value
        });
    });

    const payload = {
        id_aluno: alunoSelecionadoId,
        categoria: document.getElementById('treino-categoria').value,
        exercicios: exercicios
    };

    const res = await fetch('/api/professor/salvar_treino', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert("PROTOCOLO DE TREINO ENVIADO COM SUCESSO!");
        fecharCriadorTreino();
    }
}

// ==========================================
// 7. LOJA (FILTROS)
// ==========================================
function filterProducts(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.product-card').forEach(card => {
        if(cat === 'all' || card.dataset.cat === cat) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}