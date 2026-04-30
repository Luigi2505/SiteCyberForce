  // Set live date
  const now = new Date();
  const days = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
  const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const dateStr = `// ${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} — ${days[now.getDay()]}-FEIRA`;
  if(document.getElementById('log-date')) document.getElementById('log-date').textContent = dateStr;

  // Section navigation
let alunoSelecionadoId = null;

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id === 'painel-professor') {
        carregarAlunosDoProfessor();
    }
}

async function carregarAlunosDoProfessor() {
    const grid = document.getElementById('grid-alunos');
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
    document.getElementById('corpo-treino-novo').innerHTML = ''; // Limpa anterior
    adicionarLinhaExercicio(); // Começa com uma linha vazia
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
  // Menu toggle
  function toggleMenu() {
    const ham = document.getElementById('hamburger');
    const nav = document.getElementById('navDrawer');
    const ovl = document.getElementById('overlay');
    ham.classList.toggle('open');
    nav.classList.toggle('open');
    ovl.classList.toggle('active');
  }
  function closeMenu() {
    document.getElementById('hamburger').classList.remove('open');
    document.getElementById('navDrawer').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  }

  // Log tabs
  function switchLogTab(cat) {
    document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.log-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`.log-tab.${cat}`).classList.add('active');
    document.getElementById(`panel-${cat}`).classList.add('active');
  }

  // Product filters
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

  // Logo nav
  document.querySelector('.logo').onclick = () => showSection('home');

async function carregarTreinoDoBanco(categoria) {
  try {
    // Chama a rota do Flask
    const resposta = await fetch(`/api/aluno/meu_treino/${categoria}`);
    const dados = await resposta.json();
    
    if (resposta.ok) {
      renderizarTabela(categoria, dados.exercicios);
    } else {
      console.log("Treino não encontrado ou erro:", dados.mensagem);
      // Mostrar mensagem no HTML: "Seu professor ainda não enviou este treino."
    }
  } catch (erro) {
    console.error("Erro de conexão", erro);
  }
}

function renderizarTabela(categoria, exercicios) {
  const tbody = document.querySelector(`#panel-${categoria} tbody`);
  tbody.innerHTML = ''; // Limpa a tabela estática atual
  
  exercicios.forEach(ex => {
    // Cria as linhas usando as classes CSS do seu projeto (ex-name, log-input)
    const tr = `
      <tr>
        <td class="ex-name">${ex.nome}</td>
        <td><input type="number" class="log-input" value="${ex.series}" readonly></td>
        <td><input type="number" class="log-input" value="${ex.reps}" readonly></td>
        <td><input type="number" class="log-input weight" value="${ex.carga}"></td>
      </tr>
    `;
    tbody.innerHTML += tr;
  });
}

// Modifique sua função original para carregar os dados
function switchLogTab(cat) {
  document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.log-panel').forEach(p => p.classList.remove('active'));
  
  document.querySelector(`.log-tab.${cat}`).classList.add('active');
  document.getElementById(`panel-${cat}`).classList.add('active');

  // NOVA LINHA: Carrega os dados do banco dinamicamente
  carregarTreinoDoBanco(cat);
}

document.addEventListener('DOMContentLoaded', () => {
    // Recupera os dados que salvamos no login
    const userType = localStorage.getItem('cyberforce_user_type');
    const userName = localStorage.getItem('cyberforce_user_name');
    const userEmail = localStorage.getItem('cyberforce_user_email');
    
    const menuProfessor = document.getElementById('menu-professor');
    const btnLoginIcon = document.getElementById('btn-login-icon');
    const userProfileDisplay = document.getElementById('user-profile-display');
    
    // 1. Mostrar o Menu do Professor se o usuário for "treinador"
    if (userType === "treinador" && menuProfessor) {
        menuProfessor.style.display = 'block';
    }

    // 2. Controlar exibição no cabeçalho (Logado vs Deslogado)
    if (userName) {
        if (btnLoginIcon) btnLoginIcon.style.display = 'none';
        if (userProfileDisplay) {
            userProfileDisplay.style.display = 'flex';
            document.getElementById('user-display-name').textContent = userName;
            if(userEmail) document.getElementById('user-display-email').textContent = userEmail;
        }
    }
});

