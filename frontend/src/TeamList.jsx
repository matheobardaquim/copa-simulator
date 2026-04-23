import { useState, useEffect } from 'react'
import axios from 'axios'
import './TeamList.css'

function TeamList() {
  const [times, setTimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroConfederacao, setFiltroConfederacao] = useState('TODOS')
  const [filtroPote, setFiltroPote] = useState('TODOS')
  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchTimes()
  }, [])

  const fetchTimes = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/api/times`)
      setTimes(response.data.times)
    } catch (error) {
      console.error('Erro ao carregar times:', error)
    } finally {
      setLoading(false)
    }
  }

  const confederacoes = ['TODOS', ...new Set(times.map(t => t.confederacao))]
  const potes = ['TODOS', ...new Set(times.map(t => t.pote))]

  const timesFiltrados = times.filter(time => {
    const matchConfederacao = filtroConfederacao === 'TODOS' || time.confederacao === filtroConfederacao
    const matchPote = filtroPote === 'TODOS' || time.pote === parseInt(filtroPote)
    return matchConfederacao && matchPote
  })

  const contarPorConfederacao = (confederacao) => {
    return times.filter(t => t.confederacao === confederacao).length
  }

  return (
    <div className="team-list-container">
      <div className="filters">
        <div className="filter-group">
          <label>Confederação:</label>
          <select value={filtroConfederacao} onChange={(e) => setFiltroConfederacao(e.target.value)}>
            {confederacoes.map(conf => (
              <option key={conf} value={conf}>
                {conf === 'TODOS' ? 'Todas as Confederações' : `${conf} (${contarPorConfederacao(conf)})`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Pote:</label>
          <select value={filtroPote} onChange={(e) => setFiltroPote(e.target.value)}>
            {potes.map(pote => (
              <option key={pote} value={pote}>
                {pote === 'TODOS' ? 'Todos os Potes' : `Pote ${pote}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Carregando times...</p>
      ) : (
        <div className="teams-grid">
          {timesFiltrados.length > 0 ? (
            timesFiltrados.map(time => (
              <div key={time.id} className={`team-card pote-${time.pote}`}>
                <div className="team-header">
                  <h3>{time.nome}</h3>
                  <span className={`pote-badge pote-${time.pote}`}>Pote {time.pote}</span>
                </div>
                <p className="team-confederation">{time.confederacao}</p>
              </div>
            ))
          ) : (
            <p className="no-results">Nenhum time encontrado com os filtros selecionados</p>
          )}
        </div>
      )}

      <div className="stats">
        <p>Total de times exibidos: <strong>{timesFiltrados.length}</strong> / 48</p>
      </div>
    </div>
  )
}

export default TeamList
