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
  if (document.getElementById("log-date"))
    document.getElementById("log-date").textContent = dateStr;
});

function toggleMenu() {
  document.getElementById("navDrawer").classList.toggle("active");
  document.getElementById("hamburger").classList.toggle("active");
}

function closeMenu() {
  document.getElementById("navDrawer").classList.remove("active");
  document.getElementById("hamburger").classList.remove("active");
}

function showSection(sectionId) {
  const todasAsTelas = [
    "home",
    "home-section",
    "perfil",
    "logbook",
    "painel-professor",
    "store",
    "schedule",
    "panel-login",
  ];
  todasAsTelas.forEach((id) => {
    const tela = document.getElementById(id);
    if (tela) tela.style.display = "none";
  });
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  const telaAtiva = document.getElementById(sectionId);
  if (telaAtiva) telaAtiva.style.display = "block";

  if (sectionId === "perfil") carregarDadosPerfil();
  if (sectionId === "painel-professor") {
    carregarAlunosDoProfessor();
    if (document.getElementById("tabela-admin-conexoes"))
      carregarAdminConexoes();
  }
  if (sectionId === "logbook") switchLogTab("push");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── TOAST ───
function mostrarAviso(msg, isError = false) {
  const toast = document.getElementById("cyber-toast");
  const toastMsg = document.getElementById("cyber-toast-msg");
  if (!toast) return;
  toastMsg.innerText = msg;
  if (isError) toast.classList.add("error");
  else toast.classList.remove("error");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// ─── MODAL DE CONFIRMAÇÃO (substitui confirm()) ───
function cyberConfirm(mensagem, onConfirm) {
  const overlay = document.getElementById("cyber-modal-overlay");
  const msgEl = document.getElementById("cyber-modal-msg");
  const btnOk = document.getElementById("cyber-modal-confirm");
  const btnNo = document.getElementById("cyber-modal-cancel");

  msgEl.textContent = mensagem;
  overlay.classList.add("active");

  const newOk = btnOk.cloneNode(true);
  const newNo = btnNo.cloneNode(true);
  btnOk.parentNode.replaceChild(newOk, btnOk);
  btnNo.parentNode.replaceChild(newNo, btnNo);

  function fechar() {
    overlay.classList.remove("active");
  }

  newOk.addEventListener("click", () => {
    fechar();
    onConfirm();
  });
  newNo.addEventListener("click", fechar);
  overlay.addEventListener(
    "click",
    (e) => {
      if (e.target === overlay) fechar();
    },
    { once: true },
  );
}

// === PERFIL ===
async function carregarDadosPerfil() {
  try {
    mostrarAviso("// ACESSANDO CORE NEURAL...");
    const response = await fetch("/api/usuario/perfil");
    const data = await response.json();
    if (response.ok) {
      [
        "nome",
        "cpf",
        "email",
        "objetivo",
        "peso",
        "altura",
        "genero",
        "data",
      ].forEach((campo) => {
        let val = data[campo === "data" ? "data_nascimento" : campo];
        if (document.getElementById(`perfil-${campo}`))
          document.getElementById(`perfil-${campo}`).value =
            val !== null ? val : "";
      });
      const fotoUrl =
        data.foto_url || "/static/uploads/perfil/default_avatar.png";
      if (document.getElementById("perfil-img-display"))
        document.getElementById("perfil-img-display").src = fotoUrl;
      if (document.getElementById("header-profile-img"))
        document.getElementById("header-profile-img").src = fotoUrl;
    }
  } catch (e) {
    mostrarAviso("// ERRO CRÍTICO NA CONEXÃO NEURAL.", true);
  }
}

async function salvarPerfil() {
  const senha = document.getElementById("perfil-senha-confirma").value;
  if (!senha)
    return mostrarAviso("// SEGURANÇA: DIGITE SUA SENHA PARA CONFIRMAR.", true);

  const formData = new FormData();
  [
    "nome",
    "cpf",
    "email",
    "data",
    "genero",
    "peso",
    "altura",
    "objetivo",
  ].forEach((campo) => {
    formData.append(
      campo === "data" ? "data_nascimento" : campo,
      document.getElementById(`perfil-${campo}`).value,
    );
  });
  formData.append("senha_confirmacao", senha);

  const foto = document.getElementById("perfil-foto-input")
    ? document.getElementById("perfil-foto-input").files[0]
    : null;
  if (foto) formData.append("foto", foto);

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
    reader.onload = (e) =>
      (document.getElementById("perfil-img-display").src = e.target.result);
    reader.readAsDataURL(input.files[0]);
  }
}

function deletarConta() {
  cyberConfirm(
    "ATENÇÃO: SEU REGISTRO SERÁ APAGADO PERMANENTEMENTE DA CYBERFORCE. ESTA AÇÃO É IRREVERSÍVEL.",
    () => {
      fetch("/api/usuario/excluir", { method: "POST" }).then(
        () => (window.location.href = "/"),
      );
    },
  );
}

function toggleDropdown() {
  const dd = document.getElementById("user-dropdown");
  if (dd) dd.style.display = dd.style.display === "none" ? "block" : "none";
}

// === LOGBOOK ALUNO ===
function switchLogTab(cat) {
  document
    .querySelectorAll(".log-tab")
    .forEach((t) => t.classList.remove("active"));
  const tabEl = document.querySelector(`.log-tab.${cat}`);
  if (tabEl) tabEl.classList.add("active");
  carregarLogbook(cat);
}

async function carregarLogbook(categoria) {
  const tbody = document.getElementById("logbook-tbody");
  const badge = document.getElementById("categoria-badge");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="4" style="text-align:center">// SINCRONIZANDO...</td></tr>';
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
  } else
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-dim)">${data.mensagem}</td></tr>`;
}

