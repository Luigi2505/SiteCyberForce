let produtosEstoque = [];

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("productGrid")) {
    carregarEstoque();
  }
});

async function carregarEstoque() {
  try {
    const response = await fetch("/api/produtos");
    produtosEstoque = await response.json();
    renderizarProdutos("all");
  } catch (e) {
    console.error("Erro ao carregar estoque:", e);
  }
}

function formatarMoeda(input) {
  let valor = input.value.replace(/[^\d.,]/g, "");
  if (!valor) {
    input.value = "";
    return;
  }
  valor = valor.replace(",", ".");
  let num = parseFloat(valor);
  if (isNaN(num)) {
    input.value = "";
    return;
  }
  input.value = num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function renderizarProdutos(categoriaFiltro) {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  let htmlProdutos = "";

  produtosEstoque.forEach((prod) => {
    if (categoriaFiltro !== "all" && prod.cat !== categoriaFiltro) return;

    const isEsgotado = prod.status === "out";
    const cardClass = isEsgotado ? "product-card out" : "product-card";
    const statusClass = isEsgotado ? "status-out" : "status-available";
    const statusText = isEsgotado ? "ESGOTADO" : `DISPONÍVEL: ${prod.quantity}`;

    let adminControls = "";
    if (
      typeof userPerfil !== "undefined" &&
      (userPerfil === "admin" || userPerfil === "treinador")
    ) {
      adminControls = `
        <div style="margin-top: 15px; border-top: 1px solid rgba(0,212,255,0.2); padding-top: 10px;">
          <div style="display: flex; gap: 5px; margin-bottom: 8px;">
            <input type="number" id="qtd-${prod.id}" value="${prod.quantity}" min="0" max="9999"
                   class="admin-input" style="padding: 2px 5px; height: 30px; font-size: 0.7rem; width: 100%;">
            <button onclick="salvarQtd(${prod.id})" class="filter-btn"
                    style="padding: 2px 10px; font-size: 0.6rem; height: 30px;">SALVAR</button>
          </div>
          <button onclick="deletarProdutoBD(${prod.id})"
                  style="width:100%; background:transparent; border:1px dashed var(--neon-red);
                         color:var(--neon-red); cursor:pointer; font-size: 0.6rem; padding: 5px;">EXCLUIR PRODUTO</button>
        </div>
      `;
    }

    htmlProdutos += `
      <div class="${cardClass}" data-cat="${prod.cat}">
        <span class="product-status ${statusClass}">${statusText}</span>
        <span class="product-img">${prod.icon}</span>
        <div class="product-name">${prod.name}</div>
        <div class="product-brand">${prod.brand}</div>
        <span class="product-cat-tag">${prod.cat.toUpperCase()}</span>
        <span class="product-price">${prod.price}</span>
        ${adminControls}
      </div>
    `;
  });

  grid.innerHTML = htmlProdutos;
}

function filterProducts(categoria, botaoClicado) {
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  botaoClicado.classList.add("active");
  renderizarProdutos(categoria);
}

async function adicionarProdutoBD() {
  const payload = {
    icon: document.getElementById("novo-icone").value,
    name: document.getElementById("novo-nome").value,
    brand: document.getElementById("nova-marca").value,
    cat: document.getElementById("nova-cat").value,
    price: document.getElementById("novo-preco").value,
    status: document.getElementById("novo-status").value,
    quantity: parseInt(document.getElementById("novo-qtd").value) || 0,
  };

  if (!payload.name || !payload.price) {
    mostrarAviso("// ERRO: PREENCHA O NOME E O PREÇO DO PRODUTO.", true);
    return;
  }

  try {
    const response = await fetch("/api/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.sucesso) {
      document.getElementById("novo-nome").value = "";
      document.getElementById("novo-icone").value = "";
      document.getElementById("nova-marca").value = "";
      document.getElementById("novo-preco").value = "";
      document.getElementById("novo-qtd").value = "0";
      mostrarAviso("// PRODUTO CADASTRADO COM SUCESSO.");
      carregarEstoque();
    } else {
      mostrarAviso("// ERRO: " + result.mensagem, true);
    }
  } catch (e) {
    mostrarAviso("// FALHA DE CONEXÃO COM O SERVIDOR.", true);
    console.error(e);
  }
}

async function salvarQtd(id) {
  const novaQtd = document.getElementById(`qtd-${id}`).value;
  try {
    const response = await fetch(`/api/produtos/${id}/quantidade`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: parseInt(novaQtd) }),
    });
    if (response.ok) {
      mostrarAviso("// QUANTIDADE ATUALIZADA.");
      carregarEstoque();
    } else {
      mostrarAviso("// ERRO AO ATUALIZAR QUANTIDADE.", true);
    }
  } catch (e) {
    mostrarAviso("// FALHA DE CONEXÃO COM O SERVIDOR.", true);
    console.error(e);
  }
}

async function deletarProdutoBD(id) {
  cyberConfirm(
    "Tem certeza que deseja excluir este produto do estoque? Esta ação é irreversível.",
    async () => {
      try {
        const response = await fetch(`/api/produtos/${id}`, {
          method: "DELETE",
        });
        const result = await response.json();

        if (result.sucesso) {
          mostrarAviso("// PRODUTO REMOVIDO DO ESTOQUE.");
          carregarEstoque();
        } else {
          mostrarAviso("// ERRO AO EXCLUIR: " + result.mensagem, true);
        }
      } catch (e) {
        mostrarAviso("// FALHA DE CONEXÃO COM O SERVIDOR.", true);
        console.error(e);
      }
    },
  );
}
