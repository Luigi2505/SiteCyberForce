document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const days = [
    "DOMINGO",
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO",
  ];
  const dateStr = `// ${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} — ${days[now.getDay()]}-FEIRA`;
  if (document.getElementById("log-date")) {
    document.getElementById("log-date").textContent = dateStr;
  }

  // CHAMA OS DADOS DO UTILIZADOR SE A FOTO DO CABEÇALHO EXISTIR (Em todas as páginas)
  if (document.getElementById("header-profile-img")) {
      carregarDadosPerfil();
  }

  if (document.getElementById("grid-alunos")) {
    carregarAlunosDoProfessor();
    carregarAdminConexoes();
  }
  
  if (document.getElementById("logbook-tbody")) {
      switchLogTab("push");
  }

  // FECHAR DROPDOWN AO CLICAR FORA
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("user-dropdown");
    const profileDisplay = document.getElementById("user-profile-display");
    if (dropdown && profileDisplay && !profileDisplay.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });
});

// ─── MENU ───
function toggleMenu() {
  const ham = document.getElementById("hamburger");
  const nav = document.getElementById("navDrawer");
  const ovl = document.getElementById("overlay");
  ham.classList.toggle("open");
  nav.classList.toggle("open");
  nav.classList.toggle("active");
  if (ovl) ovl.classList.toggle("active");
}

function closeMenu() {
  document.getElementById("hamburger").classList.remove("open");
  const nav = document.getElementById("navDrawer");
  nav.classList.remove("open");
  nav.classList.remove("active");
  const ovl = document.getElementById("overlay");
  if (ovl) ovl.classList.remove("active");
}

// ─── DROPDOWN HEADER ───
function toggleDropdown() {
  const dropdown = document.getElementById("user-dropdown");
  if (!dropdown) return;
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

// ─── MODAL CUSTOMIZADO (substitui confirm/alert) ───
let _modalCallback = null;
function cyberConfirm(msg, callback) {
  document.getElementById("cyber-modal-msg").textContent = msg;
  document.getElementById("cyber-modal-cancel").style.display = "inline-block";
  const overlay = document.getElementById("cyber-modal-overlay");
  overlay.style.display = "flex";
  _modalCallback = callback;
}
function cyberAlert(msg) {
  document.getElementById("cyber-modal-msg").textContent = msg;
  document.getElementById("cyber-modal-cancel").style.display = "none";
  const overlay = document.getElementById("cyber-modal-overlay");
  overlay.style.display = "flex";
  _modalCallback = null;
}
function cyberModalClose(confirmed) {
  document.getElementById("cyber-modal-overlay").style.display = "none";
  if (confirmed && _modalCallback) _modalCallback();
  _modalCallback = null;
}

// ─── TOAST ───
function mostrarAviso(msg, isError = false) {
  const toast = document.getElementById("cyber-toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.borderColor = isError ? "var(--neon-red)" : "var(--cyan)";
  toast.style.color = isError ? "var(--neon-red)" : "var(--cyan)";
  toast.style.boxShadow = isError
    ? "0 0 20px rgba(255,34,68,0.3)"
    : "0 0 20px rgba(0,212,255,0.3)";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  toast.style.pointerEvents = "auto";
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.pointerEvents = "none";
  }, 4000);
}