async function salvarCargaRapida(idItem, novaCarga) {
  await fetch("/api/treino/atualizar_carga", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_item_treino: idItem, nova_carga: novaCarga }),
  });
}

// === PAINEL DO PROFESSOR ===
let listaAlunosLocal = [];
let alunoSelecionadoId = null;

async function carregarAlunosDoProfessor() {
  const grid = document.getElementById("grid-alunos");
  if (!grid) return;
  grid.innerHTML = '<p class="log-date">// ACESSANDO BANCO DE DADOS...</p>';
  const res = await fetch("/api/professor/meus_alunos");
  listaAlunosLocal = await res.json();
  renderizarListaAlunos(listaAlunosLocal);
}

function renderizarListaAlunos(lista) {
  const grid = document.getElementById("grid-alunos");
  grid.innerHTML = "";
  lista.forEach((a) => {
    grid.innerHTML += `<div class="eq-card" onclick="abrirCriadorTreino(${a.id_aluno}, '${a.nome}')">
            <div class="eq-name">${a.nome.toUpperCase()}</div>
            <div class="eq-tag">ID: ${a.id_aluno}</div>
            <button onclick="event.stopPropagation(); desvincularAlunoProfessor(${a.id_aluno})" style="margin-top:10px; background:transparent; border:1px solid var(--neon-red); color:var(--neon-red); font-size:0.6rem; cursor:pointer; width:100%;">DESVINCULAR</button>
        </div>`;
  });
}

function filtrarAlunosLocal(termo) {
  renderizarListaAlunos(
    listaAlunosLocal.filter((a) =>
      a.nome.toLowerCase().includes(termo.toLowerCase()),
    ),
  );
}
function ordenarAlunosAz() {
  renderizarListaAlunos(
    [...listaAlunosLocal].sort((a, b) => a.nome.localeCompare(b.nome)),
  );
}

async function buscarNovoAluno() {
  const termo = document.getElementById("busca-aluno-input").value;
  const lista = document.getElementById("resultado-busca");
  if (termo.length < 2)
    return mostrarAviso("// DIGITE AO MENOS 2 CARACTERES", true);

  lista.style.display = "block";
  lista.innerHTML = '<p style="color:var(--cyan);">Buscando...</p>';

  const res = await fetch(`/api/professor/buscar_aluno/${termo}`);
  const alunos = await res.json();
  lista.innerHTML = "";
  if (alunos.length === 0)
    return (lista.innerHTML =
      '<p style="color:var(--neon-red);">// NENHUM ALUNO ENCONTRADO.</p>');

  alunos.forEach((a) => {
    lista.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.6); padding:10px; margin-bottom:5px; border-left:3px solid var(--cyan);">
            <span style="color:#fff;">${a.nome} <span style="font-size:0.7rem;">(ID: ${a.id})</span></span>
            <button onclick="vincularAluno(${a.id})" class="filter-btn" style="padding:2px 10px; font-size:0.7rem;">+ VINCULAR</button>
        </div>`;
  });
}

async function buscarTodosAlunos() {
  const lista = document.getElementById("resultado-busca");
  lista.style.display = "block";
  lista.innerHTML =
    '<p style="color:var(--cyan);">Buscando banco central de alunos...</p>';

  try {
    const res = await fetch(`/api/professor/todos_alunos`);
    const alunos = await res.json();
    lista.innerHTML = "";
    if (alunos.length === 0)
      return (lista.innerHTML =
        '<p style="color:var(--neon-red);">// NENHUM ALUNO CADASTRADO NO SISTEMA.</p>');

    alunos.forEach((a) => {
      lista.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.6); padding:10px; margin-bottom:5px; border-left:3px solid var(--purple);">
                <span style="color:#fff;">${a.nome} <span style="font-size:0.7rem;">(ID: ${a.id})</span></span>
                <button onclick="vincularAluno(${a.id})" class="filter-btn" style="padding:2px 10px; font-size:0.7rem; border-color:var(--purple); color:var(--purple);">+ RECRUTAR</button>
            </div>`;
    });
  } catch (e) {
    lista.innerHTML =
      '<p style="color:var(--neon-red);">// ERRO DE CONEXÃO NEURAL.</p>';
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
  } else mostrarAviso(`// ERRO: ${data.mensagem}`, true);
}

