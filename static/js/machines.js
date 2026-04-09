function criarCard(name, spec, tag) {
  return `
    <div class="eq-card">
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
  container.innerHTML = criarGrupo("COSTAS", 
    criarCard("SUPINO RETO MÁQUINA", "100KG", "A") +
    criarCard("OUTRO APARELHO", "80KG", "B")
  )

  // COSTAS
  container.innerHTML = criarGrupo("COSTAS", 
    criarCard("SUPINO RETO MÁQUINA", "100KG", "A") +
    criarCard("OUTRO APARELHO", "80KG", "B")
  )

  // OMBRO
  container.innerHTML = criarGrupo("COSTAS", 
    criarCard("SUPINO RETO MÁQUINA", "100KG", "A") +
    criarCard("OUTRO APARELHO", "80KG", "B")
  )

  // BRAÇOS
  container.innerHTML = criarGrupo("COSTAS", 
    criarCard("SUPINO RETO MÁQUINA", "100KG", "A") +
    criarCard("OUTRO APARELHO", "80KG", "B")
  )

  // PERNAS
  container.innerHTML = criarGrupo("COSTAS", 
    criarCard("SUPINO RETO MÁQUINA", "100KG", "A") +
    criarCard("OUTRO APARELHO", "80KG", "B")
  )

  // OUTROS
  container.innerHTML = criarGrupo("COSTAS", 
    criarCard("SUPINO RETO MÁQUINA", "100KG", "A") +
    criarCard("OUTRO APARELHO", "80KG", "B")
  )

  // BANCOS
  container.innerHTML = criarGrupo("COSTAS", 
    criarCard("SUPINO RETO MÁQUINA", "100KG", "A") +
    criarCard("OUTRO APARELHO", "80KG", "B")
  )
})