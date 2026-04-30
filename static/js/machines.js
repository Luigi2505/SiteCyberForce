function criarCard(img, name, spec, tag) {
  return `
    
    <div class="eq-card">
    <img class="eq-card-img" src="${img}" alt="${name}">
      <div class="eq-name">${name}</div>
      <div class="eq-spec">${spec}</div>
      <span class="eq-tag">${tag}</span>
    </div>
  `;
}

function criarGrupo(title, cards) {
  return `
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
    </div>
    <div class="equipment-grid">
      ${cards}
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("equipamentos-container");

  // PEITORAL
  container.innerHTML += criarGrupo(
    "PEITORAL",
    criarCard("static/images/chestpress.png", "SUPINO", "100KG", "MÁQUINA") +
      criarCard("static/images/benchpress.png", "SUPINO", "80KG", "LIVRE") +
      criarCard("static/images/chestfly.png", "CRUCIFIXO", "80KG", "MÁQUINA"),
  );

  // COSTAS
  container.innerHTML += criarGrupo(
    "COSTAS",
    criarCard("static/images/row.png", "REMADA", "100KG", "MÁQUINA") +
      criarCard("static/images/latpulldown.png", "PUXADA", "80KG", "MÁQUINA"),
  );

  // OMBRO
  container.innerHTML += criarGrupo(
    "OMBRO",
    criarCard(
      "static/images/shoulderpress.png",
      "DESENVOLVIMENTO",
      "100KG",
      "MÁQUINA",
    ) +
      criarCard(
        "static/images/lateralraise.png",
        "ELEVAÇÃO LATERAL",
        "80KG",
        "MÁQUINA",
      ),
  );

  // BRAÇOS
  container.innerHTML += criarGrupo(
    "BRAÇOS",
    criarCard("static/images/curl.png", "ROSCA SCOTT", "100KG", "A") +
      criarCard("static/images/dip.png", "EXTENSÃO TRÍCEPS", "80KG", "B"),
  );

  // PERNAS
  container.innerHTML += criarGrupo(
    "PERNAS",
    criarCard("static/images/legpress.png", "LEGPRESS", "100KG", "MÁQUINA") +
      criarCard(
        "static/images/legextension.png",
        "CADEIRA EXTENSORA",
        "80KG",
        "MÁQUINA",
      ) +
      criarCard(
        "static/images/legcurl.png",
        "CADEIRA FLEXORA",
        "100KG",
        "MÁQUINA",
      ) +
      criarCard(
        "static/images/abductor-adductor.png",
        "CADEIRA ABDUTORA/ADUTORA",
        "80KG",
        "MÁQUINA",
      ) +
      criarCard(
        "static/images/calfraise.png",
        "ELEVAÇÃO DE PANTURRILHA",
        "80KG",
        "MÁQUINA",
      ),
  );

  // OUTROS
  container.innerHTML += criarGrupo(
    "OUTROS",
    criarCard("static/images/cage.png", "GAIOLAS", "100KG", "A") +
      criarCard("static/images/pulley.png", "POLIAS", "80KG", "B"),
  );
});
