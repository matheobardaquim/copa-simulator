import { useState, useEffect, useMemo } from 'react'
import { ChevronRight, SkipForward, RotateCcw } from 'lucide-react'
import CountryFlag from './CountryFlag'
import HeaderSorteio from './HeaderSorteio'
import './ResultScreen.css'

/**
 * Componente para visualização animada e sequencial do sorteio
 * Exibe 48 passos: Pote 1 (Grupos A-L), Pote 2 (A-L), Pote 3 (A-L), Pote 4 (A-L)
 */
function ResultScreen({ grupos, paisSede, onVoltar }) {
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

  // --- CONSTRUIR FILA PLANA DE 48 PASSOS (CORREÇÃO: usar índices diretos) ---
  const filaCompleta = useMemo(() => {
    const fila = []
    const nomesGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    
    // Pote 1 (índices 0-11): Grupos A-L
    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time1Pote = temposGrupo[0] // índice 0 = Pote 1
      if (time1Pote) {
        fila.push({
          passo: idx,
          pote: 1,
          grupo: nomeGrupo,
          time: time1Pote,
          descricao: `Pote 1 - Grupo ${nomeGrupo}`
        })
      } else {
        console.warn(`⚠️ Grupo ${nomeGrupo} sem time do Pote 1`)
      }
    })

    // Pote 2 (índices 12-23): Grupos A-L
    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time2Pote = temposGrupo[1] // índice 1 = Pote 2
      if (time2Pote) {
        fila.push({
          passo: 12 + idx,
          pote: 2,
          grupo: nomeGrupo,
          time: time2Pote,
          descricao: `Pote 2 - Grupo ${nomeGrupo}`
        })
      } else {
        console.warn(`⚠️ Grupo ${nomeGrupo} sem time do Pote 2`)
      }
    })

    // Pote 3 (índices 24-35): Grupos A-L
    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time3Pote = temposGrupo[2] // índice 2 = Pote 3
      if (time3Pote) {
        fila.push({
          passo: 24 + idx,
          pote: 3,
          grupo: nomeGrupo,
          time: time3Pote,
          descricao: `Pote 3 - Grupo ${nomeGrupo}`
        })
      } else {
        console.warn(`⚠️ Grupo ${nomeGrupo} sem time do Pote 3`)
      }
    })

    // Pote 4 (índices 36-47): Grupos A-L
    nomesGrupos.forEach((nomeGrupo, idx) => {
      const temposGrupo = grupos[nomeGrupo]?.times || []
      const time4Pote = temposGrupo[3] // índice 3 = Pote 4
      if (time4Pote) {
        fila.push({
          passo: 36 + idx,
          pote: 4,
          grupo: nomeGrupo,
          time: time4Pote,
          descricao: `Pote 4 - Grupo ${nomeGrupo}`
        })
      } else {
        console.warn(`⚠️ Grupo ${nomeGrupo} sem time do Pote 4`)
      }
    })

    // --- LOG DE AUDITORIA ---
    console.log(`✅ Fila construída com ${fila.length} passos (esperado: 48)`)
    if (fila.length !== 48) {
      console.error(`❌ ERRO: Apenas ${fila.length}/48 times encontrados!`)
    }

    return fila
  }, [grupos])

  // --- FUNÇÃO: IDENTIFICAR BLOCO DE GRUPO (4x4) ---
  const getBloco = (nomeGrupo) => {
    const blocos = {
      1: ['A', 'B', 'C', 'D'],      // Bloco 1: 4 grupos
      2: ['E', 'F', 'G', 'H'],      // Bloco 2: 4 grupos
      3: ['I', 'J', 'K', 'L']       // Bloco 3: 4 grupos
    }
    for (const [num, grupos_list] of Object.entries(blocos)) {
      if (grupos_list.includes(nomeGrupo)) return parseInt(num)
    }
    return 1 // fallback
  }

  // --- FUNÇÃO: DEFINIR BLOCO VISÍVEL BASEADO NO PASSO ATUAL ---
  const getBlocoAtual = () => {
    // Se passoAtual === 0 ou não há fila, retorna Bloco 1
    if (passoAtual === 0 || filaCompleta.length === 0) return 1;
    
    // Acessa o passo ATUAL (não anterior) para detectar o bloco correto
    const passoIndex = Math.min(passoAtual, filaCompleta.length - 1);
    const grupoAtual = filaCompleta[passoIndex]?.grupo;
    
    if (!grupoAtual) return 1;
    return getBloco(grupoAtual);
  }

  // --- LÓGICA DE LAYOUT DINÂMICO ---
  // Se sorteio terminou (passoAtual === 48), mostra todos os 12 grupos
  // Senão, mostra apenas o bloco atual
  const mostrarTodasGrupos = passoAtual === filaCompleta.length;
  const blocoVisivel = getBlocoAtual()
  const gruposFiltrados = mostrarTodasGrupos 
    ? Object.entries(grupos)
    : Object.entries(grupos).filter(([nomeGrupo]) => getBloco(nomeGrupo) === blocoVisivel)

  // --- CONSTRUIR MAPA DE VISIBILIDADE: TIME -> ÍNDICE NA FILA ---
  const mapaVisibilidade = useMemo(() => {
    const mapa = {};
    filaCompleta.forEach(passo => {
      const chave = `${passo.grupo}-${passo.time.id}`;
      mapa[chave] = passo.passo; // índice na fila
    });
    return mapa;
  }, [filaCompleta]);

  // --- FUNÇÃO: VERIFICAR SE TIME DEVE SER EXIBIDO --- (DEPRECATED - usar mapaVisibilidade)
  // Mantido para compatibilidade futura se necessário

  // --- ATUALIZAR HISTÓRICO QUANDO PASSO AVANÇA ---
  useEffect(() => {
    if (passoAtual > 0 && filaCompleta[passoAtual - 1]) {
      const passoAnterior = filaCompleta[passoAtual - 1]
      setHistoricoPassos(prev => [
        ...prev,
        passoAnterior
      ])
    }
  }, [passoAtual, filaCompleta])

  // --- CONTROLES DE FLUXO ---
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

  // --- DADOS DO PASSO ATUAL ---
  const passoInfo = passoAtual < filaCompleta.length 
    ? filaCompleta[passoAtual] 
    : null

  const tempoAtual = passoInfo?.time
  const porcentagemProgresso = (passoAtual / filaCompleta.length) * 100

  return (
    <div className="result-screen-container">
      <HeaderSorteio paisSede={paisSede} />
      
      <div className="result-header">
        <h1>⚽ Sorteio em Andamento</h1>
        <p className="pais-sede">Países Sede: <strong>{paisSede}</strong></p>
      </div>

      {/* --- BARRA DE PROGRESSO --- */}
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

      {/* --- DISPLAY DO TIME ATUAL --- */}
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

      {/* --- BOTÕES DE CONTROLE --- */}
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

      {/* --- PREVIEW DE GRUPOS (COM ABAS DE BLOCOS) --- */}
      <div className="groups-preview-section">
        <h3>📊 Visualização dos Grupos</h3>
        
        {/* --- ABAS DE BLOCOS (Ocultas quando sorteio termina) --- */}
        {!mostrarTodasGrupos && (
          <div className="block-tabs">
            <button 
              className={`block-tab ${blocoVisivel === 1 ? 'active' : ''}`}
              title="Grupos A, B, C, D"
            >
              Bloco 1: A-D
            </button>
            <button 
              className={`block-tab ${blocoVisivel === 2 ? 'active' : ''}`}
              title="Grupos E, F, G, H"
            >
              Bloco 2: E-H
            </button>
            <button 
              className={`block-tab ${blocoVisivel === 3 ? 'active' : ''}`}
              title="Grupos I, J, K, L"
            >
              Bloco 3: I-L
            </button>
          </div>
        )}
        
        {/* --- INDICADOR DE FIM DE SORTEIO --- */}
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
                      className={`preview-team-item ${
                        isVisible ? 'visible' : 'placeholder'
                      } ${wasSorted ? 'sorteado' : ''}`}
                    >
                      {isVisible ? (
                        <>
                          <span className="preview-team-number">{index + 1}</span>
                          <CountryFlag
                            sigla={time.sigla}
                            nome={time.nome}
                            tamanho="pequeno"
                          />
                          <span className="preview-team-name">
                            {time.nome}
                            {/* --- TAG DE PLAY-OFF (PO) --- */}
                            {/* Mostra label específico dos 6 últimos times do Pote 4 */}
                            {time.pote === 4 && index >= 6 && (
                              <span className="playoff-tag-rs">{getPlayoffLabel(time.pote, index)}</span>
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="preview-team-number">{index + 1}</span>
                          <div className="placeholder-content">
                            <span className="placeholder-text">—</span>
                          </div>
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

      {/* --- BOTÃO VOLTAR --- */}
      <div className="actions-footer">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar para Personalizar
        </button>
      </div>
    </div>
  )
}

export default ResultScreen