// Função para abrir/fechar a caixinha de Sair
function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

// Função para fazer Logout
function fazerLogout() {
    // Limpa a memória do navegador
    localStorage.removeItem('cyberforce_user_type');
    localStorage.removeItem('cyberforce_user_name');
    localStorage.removeItem('cyberforce_user_email');
    
    // Comunica ao Python para limpar a sessão
    fetch('/logout').then(() => {
        // Redireciona para atualizar a página e mostrar o botão de login novamente
        window.location.href = '/';
    });
}

// Abre/Fecha a caixinha de Sair no cabeçalho
function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

// Adicione isto ao seu script.js
async function carregarLogbook(categoria) {
    const tbody = document.getElementById('logbook-tbody');
    const badge = document.getElementById('categoria-badge');
    const userPerfil = document.body.dataset.userPerfil; // Certifique-se de ter adicionado isso ao <body>
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">// SINCRONIZANDO COM O SERVIDOR...</td></tr>';
    
    // Atualiza o visual do badge
    badge.textContent = categoria.toUpperCase();
    badge.className = `log-category-badge badge-${categoria}`;

    try {
        const response = await fetch(`/api/aluno/meu_treino/${categoria}`);
        const data = await response.json();

        if (response.ok) {
            tbody.innerHTML = '';
            data.exercicios.forEach(ex => {
                // REGRA DE OURO: Se for aluno, o campo é readonly (somente leitura)
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

// Função para o professor alterar a carga direto no logbook se quiser
async function salvarCargaRapida(idItem, novaCarga) {
    await fetch('/api/treino/atualizar_carga', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_item_treino: idItem, nova_carga: novaCarga })
    });
}

// Ajuste na função de troca de abas
function switchLogTab(cat) {
    document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.log-tab.${cat}`).classList.add('active');
    carregarLogbook(cat);
}

// ==========================================
// FUNÇÕES DO PERFIL (CRUD)
// ==========================================

// 1. READ: Carregar os dados quando a aba abrir
async function carregarDadosPerfil() {
    try {
        const response = await fetch('/api/usuario/perfil');
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('perfil-nome').value = data.nome;
            document.getElementById('perfil-cpf').value = data.cpf;
            document.getElementById('perfil-email').value = data.email;
            document.getElementById('perfil-objetivo').value = data.objetivo || '';
        }
    } catch (e) {
        console.error("Erro ao carregar perfil:", e);
    }
}

// 2. UPDATE: Salvar as alterações
async function salvarPerfil() {
    const nome = document.getElementById('perfil-nome').value;
    const objetivo = document.getElementById('perfil-objetivo').value;
    
    if (!nome) {
        alert("O nome não pode ficar vazio.");
        return;
    }
    
    const payload = { nome: nome, objetivo: objetivo };
    
    const response = await fetch('/api/usuario/atualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.sucesso) {
        alert("DADOS SINCRONIZADOS COM SUCESSO!");
        location.reload(); // Recarrega a página para atualizar o Header
    } else {
        alert("Erro ao atualizar perfil.");
    }
}

// 3. DELETE: Excluir a conta
async function deletarConta() {
    const confirmacao = confirm("ALERTA CRÍTICO: Tem certeza que deseja apagar sua conta? Todos os seus treinos e dados serão perdidos. Esta ação NÃO pode ser desfeita.");
    
    if (confirmacao) {
        const response = await fetch('/api/usuario/excluir', { method: 'POST' });
        const result = await response.json();
        
        if (result.sucesso) {
            alert("SISTEMA: Conta eliminada com sucesso. Desconectando...");
            window.location.href = '/'; // Como a sessão foi limpa no Python, a home será recarregada como visitante
        } else {
            alert("Falha ao excluir conta.");
        }
    }
}

// ==========================================
// ATUALIZAR A FUNÇÃO DE NAVEGAÇÃO
// ==========================================
// Precisamos fazer com que a função showSection carregue os dados ao clicar no perfil.
// Encontre a sua função showSection atual e modifique-a para ficar assim:

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Atualiza o menu lateral
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Se a aba for o perfil, carrega os dados
    if (id === 'perfil') {
        carregarDadosPerfil();
    }
    
    window.scrollTo({top:0, behavior:'smooth'});
}

// SUBSTITUA o bloco do vigia por esse
window.addEventListener('load', () => {
  const estaLogado = document.getElementById('user-profile-display') !== null;

  if (estaLogado) {
    setInterval(async () => {
      const resposta = await fetch('/api/check-session');
      if (resposta.status === 401) {
        mostrarPopupSessao();
      }
    }, 15000);
  }
});

function mostrarPopupSessao() {
  // Cria o fundo escuro
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Cria o popup
  overlay.innerHTML = `
    <div style="
      background: rgba(10,10,20,0.98);
      border: 1px solid rgba(0,212,255,0.4);
      box-shadow: 0 0 40px rgba(0,212,255,0.15), inset 0 0 20px rgba(0,0,0,0.5);
      padding: 3rem;
      max-width: 420px;
      width: 90%;
      text-align: center;
      position: relative;
    ">
      <div style="font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:rgba(0,212,255,0.6); letter-spacing:0.4em; margin-bottom:1.5rem;">
        // SESSION_TIMEOUT
      </div>

      <div style="font-family:'Michroma',sans-serif; font-size:1.4rem; color:#ff2244; text-shadow: 0 0 20px rgba(255,34,68,0.6); letter-spacing:0.1em; margin-bottom:1rem;">
        SESSÃO ENCERRADA
      </div>

      <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:rgba(245,237,224,0.7); line-height:1.8; margin-bottom:2rem; letter-spacing:0.05em;">
        Sua sessão expirou.<br>Realize o login novamente.
      </div>

      <button onclick="window.location.href='/login'" style="
        width: 100%;
        padding: 1rem;
        background: rgba(255,34,68,0.1);
        border: 1px solid rgba(255,34,68,0.5);
        color: #ff2244;
        font-family: 'Michroma', sans-serif;
        font-size: 0.75rem;
        letter-spacing: 0.25em;
        cursor: pointer;
        text-shadow: 0 0 8px rgba(255,34,68,0.4);
        transition: all 0.3s;
      "
      onmouseover="this.style.background='rgba(255,34,68,0.2)'"
      onmouseout="this.style.background='rgba(255,34,68,0.1)'"
      >
        REALIZAR LOGIN
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
let ultimaRenovacao = 0;
let vigiaInterval = null; // ← guarda a referência do intervalo

function iniciarVigia() {
  // Cancela o intervalo anterior se existir
  if (vigiaInterval) clearInterval(vigiaInterval);
  
  // Cria um novo intervalo zerado
  vigiaInterval = setInterval(async () => {
    const resposta = await fetch('/api/check-session');
    if (resposta.status === 401) {
      clearInterval(vigiaInterval);
      mostrarPopupSessao();
    }
  }, 15000);
}

window.addEventListener('load', () => {
  const estaLogado = document.getElementById('user-profile-display') !== null;
  
  if (estaLogado) {
    iniciarVigia();

    // Move os eventos para dentro do if
    eventos.forEach(evento => {
      document.addEventListener(evento, () => {
        const agora = Date.now();
        if (agora - ultimaRenovacao > 30000) {
          ultimaRenovacao = agora;
          fetch('/api/renovar-sessao', { method: 'POST' });
          iniciarVigia();
        }
      });
    });
  }
});

