import { useState, useEffect } from 'react'
import axios from 'axios'
import TeamList from './TeamList'
import PotCustomizer from './PotCustomizer'
import GroupsDisplay from './GroupsDisplay'
import ResultScreen from './ResultScreen'
import heroImage from '../img/tournaments_fifa-world-cup-2026.football-logos.cc.svg'
import './App.css'

function App() {
  const [grupos, setGrupos] = useState(null)
  const [loadingSorteio, setLoadingSorteio] = useState(false)
  const [etapa, setEtapa] = useState('lista') 
  const [viewMode, setViewMode] = useState('sorteio-animado') 
  const [scrolled, setScrolled] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || '';
  const paisSede = "Canadá, México, EUA"

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10) 
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // --- NOVA FUNÇÃO: VOLTAR AO INÍCIO ---
  const handleVoltarInicio = () => {
    setEtapa('lista');
    setGrupos(null);
  };

  // --- CORREÇÃO: AGORA ACEITA OS POTES CUSTOMIZADOS ---
  const handleIniciarSorteio = async (potesCustomizados = null) => {
    try {
      setLoadingSorteio(true)
      setViewMode('sorteio-animado')
      const response = await axios.post(`${API_BASE}/api/sorteio`, {
        pais_sede: paisSede,
        potes_customizados: potesCustomizados
      })
      if (response.data.success) {
        setGrupos(response.data.grupos)
        setEtapa('resultado')
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoadingSorteio(false)
    }
  }

  const handleVoltar = () => {
    setEtapa('lista')
    setGrupos(null)
  }

  return (
    <div className={`app-container ${scrolled ? 'is-scrolled' : ''}`}>
      
      {/* HEADER ISOLADO: Logo e Título Clicáveis */}
      <header className={`hero-section ${scrolled ? 'sticky-header' : ''}`}>
        <div 
          className="header-content" 
          onClick={handleVoltarInicio} 
          style={{ cursor: 'pointer' }}
          title="Voltar para a Tela Inicial"
        >
          <img src={heroImage} alt="Logo Copa 2026" className="hero-image" />
          <div className="header-text">
            <h1 className="hero-title">Simulador da Copa do Mundo 2026</h1>
            <p className="hero-subtitle">O simulador definitivo para a primeira Copa com 48 seleções.</p>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        {etapa === 'lista' && (
          <div className="main-config-wrapper">
            <div className="sorteio-card main-config-card">
              <div className="card-header">
                <h2>🎲 Iniciar Sorteio</h2>
                <p>Configure como deseja gerar os grupos da Copa.</p>
              </div>

              <div className="button-group">
                {/* Aqui passamos null para forçar o sorteio padrão */}
                <button className="sorteio-btn" onClick={() => handleIniciarSorteio(null)} disabled={loadingSorteio}>
                  <span className="btn-title">{loadingSorteio ? '⏳ Sorteando...' : '🎱 Sorteio Padrão'}</span>
                  <span className="btn-desc">Usa as 48 seleções classificadas e ranking atual</span>
                </button>

                <button className="customizar-btn highlight-feature" onClick={() => setEtapa('customizacao')}>
                  <div className="badge-promo">LIBERDADE TOTAL</div>
                  <span className="btn-title">🎯 Customização Global</span>
                  <span className="btn-desc">Troque seleções, use as 211 nações da FIFA e edite os potes</span>
                </button>
              </div>

              <div className="rules-info">
                <h3>📋 Regras Automáticas:</h3>
                <ul>
                  <li>✓ Países sedes fixos (A1, B1, D1)</li>
                  <li>✓ Limite de 1 representante por confederação (exceto UEFA)</li>
                  <li>✓ UEFA: Máximo 2 por grupo</li>
                </ul>
              </div>
            </div>

            <TeamList />
          </div>
        )}

        {etapa === 'customizacao' && (
          <div className="customizacao-section">
            <PotCustomizer 
              onSorteio={(p) => handleIniciarSorteio(p)} 
              onVoltar={() => setEtapa('lista')} 
              paisSede={paisSede} 
            />
          </div>
        )}

        {etapa === 'resultado' && (
          <div className="resultado-section">
            {viewMode === 'sorteio-animado' ? (
              <ResultScreen 
                grupos={grupos} 
                paisSede={paisSede}
                onVoltar={() => {
                  setEtapa('customizacao'); 
                  setGrupos(null); 
                }} 
                onVoltarInicio={handleVoltarInicio} 
              />
            ) : (
              <>
                <GroupsDisplay grupos={grupos} paisSede={paisSede} />
                <div className="resultado-actions">
                  <button className="voltar-btn" onClick={() => setViewMode('sorteio-animado')}>← Ver Animação</button>
                  <button className="voltar-btn" onClick={handleVoltar}>← Nova Seleção</button>
                  <button className="novo-sorteio-btn" onClick={() => handleIniciarSorteio(null)}>🔄 Sortear Novamente</button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App