import React, { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { ChevronRight, SkipForward, RotateCcw, Play, Pause, Camera } from 'lucide-react'
import Confetti from 'react-confetti'
import CountryFlag from './CountryFlag'
import html2canvas from 'html2canvas'
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
  const exportRef = useRef(null)

  const exportarComoImagem = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/exportar`, 
        { grupos }, 
        { responseType: 'blob' } // Importante para receber arquivos
      );

      // Criar um link para download do arquivo recebido
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

  const filaCompleta = useMemo(() => {
    const fila = []
    if (!grupos) return fila;
    const nomesGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    [1, 2, 3, 4].forEach(pote => {
      nomesGrupos.forEach((nome) => {
        const time = grupos[nome]?.times[pote - 1];
        if (time) fila.push({ pote, grupo: nome, time });
      });
    });
    return fila;
  }, [grupos])

  const mapaVisibilidade = useMemo(() => {
    const mapa = {};
    filaCompleta.forEach((passo, index) => {
      if (passo?.time?.id) mapa[`${passo.grupo}-${passo.time.id}`] = index;
    });
    return mapa;
  }, [filaCompleta])

  useEffect(() => {
    if (!isAutoPlay || passoAtual >= filaCompleta.length) return;
    const intervalo = setInterval(() => setPassoAtual(p => p + 1), 1500);
    return () => clearInterval(intervalo);
  }, [isAutoPlay, passoAtual, filaCompleta.length])

  useEffect(() => {
    const grupoFoco = filaCompleta[passoAtual]?.grupo;
    if (grupoFoco) {
      document.getElementById(`grupo-${grupoFoco}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [passoAtual, filaCompleta]);

  if (!grupos) return null;

  const passoInfo = filaCompleta[passoAtual] || null;
  const sorteioCompleto = passoAtual >= filaCompleta.length;

  return (
    <div className="result-screen-container">
      {sorteioCompleto && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} style={{ zIndex: 2000 }} />}
      
      {!sorteioCompleto && (
        <div className="palco-section">
          <div className="palco-content">
            <div className="palco-flag-container">
              {passoInfo && (
                <>
                  <CountryFlag sigla={passoInfo.time.sigla} tamanho="grande" />
                  <div className="palco-bandeira-info">
                    <h2 className="palco-team-name">{passoInfo.time.nome}</h2>
                    <p className="palco-destino">Pote {passoInfo.pote} → Grupo {passoInfo.grupo}</p>
                    <div className="palco-badges">
                      <span className="badge-estatistica">🏅 Rank: {passoInfo.time.rank}</span>
                      <span className="badge-estatistica">🌍 {passoInfo.time.confederacao}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="palco-controls">
              <button className="btn-palco btn-play-pause" onClick={() => setIsAutoPlay(!isAutoPlay)}>
                {isAutoPlay ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button className="btn-palco" onClick={() => setPassoAtual(prev => prev + 1)} disabled={isAutoPlay}><ChevronRight size={18} /></button>
              <button className="btn-palco" onClick={() => setPassoAtual(filaCompleta.length)}><SkipForward size={18} /></button>
              <button className="btn-palco" onClick={() => {setPassoAtual(0); setIsAutoPlay(false)}}><RotateCcw size={18} /></button>
            </div>
          </div>
          <div className="progress-bar-palco">
            <div className="progress-fill-palco" style={{ width: `${(passoAtual / filaCompleta.length) * 100}%` }}></div>
          </div>
        </div>
      )}

      <div className={`arquibancada-section ${sorteioCompleto ? 'sorteio-completo-view' : ''}`} ref={exportRef}>
        {sorteioCompleto && (
          <div className="resultado-final-header">
            <h1>🎉 Sorteio Finalizado!</h1>
            <p>Os 12 Grupos da Copa do Mundo 2026 Estão Confirmados</p>
          </div>
        )}

        <div className="grupos-grid">
          {Object.entries(grupos).map(([nome, data]) => (
            <div key={nome} id={`grupo-${nome}`} className={`grupo-card ${filaCompleta[passoAtual]?.grupo === nome ? 'group-focused' : 'group-dimmed'} ${sorteioCompleto ? 'completo' : ''}`}>
              <div className="grupo-titulo">Grupo {nome}</div>
              <div className="grupo-times">
                {data.times.map((time, idx) => {
                  const visivel = mapaVisibilidade[`${nome}-${time.id}`] < passoAtual || (nome === passoInfo?.grupo && time.id === passoInfo?.time.id);
                  return (
                    <div key={time.id} className={`time-slot ${visivel ? 'visible' : 'vazio'}`}>
                      {visivel ? (
                        <div className="time-content">
                          <span className="time-numero">{idx + 1}</span>
                          <CountryFlag sigla={time.sigla} tamanho="pequeno" />
                          <span className="time-nome">{time.nome}</span>
                        </div>
                      ) : (
                        <span className="time-aguardando">Aguardar Pote {idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RODAPÉ ===== */}
      <div className="actions-footer">
        {sorteioCompleto && (
          <button className="btn-exportar" onClick={exportarComoImagem}>
            📸 Salvar Resultado em Imagem
          </button>
        )}
        
        <div className="nav-buttons">
          <button className="btn-footer" onClick={onVoltar}>
            ← Voltar
          </button>
          <button className="btn-footer" onClick={onVoltarInicio}>
            🏠 Início
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResultScreen(props) {
  return <ErrorBoundary><ResultScreenBase {...props} /></ErrorBoundary>
}