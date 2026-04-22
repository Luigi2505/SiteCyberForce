function criarCard(img, name, spec, tag) {
  return `
    
    <div class="eq-card">
    <img class="eq-card-img" src="${img}" alt="${name}">
      <div class="eq-name">${name}</div>
      <div class="eq-spec">${spec}</div>
      <span class="eq-tag">${tag}</span>
    </div>
  `
}

function criarGrupo(title, cards) {
  return `
    <div class="section-header">
      <h2 class="section-title">${title}</h2>
    </div>
    <div class="equipment-grid">
      ${cards}
    </div>
  `
}

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('equipamentos-container')

  // PEITORAL
  container.innerHTML += criarGrupo("PEITORAL", 
    criarCard("images/chestpress.png", "SUPINO", "100KG", "MÁQUINA") +
    criarCard("images/benchpress.png", "SUPINO", "80KG", "LIVRE") + 
    criarCard("images/chestfly.png", "CRUCIFIXO", "80KG", "MÁQUINA")
  )


  // COSTAS
  container.innerHTML += criarGrupo("COSTAS", 
    criarCard("images/row.png", "REMADA", "100KG", "MÁQUINA") +
    criarCard("images/latpulldown.png", "PUXADA", "80KG", "MÁQUINA") 
  )

  // OMBRO
  container.innerHTML += criarGrupo("OMBRO", 
    criarCard("images/shoulderpress.png", "DESENVOLVIMENTO", "100KG", "MÁQUINA") +
    criarCard("images/lateralraise.png", "ELEVAÇÃO LATERAL", "80KG", "MÁQUINA") 
  )

  // BRAÇOS
  container.innerHTML += criarGrupo("BRAÇOS", 
    criarCard("images/curl.png", "ROSCA SCOTT", "100KG", "A") +
    criarCard("images/dip.png", "EXTENSÃO TRÍCEPS", "80KG", "B")
  )

  // PERNAS
  container.innerHTML += criarGrupo("PERNAS", 
    criarCard("images/legpress.png", "LEGPRESS", "100KG", "MÁQUINA") +
    criarCard("images/legextension.png", "CADEIRA EXTENSORA", "80KG", "MÁQUINA") +
    criarCard("images/legcurl.png", "CADEIRA FLEXORA", "100KG", "MÁQUINA") +
    criarCard("images/abductor-adductor.png", "CADEIRA ABDUTORA/ADUTORA", "80KG", "MÁQUINA") +
    criarCard("images/calfraise.png", "ELEVAÇÃO DE PANTURRILHA", "80KG", "MÁQUINA")
  )

  
  // OUTROS
  container.innerHTML += criarGrupo("OUTROS", 
    criarCard("images/cage.png", "GAIOLAS", "100KG", "A") +
    criarCard("images/pulley.png", "POLIAS", "80KG", "B")
  )


})