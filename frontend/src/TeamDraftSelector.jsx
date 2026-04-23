import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Search } from 'lucide-react'
import CountryFlag from './CountryFlag'
import './TeamDraftSelector.css'

/**
 * Componente para seleção de times extras via draft
 * @param {Array} timesEscolhidos - Times já selecionados para não mostrar duplicatas
 * @param {function} onSelectTime - Callback quando um time é selecionado
 * @param {function} onClose - Callback para fechar o seletor
 */
function TeamDraftSelector({ timesEscolhidos = [], onSelectTime, onClose }) {
  const [timesDisponiveis, setTimesDisponiveis] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroConfederacao, setFiltroConfederacao] = useState('TODOS')
  const API_BASE = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    carregarTimesDisponiveis()
  }, [])

  const carregarTimesDisponiveis = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/api/times/disponiveis`)
      if (response.data.success) {
        setTimesDisponiveis(response.data.times)
      }
    } catch (error) {
      console.error('Erro ao carregar times disponíveis:', error)
    } finally {
      setLoading(false)
    }
  }

  const idsJaSelecionados = new Set(timesEscolhidos.map(t => t.id))

  const confederacoes = [
    'TODOS',
    ...new Set(timesDisponiveis.map(t => t.confederacao))
  ]

  const timesFiltrados = timesDisponiveis
    .filter(t => !idsJaSelecionados.has(t.id))
    .filter(t => {
      const matchBusca =
        t.nome.toLowerCase().includes(busca.toLowerCase()) ||
        t.sigla.toLowerCase().includes(busca.toLowerCase())
      const matchConfederacao =
        filtroConfederacao === 'TODOS' || t.confederacao === filtroConfederacao
      return matchBusca && matchConfederacao
    })
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))

  return (
    <div className="team-draft-selector-overlay">
      <div className="team-draft-selector-modal">
        <div className="modal-header">
          <h2>🎯 Selecionar Time para Draft</h2>
          <button className="close-btn" onClick={onClose} title="Fechar">
            <X size={24} />
          </button>
        </div>

        <div className="modal-filters">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou sigla..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={filtroConfederacao}
            onChange={(e) => setFiltroConfederacao(e.target.value)}
            className="confederation-filter"
          >
            {confederacoes.map(conf => (
              <option key={conf} value={conf}>
                {conf === 'TODOS' ? 'Todas as Confederações' : conf}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-content">
          {loading ? (
            <p className="loading-text">Carregando times disponíveis...</p>
          ) : timesFiltrados.length > 0 ? (
            <div className="teams-grid">
              {timesFiltrados.map(time => (
                <div
                  key={time.id}
                  className="draft-team-card"
                  onClick={() => {
                    onSelectTime(time)
                    onClose()
                  }}
                >
                  <CountryFlag
                    sigla={time.sigla}
                    nome={time.nome}
                    tamanho="pequeno"
                  />
                  <div className="team-info">
                    <h4>{time.nome}</h4>
                    <p className="confederation">{time.confederacao}</p>
                    {time.rank && (
                      <p className="rank">
                        <strong>Rank:</strong> #{time.rank}
                      </p>
                    )}
                    {time.pontos && (
                      <p className="points">
                        <strong>Pts:</strong> {time.pontos.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-results">
              {busca || filtroConfederacao !== 'TODOS'
                ? 'Nenhum time encontrado com os critérios de busca.'
                : 'Nenhum time disponível para draft.'}
            </p>
          )}
        </div>

        <div className="modal-footer">
          <p className="info-text">
            {idsJaSelecionados.size > 0 &&
              `${idsJaSelecionados.size} time(s) já selecionado(s) - não aparecem acima`}
          </p>
          <button className="close-modal-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default TeamDraftSelector
