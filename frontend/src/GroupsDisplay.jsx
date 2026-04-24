import { useRef } from 'react'
import html2canvas from 'html2canvas'
import CountryFlag from './CountryFlag'
import './GroupsDisplay.css'

function GroupsDisplay({ grupos, paisSede }) {
  const groupsRef = useRef(null)
  if (!grupos) return null

  const getConfederacaoBgColor = (conf) => {
    const cores = { 'UEFA': '#3b5bdb', 'CONMEBOL': '#ffd700', 'CONCACAF': '#228B22', 'AFC': '#e74c3c', 'CAF': '#f39c12', 'OFC': '#1abc9c' }
    return cores[conf] || '#95a5a6'
  }

  const exportarComoImagem = async () => {
    if (!groupsRef.current) return
    const canvas = await html2canvas(groupsRef.current, { backgroundColor: '#000814', scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `Copa-2026-Grupos.png`;
    link.click();
  }

  return (
    <div className="groups-display-container" ref={groupsRef}>
      <div className="groups-header">
        <h2>⚽ Grupos da Copa do Mundo 2026</h2>
        <p className="pais-sede">Países Sede: <strong>{paisSede}</strong></p>
      </div>

      <div className="grupos-grid">
        {Object.entries(grupos).map(([nome, data]) => (
          <div key={nome} className="group-card">
            <div className="group-title">Grupo {nome}</div>
            <div className="teams-list" style={{ padding: '1.2rem' }}>
              {data.times.map((time, index) => (
                <div key={time.id} className="team-item">
                  <span className="team-number">{index + 1}</span>
                  <CountryFlag sigla={time.sigla} tamanho="pequeno" />
                  <span className="team-name">{time.nome}</span>
                  <span className="confederacao-badge" style={{ backgroundColor: getConfederacaoBgColor(time.confederacao) }}>
                    {time.confederacao.substring(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="export-section">
        <button className="btn-exportar" onClick={exportarComoImagem}>📸 Exportar como Imagem</button>
      </div>
    </div>
  )
}

export default GroupsDisplay