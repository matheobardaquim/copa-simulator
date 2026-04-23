import { useState, useEffect } from 'react'
import axios from 'axios'
import './PotCustomizer.css'

function PotCustomizer({ onSorteio, paisSede }) {
  const [potes, setPotes] = useState({})
  const [tempoExibicao, setTempoExibicao] = useState('todos')
  const [loadingSorteio, setLoadingSorteio] = useState(false)
  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    carregarPotesDefault()
  }, [])

  const carregarPotesDefault = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/times/potes`)
      if (response.data.success) {
        setPotes(response.data.potes)
      }
    } catch (error) {
      console.error('Erro ao carregar potes:', error)
    }
  }

  // --- LÓGICA DE VALIDAÇÃO (BACKEND-READY) ---
  const getStatusPote = (num) => {
    const count = potes[num]?.length || 0;
    if (count === 12) return 'valid';
    return count > 12 ? 'excess' : 'missing';
  };

  const isTudoValido = () => {
    return Object.values(potes).every(p => p.length === 12);
  };

  const handleDragStart = (e, time, potOrigem) => {
    e.dataTransfer.setData('timeObj', JSON.stringify(time))
    e.dataTransfer.setData('potOrigem', potOrigem)
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleDrop = (e, potDestino) => {
    e.preventDefault()
    const timeObj = JSON.parse(e.dataTransfer.getData('timeObj'))
    const potOrigem = parseInt(e.dataTransfer.getData('potOrigem'))

    if (potOrigem !== potDestino) {
      const novosPotes = {
        ...potes,
        [potOrigem]: potes[potOrigem].filter(t => t.id !== timeObj.id),
        [potDestino]: [...potes[potDestino], timeObj]
      }
      setPotes(novosPotes)
    }
  }

  const handleIniciarSorteio = async () => {
    if (!isTudoValido()) return;
    try {
      setLoadingSorteio(true)
      await onSorteio(potes)
    } finally {
      setLoadingSorteio(false)
    }
  }

  return (
    <div className="pot-customizer-container">
      <div className="customizer-header">
        <h2>🎯 Personalizar Potes</h2>
        <p>Arraste os times. Cada pote <strong>deve ter exatamente 12 seleções</strong>.</p>
      </div>

      <div className="display-options">
        <button
          className={tempoExibicao === 'todos' ? 'active' : ''}
          onClick={() => setTempoExibicao('todos')}
        >
          Visão Geral
        </button>
        {Object.keys(potes).map(num => (
          <button
            key={num}
            className={`${tempoExibicao === `pote${num}` ? 'active' : ''} btn-pote-${getStatusPote(num)}`}
            onClick={() => setTempoExibicao(`pote${num}`)}
          >
            Pote {num} ({potes[num]?.length}/12)
          </button>
        ))}
      </div>

      <div className="pots-grid">
        {Object.entries(potes).map(([numPote, times]) => {
          if (tempoExibicao !== 'todos' && tempoExibicao !== `pote${numPote}`) return null;
          
          const status = getStatusPote(numPote);
          
          return (
            <div
              key={numPote}
              className={`pot-column pote-${numPote} ${status !== 'valid' ? 'pot-invalid' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, parseInt(numPote))}
            >
              <div className="pot-title">
                <h3>Pote {numPote}</h3>
                <span className={`pot-counter-badge ${status}`}>
                  {times.length}
                </span>
              </div>
              <div className="teams-list">
                {times.map(time => (
                  <div
                    key={time.id}
                    className="team-draggable"
                    draggable
                    onDragStart={(e) => handleDragStart(e, time, parseInt(numPote))}
                  >
                    <span className="team-name">{time.nome}</span>
                    <span className="confederacao-tag">{time.confederacao}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="customizer-actions">
        <button className="reset-btn" onClick={carregarPotesDefault}>
          ↻ Restaurar Padrão
        </button>
        
        <button
          className={`sorteio-btn ${isTudoValido() ? 'ready' : 'disabled'}`}
          onClick={handleIniciarSorteio}
          disabled={loadingSorteio || !isTudoValido()}
        >
          {loadingSorteio ? '⏳ Processando...' : '🎱 Realizar Sorteio'}
        </button>
      </div>

      {/* --- MENSAGENS DE ERRO DINÂMICAS --- */}
      {!isTudoValido() && (
        <div className="validation-summary">
          {Object.entries(potes).map(([num, t]) => (
            t.length !== 12 && (
              <p key={num} className="error-text">
                • O <strong>Pote {num}</strong> está com {t.length} times (precisa de 12).
              </p>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export default PotCustomizer