// ─── SEÇÕES (SPA) ───
function showSection(sectionId) {
  [
    "home",
    "home-section",
    "perfil",
    "logbook",
    "painel-professor",
    "store",
    "schedule",
    "panel-login",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  const ativo = document.getElementById(sectionId);
  if (ativo) ativo.style.display = "block";
  
  if (sectionId === "perfil") carregarDadosPerfil();
  if (sectionId === "painel-professor") {
    carregarAlunosDoProfessor();
    carregarAdminConexoes();
  }
  if (sectionId === "logbook") switchLogTab("push");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── PERFIL ───
async function carregarDadosPerfil() {
  try {
    const response = await fetch("/api/usuario/perfil");
    const data = await response.json();
    if (response.ok) {
      const mapa = {
        nome: "nome",
        cpf: "cpf",
        email: "email",
        objetivo: "objetivo",
        peso: "peso",
        altura: "altura",
        genero: "genero",
        data: "data_nascimento",
      };
      
      // Preenche os campos normais se existirem na tela
      Object.entries(mapa).forEach(([id, chave]) => {
        const el = document.getElementById(`perfil-${id}`);
        if (el) el.value = data[chave] ?? "";
      });

      // GARANTE QUE O NÚMERO DA SORTE É CARREGADO (DA TUA PROVA)
      const sorteEl = document.getElementById('perfil-sorte');
      if (sorteEl) {
          sorteEl.value = data.numero_da_sorte !== null && data.numero_da_sorte !== undefined ? data.numero_da_sorte : '';
      }

      // TRATAMENTO DA FOTO DE PERFIL E DO BONECO SVG
      const fotoUrl = data.foto_url || "/static/uploads/perfil/default_avatar.png";
      
      const perfilImg = document.getElementById("perfil-img-display");
      if (perfilImg) perfilImg.src = fotoUrl;

      const headerImg = document.getElementById("header-profile-img");
      if (headerImg) {
          headerImg.src = fotoUrl;
          headerImg.style.display = "block"; // Força a imagem real a aparecer
          
          // Se o bonequinho de SVG (o elemento logo a seguir à imagem) existir, esconde-o
          if (headerImg.nextElementSibling) {
              headerImg.nextElementSibling.style.display = "none";
          }
      }
    }
  } catch (e) {
    console.log("Erro silencioso ao carregar o perfil.", e);
  }
}

async function salvarPerfil() {
  const senha = document.getElementById("perfil-senha-confirma").value;
  if (!senha) return mostrarAviso("// SEGURANÇA: DIGITE SUA SENHA PARA CONFIRMAR.", true);

  const formData = new FormData();
  ["nome", "cpf", "email", "genero", "peso", "altura", "objetivo"].forEach(
    (campo) => {
      const el = document.getElementById(`perfil-${campo}`);
      if (el) formData.append(campo, el.value);
    },
  );
  const dataEl = document.getElementById("perfil-data");
  if (dataEl) formData.append("data_nascimento", dataEl.value);
  formData.append("senha_confirmacao", senha);
  
  const foto = document.getElementById("perfil-foto-input");
  if (foto && foto.files[0]) formData.append("foto", foto.files[0]);

  const res = await fetch("/api/usuario/atualizar_completo", {
    method: "POST",
    body: formData,
  });
  const result = await res.json();
  if (result.sucesso) {
    mostrarAviso("// PROTOCOLO ATUALIZADO COM SUCESSO.");
    setTimeout(() => location.reload(), 2000);
  } else mostrarAviso(`// ERRO: ${result.mensagem}`, true);
}

function previewFoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById("perfil-img-display");
      if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function deletarConta() {
  cyberConfirm(
    "⚠️ TEM CERTEZA? O TEU REGISTO SERÁ APAGADO PERMANENTEMENTE DA CYBERFORCE.",
    () => {
      fetch("/api/usuario/excluir", { method: "POST" }).then(
        () => (window.location.href = "/"),
      );
    },
  );
}

// ─── LOGBOOK ───
function switchLogTab(cat) {
  document.querySelectorAll(".log-tab").forEach((t) => t.classList.remove("active"));
  const tab = document.querySelector(`.log-tab.${cat}`);
  if (tab) tab.classList.add("active");
  carregarLogbook(cat);
}

async function carregarLogbook(categoria) {
  const tbody = document.getElementById("logbook-tbody");
  const badge = document.getElementById("categoria-badge");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">// A SINCRONIZAR...</td></tr>';
  
  if (badge) {
    badge.textContent = categoria.toUpperCase();
    badge.className = `log-category-badge badge-${categoria}`;
  }
  
  const res = await fetch(`/api/aluno/meu_treino/${categoria}`);
  const data = await res.json();
  tbody.innerHTML = "";
  
  if (res.ok) {
    data.exercicios.forEach((ex) => {
      tbody.innerHTML += `<tr>
                <td class="ex-name">${ex.nome}</td>
                <td><input type="number" class="log-input" value="${ex.series}" readonly></td>
                <td><input type="number" class="log-input" value="${ex.reps}" readonly></td>
                <td><input type="number" class="log-input weight" value="${ex.carga}" onchange="salvarCargaRapida(${ex.id_item}, this.value)"></td>
            </tr>`;
    });
  } else {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-dim)">${data.mensagem || "// NENHUM TREINO ENCONTRADO"}</td></tr>`;
  }
}

async function salvarCargaRapida(idItem, novaCarga) {
  await fetch("/api/treino/atualizar_carga", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_item_treino: idItem, nova_carga: novaCarga }),
  });
}

// ─── PAINEL PROFESSOR ───
let listaAlunosLocal = [];
let alunoSelecionadoId = null;

async function carregarAlunosDoProfessor() {
  const grid = document.getElementById("grid-alunos");
  if (!grid) return;
  grid.innerHTML = '<p class="log-date">// A ACEDER À BASE DE DADOS...</p>';
  const res = await fetch("/api/professor/meus_alunos");
  listaAlunosLocal = await res.json();
  renderizarListaAlunos(listaAlunosLocal);
}

