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
        if (typeof mostrarAviso === "function") {
            mostrarAviso("// ACESSANDO CORE NEURAL...");
        }

        const response = await fetch('/api/usuario/perfil');
        const data = await response.json();
        
        if (response.ok) {
            // Preenche os dados
            if(document.getElementById('perfil-nome')) document.getElementById('perfil-nome').value = data.nome || '';
            if(document.getElementById('perfil-cpf')) document.getElementById('perfil-cpf').value = data.cpf || '';
            if(document.getElementById('perfil-email')) document.getElementById('perfil-email').value = data.email || '';
            if(document.getElementById('perfil-objetivo')) document.getElementById('perfil-objetivo').value = data.objetivo || '';
            if(document.getElementById('perfil-peso')) document.getElementById('perfil-peso').value = data.peso !== null ? data.peso : '';
            if(document.getElementById('perfil-altura')) document.getElementById('perfil-altura').value = data.altura !== null ? data.altura : '';
            if(data.genero && document.getElementById('perfil-genero')) document.getElementById('perfil-genero').value = data.genero;

            // FIX DA DATA
            if (data.data_nascimento && document.getElementById('perfil-data')) {
                document.getElementById('perfil-data').value = data.data_nascimento;
            } else if (document.getElementById('perfil-data')) {
                document.getElementById('perfil-data').value = '';
            }

            // ATUALIZA FOTOS
            const fotoUrl = data.foto_url || '/static/uploads/perfil/default_avatar.png';
            if(document.getElementById('perfil-img-display')) document.getElementById('perfil-img-display').src = fotoUrl;
            if(document.getElementById('header-profile-img')) document.getElementById('header-profile-img').src = fotoUrl;

            // ==========================================
            // FIX DEFINITIVO DA TELA E DO ERRO DE SINTAXE
            // ==========================================
            // Fazemos a troca direto no elemento, sem criar variáveis "const" que possam dar conflito!
            if (document.getElementById('perfil')) {
                document.getElementById('perfil').style.display = 'block';
            }
            if (document.getElementById('home-section')) {
                document.getElementById('home-section').style.display = 'none';
            }
            
        } else {
            if (typeof mostrarAviso === "function") mostrarAviso(`// ERRO: ${data.erro}`, true);
        }
    } catch (e) {
        console.error("Erro ao carregar perfil:", e);
        if (typeof mostrarAviso === "function") mostrarAviso("// ERRO CRÍTICO NA CONEXÃO NEURAL.", true);
    }
}
// 2. UPDATE: Salvar as alterações
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

        // VALIDAÇÕES COM O NOVO POP-UP
        if (!nome || !email || !cpf) {
            mostrarAviso("// ERRO: NOME, CPF E EMAIL SÃO OBRIGATÓRIOS.", true);
            return;
        }
        if (!senha_confirmacao) {
            mostrarAviso("// SEGURANÇA: DIGITE SUA SENHA PARA CONFIRMAR.", true);
            return;
        }

        mostrarAviso("// INICIANDO TRANSFERÊNCIA DE DADOS...");

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
            mostrarAviso("// ERRO NO SERVIDOR. Olhe o terminal do VSCode.", true);
            return;
        }

        const result = await res.json();
        
        if (result.sucesso) {
            mostrarAviso("// PROTOCOLO ATUALIZADO COM SUCESSO.");
            document.getElementById('perfil-senha-confirma').value = '';
            
            // Recarrega a página após 2 segundos para dar tempo de ler o aviso
            setTimeout(() => { location.reload(); }, 2000);
        } else {
            mostrarAviso(`// ERRO: ${result.mensagem}`, true);
        }
    } catch (error) {
        console.error("Erro no JS:", error);
        mostrarAviso("// ERRO CRÍTICO NA TELA.", true);
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

function navegarParaHome() {
    // 1. Esconde a seção de perfil (MUDAMOS DE 'perfil-section' PARA 'perfil')
    const perfil = document.getElementById('perfil');
    if (perfil) perfil.style.display = 'none';

    // 2. Tenta encontrar a sua Home (pode ser 'home-section' ou 'hero')
    const home = document.getElementById('home-section') || document.getElementById('hero');
    
    if (home) {
        home.style.display = 'block';
    } else {
        console.error("// ERRO: Seção Home não encontrada. Verifique o ID no index.html");
        window.location.reload();
    }
}

// Função para mostrar preview da foto antes de fazer upload
function previewFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Atualiza a imagem na tela imediatamente
            document.getElementById('perfil-img-display').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Oculta a home e MOSTRA o perfil
document.getElementById('home-section').style.display = 'none';
document.getElementById('perfil').style.display = 'block'; // <<< Usa 'perfil' aqui também!

function mostrarAviso(msg, isError = false) {
    const toast = document.getElementById("cyber-toast");
    const toastMsg = document.getElementById("cyber-toast-msg");
    
    toastMsg.innerText = msg;

    if (isError) {
        toast.classList.add("error"); // Fica vermelho
    } else {
        toast.classList.remove("error"); // Fica azul cyan
    }

    toast.classList.add("show");
    
    // Esconde automaticamente após 4 segundos
    setTimeout(function() { 
        toast.classList.remove("show"); 
    }, 4000);
}