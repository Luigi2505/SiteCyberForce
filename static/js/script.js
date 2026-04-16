  // Set live date
  const now = new Date();
  const days = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
  const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  const dateStr = `// ${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} — ${days[now.getDay()]}-FEIRA`;
  if(document.getElementById('log-date')) document.getElementById('log-date').textContent = dateStr;

  // Section navigation
  function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const map = {home:0,logbook:1,store:2,schedule:3};
    document.querySelectorAll('.nav-item')[map[id]]?.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
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
    // Recupera o tipo de conta que salvamos no login
    const userType = localStorage.getItem('cyberforce_user_type');
    const menuProfessor = document.getElementById('menu-professor');
    
    // Se o tipo for 2 (Professor), exibe o item de menu
    // Usamos == em vez de === porque o localStorage salva tudo como texto ("2")
    if (userType == "treinador" && menuProfessor) {
        menuProfessor.style.display = 'block';
    }
});