function renderizarListaAlunos(lista) {
  const grid = document.getElementById("grid-alunos");
  if (!grid) return;
  grid.innerHTML = "";
  if (lista.length === 0) {
    grid.innerHTML = '<p class="field-label" style="color:var(--text-dim);grid-column:1/-1">// NENHUM ALUNO VINCULADO. USA + RECRUTAR ALUNO.</p>';
    return;
  }
  lista.forEach((a) => {
    grid.innerHTML += `<div class="eq-card" onclick="abrirCriadorTreino(${a.id_aluno}, '${a.nome}')">
            <div class="eq-name">${a.nome.toUpperCase()}</div>
            <div class="eq-tag">ID: ${a.id_aluno}</div>
            <button onclick="event.stopPropagation(); desvincularAlunoProfessor(${a.id_aluno})"
                style="margin-top:10px;background:transparent;border:1px solid var(--neon-red);color:var(--neon-red);font-size:0.6rem;cursor:pointer;width:100%;padding:4px;">
                DESVINCULAR
            </button>
        </div>`;
  });
}

function filtrarAlunosLocal(termo) {
  renderizarListaAlunos(
    listaAlunosLocal.filter((a) => a.nome.toLowerCase().includes(termo.toLowerCase()))
  );
}

function ordenarAlunosAz() {
  renderizarListaAlunos(
    [...listaAlunosLocal].sort((a, b) => a.nome.localeCompare(b.nome))
  );
}

async function buscarNovoAluno() {
  const termo = document.getElementById("busca-aluno-input").value;
  const lista = document.getElementById("resultado-busca");
  if (termo.length < 2) return mostrarAviso("// DIGITA PELO MENOS 2 CARACTERES", true);
  
  lista.style.display = "block";
  lista.innerHTML = '<p style="color:var(--cyan);">A procurar...</p>';
  
  const res = await fetch(`/api/professor/buscar_aluno/${termo}`);
  const alunos = await res.json();
  lista.innerHTML = "";
  
  if (alunos.length === 0) {
    lista.innerHTML = '<p style="color:var(--neon-red);">// NENHUM ALUNO ENCONTRADO.</p>';
    return;
  }
  
  alunos.forEach((a) => {
    lista.innerHTML += `<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.6);padding:10px;margin-bottom:5px;border-left:3px solid var(--cyan);">
            <span style="color:#fff;">${a.nome} <span style="font-size:0.7rem;">(ID: ${a.id})</span></span>
            <button onclick="vincularAluno(${a.id})" class="filter-btn" style="padding:2px 10px;font-size:0.7rem;">+ VINCULAR</button>
        </div>`;
  });
}

async function buscarTodosAlunos() {
  const lista = document.getElementById("resultado-busca");
  lista.style.display = "block";
  lista.innerHTML = '<p style="color:var(--cyan);">A procurar na base central de alunos...</p>';
  
  try {
    const res = await fetch("/api/professor/todos_alunos");
    const alunos = await res.json();
    lista.innerHTML = "";
    
    if (alunos.length === 0) {
      lista.innerHTML = '<p style="color:var(--neon-red);">// NENHUM ALUNO CADASTRADO.</p>';
      return;
    }
    
    alunos.forEach((a) => {
      lista.innerHTML += `<div style="display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.6);padding:10px;margin-bottom:5px;border-left:3px solid var(--purple);">
                <span style="color:#fff;">${a.nome} <span style="font-size:0.7rem;">(ID: ${a.id})</span></span>
                <button onclick="vincularAluno(${a.id})" class="filter-btn" style="padding:2px 10px;font-size:0.7rem;border-color:var(--purple);color:var(--purple);">+ RECRUTAR</button>
            </div>`;
    });
  } catch (e) {
    lista.innerHTML = '<p style="color:var(--neon-red);">// ERRO DE CONEXÃO.</p>';
  }
}

async function vincularAluno(id) {
  const res = await fetch("/api/professor/vincular_aluno", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_aluno: id }),
  });
  const data = await res.json();
  if (res.ok) {
    mostrarAviso(data.mensagem);
    document.getElementById("resultado-busca").style.display = "none";
    carregarAlunosDoProfessor();
  } else {
    mostrarAviso(`// ERRO: ${data.mensagem}`, true);
  }
}

function desvincularAlunoProfessor(id_aluno) {
  cyberConfirm(
    "⚠️ Desejas mesmo remover este aluno da tua tutela?",
    async () => {
      const res = await fetch(`/api/professor/desvincular_aluno/${id_aluno}`, {
        method: "DELETE",
      });
      if (res.ok) {
        mostrarAviso("// ALUNO REMOVIDO.");
        carregarAlunosDoProfessor();
      } else {
        mostrarAviso("// ERRO AO DESVINCULAR.", true);
      }
    },
  );
}

function abrirCriadorTreino(id, nome) {
  alunoSelecionadoId = id;
  document.getElementById("lista-alunos-container").style.display = "none";
  document.getElementById("form-treino").style.display = "block";
  document.getElementById("nome-aluno-selecionado").textContent = `ALUNO: ${nome}`;
  carregarTreinoProfessor();
}