async function desvincularAlunoProfessor(id_aluno) {
  cyberConfirm(
    "ATENÇÃO: Deseja realmente remover este aluno da sua tutela?",
    async () => {
      try {
        const res = await fetch(
          `/api/professor/desvincular_aluno/${id_aluno}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          mostrarAviso("// ALUNO REMOVIDO DO SEU COMANDO.");
          carregarAlunosDoProfessor();
        } else mostrarAviso("// ERRO AO DESVINCULAR.", true);
      } catch (e) {
        mostrarAviso("// ERRO DE CONEXÃO NEURAL.", true);
      }
    },
  );
}

function abrirCriadorTreino(id, nome) {
  alunoSelecionadoId = id;
  document.getElementById("lista-alunos-container").style.display = "none";
  document.getElementById("form-treino").style.display = "block";
  document.getElementById("nome-aluno-selecionado").textContent =
    `ALUNO: ${nome}`;
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
  tbody.innerHTML =
    '<tr><td colspan="5" style="text-align:center; color:var(--cyan)">// EXTRAINDO DADOS NEURAIS...</td></tr>';

  try {
    const res = await fetch(
      `/api/professor/ver_treino/${alunoSelecionadoId}/${cat}`,
    );
    const data = await res.json();
    tbody.innerHTML = "";
    if (data.exercicios && data.exercicios.length > 0) {
      data.exercicios.forEach((ex) => {
        tbody.innerHTML += `<tr>
                    <td><input type="text" class="field-input ex-nome-input" value="${ex.nome}"></td>
                    <td><input type="number" class="log-input ex-series" value="${ex.series}"></td>
                    <td><input type="number" class="log-input ex-reps" value="${ex.reps}"></td>
                    <td><input type="number" class="log-input weight ex-carga" value="${ex.carga}"></td>
                    <td><button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:var(--neon-red); cursor:pointer;">X</button></td>
                </tr>`;
      });
    } else adicionarLinhaExercicio();
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; color:var(--neon-red)">// ERRO DE CONEXÃO OU TREINO INEXISTENTE.</td></tr>';
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
        <td><button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:var(--neon-red); cursor:pointer;">X</button></td>
    `;
  tbody.appendChild(tr);
}

async function salvarTreinoCompleto() {
  const exercicios = Array.from(
    document.querySelectorAll("#corpo-treino-novo tr"),
  ).map((linha) => ({
    nome: linha.querySelector(".ex-nome-input").value,
    series: linha.querySelector(".ex-series").value,
    reps: linha.querySelector(".ex-reps").value,
    carga: linha.querySelector(".ex-carga").value,
  }));

  mostrarAviso("// SINCRONIZANDO PROTOCOLO...");

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
    mostrarAviso("// ERRO CRÍTICO NO BANCO. Tente novamente.", true);
    fecharCriadorTreino();
  }
}

// === ADMIN ===
async function carregarAdminConexoes() {
  const res = await fetch("/api/admin/conexoes");
  if (res.status === 403) return;
  document.getElementById("admin-conexoes").style.display = "block";
  const conexoes = await res.json();
  const tbody = document.getElementById("tabela-admin-conexoes");
  tbody.innerHTML = "";
  conexoes.forEach((c) => {
    tbody.innerHTML += `<tr>
            <td style="color:#fff">${c.professor}</td>
            <td style="color:var(--cyan)">${c.aluno}</td>
            <td><button onclick="removerConexao(${c.id_vinculo})" style="background:transparent; color:var(--neon-red); border:1px dashed var(--neon-red); cursor:pointer;">DESFAZER</button></td>
        </tr>`;
  });
}

async function removerConexao(id_vinculo) {
  cyberConfirm(
    "Deseja realmente desfazer este vínculo professor-aluno?",
    async () => {
      const res = await fetch(`/api/conexao/remover/${id_vinculo}`, {
        method: "DELETE",
      });
      if (res.ok) {
        mostrarAviso("// VÍNCULO DESFEITO.");
        carregarAdminConexoes();
        carregarAlunosDoProfessor();
      } else mostrarAviso("// ERRO AO DESVINCULAR.", true);
    },
  );
}

// === LOJA ===
function filterProducts(cat, btn) {
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document
    .querySelectorAll(".product-card")
    .forEach((card) =>
      card.classList.toggle(
        "hidden",
        cat !== "all" && card.dataset.cat !== cat,
      ),
    );
}
