import React, { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { ChevronRight, SkipForward, RotateCcw, Play, Pause, Camera, Home, ArrowLeft } from 'lucide-react'
import Confetti from 'react-confetti'
import CountryFlag from './CountryFlag'
import './ResultScreen.css'

// 🛡️ ERROR BOUNDARY
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#450a0a', color: 'white', borderRadius: '12px' }}>
          <h2>🚨 Crash Interceptado!</h2>
          <p>Ocorreu um erro ao renderizar a tela. Tente novamente.</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ResultScreenBase({ grupos, onVoltar, onVoltarInicio }) {
  const [passoAtual, setPassoAtual] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [skippedGroupAlert, setSkippedGroupAlert] = useState(null)
  const exportRef = useRef(null)

  const exportarComoImagem = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/exportar`, 
        { grupos }, 
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Sorteio-Copa-2026.png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar imagem via backend:', error);
      alert('Ocorreu um erro ao gerar a imagem no servidor.');
    }
  }

  // ===== 1. A FILA DE ANIMAÇÃO =====
  const filaCompleta = useMemo(() => {
    if (!grupos || !grupos._metadata?.eventos) return [];
    return grupos._metadata.eventos;
  }, [grupos])

  // ===== 2. MAPA DE VISIBILIDADE =====
  const mapaVisibilidade = useMemo(() => {
    const mapa = {};
    filaCompleta.forEach((passo, index) => {
      if (passo?.time?.id) mapa[`${passo.grupo}-${passo.time.id}`] = index;
    });
    return mapa;
  }, [filaCompleta])

  const passoInfo = filaCompleta[passoAtual] || null;
  const sorteioCompleto = passoAtual >= filaCompleta.length;

  // ===== 3. LISTA ESTÁTICA DE TIMES (BANNER) =====
  const timesDoPotemAtual = useMemo(() => {
    if (!passoInfo || !grupos || !grupos._metadata?.eventos) return [];
    
    const poteAtual = passoInfo.pote;
    const timesUnicos = new Map(); 
    
    grupos._metadata.eventos
      .filter(e => e.pote === poteAtual && !e.isPulo && e.time && !e.time.is_placeholder)
      .forEach(e => {
        if (!timesUnicos.has(e.time.id)) {
          timesUnicos.set(e.time.id, e.time);
        }
      });
    
    return Array.from(timesUnicos.values()).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [passoInfo, grupos])

  const timesSorteados = useMemo(() => {
    const sorteados = new Set();
    filaCompleta.slice(0, passoAtual).forEach(evento => {
      if (evento.pote === passoInfo?.pote && !evento.isPulo && evento.time?.id) {
        sorteados.add(evento.time.id);
      }
    });
    return sorteados;
  }, [passoAtual, filaCompleta, passoInfo])

  // ===== EFEITO: AUTO-PLAY =====
  useEffect(() => {
    if (!isAutoPlay || passoAtual >= filaCompleta.length) return;
    if (filaCompleta[passoAtual]?.isPulo) return; 

    const intervalo = setInterval(() => setPassoAtual(p => p + 1), 1500);
    return () => clearInterval(intervalo);
  }, [isAutoPlay, passoAtual, filaCompleta])

  // ===== EFEITO: PULO DE GRUPO =====
  useEffect(() => {
    // 1. Se o sorteio acabou, limpa qualquer alerta na marra
    if (sorteioCompleto) {
      setSkippedGroupAlert(null);
      return;
    }

    const passoAtualInfo = filaCompleta[passoAtual];
    
    if (passoAtualInfo) {
      if (passoAtualInfo.isPulo) {
         setSkippedGroupAlert(`⚠️ Grupo ${passoAtualInfo.grupo} pulado! A seleção de ${passoAtualInfo.time.nome} (${passoAtualInfo.time.confederacao}) não pode ir para cá.`);
         
         const timer = setTimeout(() => {
             setSkippedGroupAlert(null);
             setPassoAtual(p => p + 1);
         }, 2000);
         
         return () => clearTimeout(timer);
      } else {
         // 2. A MÁGICA AQUI: Se você clicou rápido e o passo atual NÃO é pulo, apaga a mensagem antiga!
         setSkippedGroupAlert(null);
      }
    }
  }, [passoAtual, filaCompleta, sorteioCompleto]);

  if (!grupos) return null;

  return (
    <div className="result-screen-container">
      {sorteioCompleto && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} style={{ zIndex: 2000 }} />}
      
      {skippedGroupAlert && (
        <div className="skipped-group-alert">
          {skippedGroupAlert}
        </div>
      )}

      {/* ===== O PALCO (HORIZONTAL DASHBOARD) ===== */}
      {!sorteioCompleto ? (
        <div className="palco-section">
          {/* ESQUERDA: Card do Time Atual */}
          <div className="palco-bloco-esquerdo">
            {passoInfo && !passoInfo.isPulo && passoInfo.time && !passoInfo.time.is_placeholder ? (
              <div className="palco-flag-container">
                <CountryFlag sigla={passoInfo.time.sigla || 'FIFA'} tamanho="grande" />
                <div className="palco-bandeira-info">
                  <h2 className="palco-team-name">{passoInfo.time.nome || 'Time'}</h2>
                  <p className="palco-destino">Pote {passoInfo.pote} → Grupo {passoInfo.grupo}</p>
                </div>
              </div>
            ) : (
              <div className="palco-empty-state">Aguardando Sorteio...</div>
            )}
          </div>

          {/* CENTRO: Banner de Times do Pote */}
          <div className="palco-bloco-centro">
            {passoInfo && (
              <div className="pote-teams-scroll">
                {timesDoPotemAtual.length > 0 ? (
                  timesDoPotemAtual.map(time => {
                    const isSorted = timesSorteados.has(time.id);
                    const isCurrent = passoInfo.time?.id === time.id;
                    return (
                      <div key={time.id} className={`pote-team-item ${isSorted ? 'sorted' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="pote-team-flag">
                          <CountryFlag sigla={time?.sigla || 'FIFA'} tamanho="minusculo" />
                        </div>
                        <span className="pote-team-sigla">{time?.sigla || '???'}</span>
                      </div>
                    );
                  })
                ) : null}
              </div>
            )}
          </div>

          {/* DIREITA: Controles do Player e Navegação Global */}
          <div className="palco-bloco-direito">
            <div className="palco-controls">
              <button className="btn-palco btn-play-pause" onClick={() => setIsAutoPlay(!isAutoPlay)} title="Auto Play">
                {isAutoPlay ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button className="btn-palco" onClick={() => setPassoAtual(prev => prev + 1)} disabled={isAutoPlay} title="Próximo Passo">
                <ChevronRight size={16} />
              </button>
              <button className="btn-palco" onClick={() => setPassoAtual(filaCompleta.length)} title="Pular para o Fim">
                <SkipForward size={16} />
              </button>
              <button className="btn-palco" onClick={() => {setPassoAtual(0); setIsAutoPlay(false)}} title="Reiniciar Sorteio">
                <RotateCcw size={16} />
              </button>
            </div>
            
            <div className="palco-nav-buttons">
              <button className="btn-nav-mini" onClick={onVoltar} title="Voltar para Potes">
                <ArrowLeft size={16} />
              </button>
              <button className="btn-nav-mini" onClick={onVoltarInicio} title="Ir para Início">
                <Home size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="resultado-final-header">
          <div className="resultado-textos">
            <h1>🎉 Sorteio Finalizado!</h1>
            <p>Os 12 Grupos da Copa do Mundo 2026 Estão Confirmados</p>
          </div>
          <div className="resultado-acoes">
             <button className="btn-exportar" onClick={exportarComoImagem}>
               <Camera size={18} /> Salvar Imagem
             </button>
             <button className="btn-nav-final" onClick={onVoltar}>← Voltar</button>
             <button className="btn-nav-final" onClick={onVoltarInicio}>🏠 Início</button>
          </div>
        </div>
      )}

      {/* ===== A ARQUIBANCADA (GRID 4x3 ONE PAGE) ===== */}
      <div className="arquibancada-section" ref={exportRef}>
        <div className="grupos-grid">
          {Object.entries(grupos)
            .filter(([nome]) => nome !== '_metadata')
            .map(([nome, data]) => (
            <div key={nome} id={`grupo-${nome}`} className={`grupo-card ${filaCompleta[passoAtual]?.grupo === nome ? 'group-focused' : 'group-dimmed'} ${sorteioCompleto ? 'completo' : ''}`}>
              <div className="grupo-titulo">Grupo {nome}</div>
              <div className="grupo-times">
                {data.times.map((time, slotIdx) => {
                  const isPlaceholder = time?.is_placeholder === true;
                  const timeId = time?.id;
                  const visivel = !isPlaceholder && (mapaVisibilidade[`${nome}-${timeId}`] < passoAtual || (nome === filaCompleta[passoAtual]?.grupo && timeId === filaCompleta[passoAtual]?.time?.id));
                  
                  return (
                    <div key={`${nome}-slot-${slotIdx}`} className={`time-slot ${visivel ? 'visible' : isPlaceholder ? 'placeholder' : 'vazio'}`}>
                      {isPlaceholder ? (
                        <div className="slot-placeholder">
                          <span className="placeholder-text">{time.nome}</span>
                        </div>
                      ) : visivel ? (
                        <div className="time-content">
                          <span className="time-numero">{time.slot?.charAt(1) || slotIdx + 1}</span>
                          <CountryFlag sigla={time.sigla} tamanho="pequeno" />
                          <span className="time-nome">{time.nome}</span>
                        </div>
                      ) : (
                        <div className="slot-placeholder empty">
                          <span className="placeholder-text">POTE {time?.pote}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ResultScreen(props) {
  return <ErrorBoundary><ResultScreenBase {...props} /></ErrorBoundary>
}