function fecharCriadorTreino() {
  document.getElementById("form-treino").style.display = "none";
  document.getElementById("lista-alunos-container").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function carregarTreinoProfessor() {
  const cat = document.getElementById("treino-categoria").value;
  const tbody = document.getElementById("corpo-treino-novo");
  tbody.innerHTML = '<tr><td colspan=\"5\" style=\"text-align:center;color:var(--cyan)\">// A EXTRAIR DADOS...</td></tr>';
  
  try {
    const res = await fetch(`/api/professor/ver_treino/${alunoSelecionadoId}/${cat}`);
    const data = await res.json();
    tbody.innerHTML = "";
    
    if (data.exercicios && data.exercicios.length > 0) {
      data.exercicios.forEach((ex) => {
        tbody.innerHTML += `<tr>
                    <td><input type="text" class="field-input ex-nome-input" value="${ex.nome}"></td>
                    <td><input type="number" class="log-input ex-series" value="${ex.series}"></td>
                    <td><input type="number" class="log-input ex-reps" value="${ex.reps}"></td>
                    <td><input type="number" class="log-input weight ex-carga" value="${ex.carga}"></td>
                    <td><button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--neon-red);cursor:pointer;font-size:1rem;">✕</button></td>
                </tr>`;
      });
    } else {
        adicionarLinhaExercicio();
    }
  } catch (e) {
    tbody.innerHTML = "";
    adicionarLinhaExercicio();
  }
}

function adicionarLinhaExercicio() {
  const tbody = document.getElementById("corpo-treino-novo");
  const tr = document.createElement("tr");
  tr.innerHTML = `
        <td><input type="text" class="field-input ex-nome-input" placeholder="Ex: Supino"></td>
        <td><input type="number" class="log-input ex-series" value="3"></td>
        <td><input type="number" class="log-input ex-reps" value="12"></td>
        <td><input type="number" class="log-input weight ex-carga" value="0"></td>
        <td><button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--neon-red);cursor:pointer;font-size:1rem;">✕</button></td>
    `;
  tbody.appendChild(tr);
}

async function salvarTreinoCompleto() {
  const exercicios = Array.from(document.querySelectorAll("#corpo-treino-novo tr")).map((linha) => ({
    nome: linha.querySelector(".ex-nome-input").value,
    series: linha.querySelector(".ex-series").value,
    reps: linha.querySelector(".ex-reps").value,
    carga: linha.querySelector(".ex-carga").value,
  }));
  
  mostrarAviso("// A SINCRONIZAR PROTOCOLO...");
  
  try {
    const res = await fetch("/api/professor/salvar_treino", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_aluno: alunoSelecionadoId,
        categoria: document.getElementById("treino-categoria").value,
        exercicios,
      }),
    });
    const data = await res.json();
    if (res.ok && data.sucesso) {
      mostrarAviso(data.mensagem);
      fecharCriadorTreino();
      carregarAlunosDoProfessor();
    } else {
        mostrarAviso(`// ERRO: ${data.mensagem}`, true);
    }
  } catch (e) {
    mostrarAviso("// ERRO CRÍTICO. Tenta novamente.", true);
    fecharCriadorTreino();
  }
}

// ─── ADMIN ───
async function carregarAdminConexoes() {
  const res = await fetch("/api/admin/conexoes");
  if (res.status === 403) return;
  
  const divAdmin = document.getElementById("admin-conexoes");
  if (divAdmin) divAdmin.style.display = "block";
  
  const conexoes = await res.json();
  const tbody = document.getElementById("tabela-admin-conexoes");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  conexoes.forEach((c) => {
    tbody.innerHTML += `<tr>
            <td style="color:#fff">${c.professor}</td>
            <td style="color:var(--cyan)">${c.aluno}</td>
            <td><button onclick="removerConexao(${c.id_vinculo})" style="background:transparent;color:var(--neon-red);border:1px dashed var(--neon-red);cursor:pointer;padding:4px 8px;">DESFAZER</button></td>
        </tr>`;
  });
}

function removerConexao(id_vinculo) {
  cyberConfirm("Desfazer este vínculo entre professor e aluno?", async () => {
    const res = await fetch(`/api/conexao/remover/${id_vinculo}`, {
      method: "DELETE",
    });
    if (res.ok) {
      mostrarAviso("// VÍNCULO DESFEITO.");
      carregarAdminConexoes();
      carregarAlunosDoProfessor();
    } else {
        mostrarAviso("// ERRO AO DESVINCULAR.", true);
    }
  });
}

// ─── LOJA ───
function filterProducts(cat, btn) {
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".product-card").forEach((card) =>
      card.classList.toggle("hidden", cat !== "all" && card.dataset.cat !== cat)
  );
}
