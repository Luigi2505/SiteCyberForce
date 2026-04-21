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