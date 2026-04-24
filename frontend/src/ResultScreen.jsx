import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, SkipForward, RotateCcw } from 'lucide-react'
import CountryFlag from './CountryFlag'
import './ResultScreen.css'

/**
 * Componente para visualização animada e sequencial do sorteio
 * Exibe 48 passos: Pote 1 (Grupos A-L), Pote 2 (A-L), Pote 3 (A-L), Pote 4 (A-L)
 */
function ResultScreen({ grupos, paisSede, onVoltar, onVoltarInicio }) {
  const [passoAtual, setPassoAtual] = useState(0)
  const [historicoPassos, setHistoricoPassos] = useState([])

  // --- FUNÇÃO HELPER GLOBAL: RETORNA LABEL DE PLAY-OFF ---
  const getPlayoffLabel = (potNumber, index) => {
    const potNum = parseInt(potNumber);
    
    if (potNum !== 4 || index < 6 || index > 11) {
      return null;
    }
    
    const labels = {
      6: 'PO World 1',
      7: 'PO World 2',
      8: 'PO UEFA 1',
      9: 'PO UEFA 2',
      10: 'PO UEFA 3',
      11: 'PO UEFA 4'
    };
    
    return labels[index] || null;
  }

  // --- CONSTRUIR FILA PLANA DE 48 PASSOS ---
  const filaCompleta = useMemo(() => {
    const fila = []
    const nomesGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    
    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time1Pote = temposGrupo[0]
      if (time1Pote) {
        fila.push({
          passo: idx,
          pote: 1,
          grupo: nomeGrupo,
          time: time1Pote,
          descricao: `Pote 1 - Grupo ${nomeGrupo}`
        })
      }
    })

    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time2Pote = temposGrupo[1]
      if (time2Pote) {
        fila.push({
          passo: 12 + idx,
          pote: 2,
          grupo: nomeGrupo,
          time: time2Pote,
          descricao: `Pote 2 - Grupo ${nomeGrupo}`
        })
      }
    })

    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time3Pote = temposGrupo[2]
      if (time3Pote) {
        fila.push({
          passo: 24 + idx,
          pote: 3,
          grupo: nomeGrupo,
          time: time3Pote,
          descricao: `Pote 3 - Grupo ${nomeGrupo}`
        })
      }
    })

    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time4Pote = temposGrupo[3]
      if (time4Pote) {
        fila.push({
          passo: 36 + idx,
          pote: 4,
          grupo: nomeGrupo,
          time: time4Pote,
          descricao: `Pote 4 - Grupo ${nomeGrupo}`
        })
      }
    })

    return fila
  }, [grupos])

  const getBloco = (nomeGrupo) => {
    const blocos = {
      1: ['A', 'B', 'C', 'D'],
      2: ['E', 'F', 'G', 'H'],
      3: ['I', 'J', 'K', 'L']
    }
    for (const [num, grupos_list] of Object.entries(blocos)) {
      if (grupos_list.includes(nomeGrupo)) return parseInt(num)
    }
    return 1
  }

  const getBlocoAtual = () => {
    if (passoAtual === 0 || filaCompleta.length === 0) return 1;
    const passoIndex = Math.min(passoAtual, filaCompleta.length - 1);
    const grupoAtual = filaCompleta[passoIndex]?.grupo;
    if (!grupoAtual) return 1;
    return getBloco(grupoAtual);
  }

  const mostrarTodasGrupos = passoAtual === filaCompleta.length;
  const blocoVisivel = getBlocoAtual()
  const gruposFiltrados = mostrarTodasGrupos 
    ? Object.entries(grupos)
    : Object.entries(grupos).filter(([nomeGrupo]) => getBloco(nomeGrupo) === blocoVisivel)

  const mapaVisibilidade = useMemo(() => {
    const mapa = {};
    filaCompleta.forEach(passo => {
      const chave = `${passo.grupo}-${passo.time.id}`;
      mapa[chave] = passo.passo;
    });
    return mapa;
  }, [filaCompleta]);

  useEffect(() => {
    if (passoAtual > 0 && filaCompleta[passoAtual - 1]) {
      const passoAnterior = filaCompleta[passoAtual - 1]
      setHistoricoPassos(prev => [
        ...prev,
        passoAnterior
      ])
    }
  }, [passoAtual, filaCompleta])

  const avancarProximo = () => {
    if (passoAtual < filaCompleta.length) {
      setPassoAtual(prev => prev + 1)
    }
  }

  const pularParaFinal = () => {
    setPassoAtual(filaCompleta.length)
  }

  const resetarSorteio = () => {
    setPassoAtual(0)
    setHistoricoPassos([])
  }

  const passoInfo = passoAtual < filaCompleta.length 
    ? filaCompleta[passoAtual] 
    : null

  const tempoAtual = passoInfo?.time
  const porcentagemProgresso = (passoAtual / filaCompleta.length) * 100

  return (
    <div className="result-screen-container">
      {/* HeaderSorteio removido para usar o cabeçalho global do App.jsx */}
      
      <div className="result-header">
        <h1>⚽ Sorteio em Andamento</h1>
        <p className="pais-sede">Países Sede: <strong>{paisSede}</strong></p>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${porcentagemProgresso}%` }}
          ></div>
        </div>
        <p className="progress-text">
          Passo <strong>{passoAtual}</strong> de <strong>{filaCompleta.length}</strong>
        </p>
      </div>

      {tempoAtual ? (
        <div className="current-team-section">
          <div className="passo-titulo">{passoInfo.descricao}</div>
          
          <div className="team-display-card">
            <div className="team-large">
              <CountryFlag
                sigla={tempoAtual.sigla}
                nome={tempoAtual.nome}
                tamanho="grande"
              />
              <h2>{tempoAtual.nome}</h2>
              <p className="team-confederation">{tempoAtual.confederacao}</p>
            </div>

            <div className="team-details">
              <div className="detail-item">
                <span className="label">Pote:</span>
                <span className="value">{tempoAtual.pote}</span>
              </div>
              <div className="detail-item">
                <span className="label">Grupo:</span>
                <span className="value">{passoInfo.grupo}</span>
              </div>
              <div className="detail-item">
                <span className="label">Confederação:</span>
                <span className="value">{tempoAtual.confederacao}</span>
              </div>
              {tempoAtual.sigla && (
                <div className="detail-item">
                  <span className="label">Sigla:</span>
                  <span className="value">{tempoAtual.sigla}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="sorteio-completo">
          <h2>🎉 Sorteio Finalizado!</h2>
          <p>Todos os 48 times foram alocados aos grupos.</p>
        </div>
      )}

      <div className="controls-section">
        <button
          className="btn-proximo"
          onClick={avancarProximo}
          disabled={passoAtual >= filaCompleta.length}
        >
          <ChevronRight size={20} />
          Próximo Time
        </button>

        <button
          className="btn-pular"
          onClick={pularParaFinal}
          disabled={passoAtual >= filaCompleta.length}
        >
          <SkipForward size={20} />
          Pular para o Final
        </button>

        <button
          className="btn-resetar"
          onClick={resetarSorteio}
        >
          <RotateCcw size={20} />
          Resetar
        </button>
      </div>

      <div className="groups-preview-section">
        <h3>📊 Visualização dos Grupos</h3>
        
        {!mostrarTodasGrupos && (
          <div className="block-tabs">
            <button className={`block-tab ${blocoVisivel === 1 ? 'active' : ''}`}>Bloco 1: A-D</button>
            <button className={`block-tab ${blocoVisivel === 2 ? 'active' : ''}`}>Bloco 2: E-H</button>
            <button className={`block-tab ${blocoVisivel === 3 ? 'active' : ''}`}>Bloco 3: I-L</button>
          </div>
        )}
        
        {mostrarTodasGrupos && (
          <div className="sorteio-fim-indicator">
            ✅ Sorteio Finalizado - Visualização Completa
          </div>
        )}

        <div className="groups-preview-grid">
          {gruposFiltrados.map(([nomeGrupo, grupoData]) => (
            <div key={nomeGrupo} className="group-preview-card">
              <div className="group-preview-title">Grupo {nomeGrupo}</div>
              <div className="group-teams-list">
                {grupoData.times.map((time, index) => {
                  const chave = `${nomeGrupo}-${time.id}`;
                  const indiceNaFila = mapaVisibilidade[chave];
                  const isVisible = indiceNaFila !== undefined && indiceNaFila <= passoAtual;
                  const wasSorted = historicoPassos.some(p => p.time.id === time.id);
                  
                  return (
                    <div 
                      key={time.id} 
                      className={`preview-team-item ${isVisible ? 'visible' : 'placeholder'} ${wasSorted ? 'sorteado' : ''}`}
                    >
                      {isVisible ? (
                        <>
                          <span className="preview-team-number">{index + 1}</span>
                          <CountryFlag sigla={time.sigla} nome={time.nome} tamanho="pequeno" />
                          <span className="preview-team-name">
                            {time.nome}
                            {time.pote === 4 && index >= 6 && (
                              <span className="playoff-tag-rs">{getPlayoffLabel(time.pote, index)}</span>
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="preview-team-number">{index + 1}</span>
                          <div className="placeholder-content"><span className="placeholder-text">—</span></div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- BOTÕES DE NAVEGAÇÃO --- */}
      <div className="actions-footer">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar para Personalizar
        </button>
        <button className="btn-voltar-inicio" onClick={onVoltarInicio}>
          🏠 Tela Inicial
        </button>
      </div>
    </div>
  )
}

export default ResultScreen