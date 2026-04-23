import CountryFlag from './CountryFlag'
import './GroupsDisplay.css'

function GroupsDisplay({ grupos, paisSede }) {
  if (!grupos) return null

  const getConfederacaoBgColor = (confederacao) => {
    const cores = {
      'UEFA': '#3b5bdb',
      'CONMEBOL': '#ffd700',
      'CONCACAF': '#228B22',
      'AFC': '#e74c3c',
      'CAF': '#f39c12',
      'OFC': '#1abc9c'
    }
    return cores[confederacao] || '#95a5a6'
  }

  return (
    <div className="groups-display-container">
      <div className="groups-header">
        <h2>⚽ Grupos da Copa do Mundo 2026</h2>
        <p className="pais-sede">Países Sede: <strong>{paisSede}</strong></p>
      </div>

      <div className="groups-grid">
        {Object.entries(grupos).map(([nomeGrupo, grupoData]) => (
          <div key={nomeGrupo} className="group-card">
            <div className="group-title">Grupo {nomeGrupo}</div>
            <div className="teams-list">
              {grupoData.times.map((time, index) => (
                <div key={time.id} className="team-item">
                  <span className="team-number">{index + 1}</span>
                  <CountryFlag
                    sigla={time.sigla}
                    nome={time.nome}
                    tamanho="pequeno"
                  />
                  <span className="team-name">{time.nome}</span>
                  <span
                    className="confederacao-badge"
                    style={{ backgroundColor: getConfederacaoBgColor(time.confederacao) }}
                    title={time.confederacao}
                  >
                    {time.confederacao.substring(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="legend">
        <h3>Confederações</h3>
        <div className="legend-items">
          {['UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC'].map(conf => (
            <div key={conf} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: getConfederacaoBgColor(conf) }}
              ></span>
              <span>{conf}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GroupsDisplay
