import { useState } from 'react'
import axios from 'axios'
import TeamList from './TeamList'
import PotCustomizer from './PotCustomizer'
import GroupsDisplay from './GroupsDisplay'
import ResultScreen from './ResultScreen'
import heroImage from '../img/hero-image.webp'
import './App.css'

function App() {
  const [grupos, setGrupos] = useState(null)
  const [loadingSorteio, setLoadingSorteio] = useState(false)
  const [etapa, setEtapa] = useState('lista') // 'lista', 'customizacao' ou 'resultado'
  const [viewMode, setViewMode] = useState('sorteio-animado') // 'sorteio-animado' ou 'grupos-completos'
  const [logs, setLogs] = useState(null)
  const [mostrarLogs, setMostrarLogs] = useState(false)
  const API_BASE = import.meta.env.VITE_API_URL || '';

  const paisSede = "Canadá, México, EUA" // Fixo

  const handleIniciarSorteio = async () => {
    try {
      setLoadingSorteio(true)
      setViewMode('sorteio-animado') // Começar com o sorteio animado
      const response = await axios.post(`${API_BASE}/api/sorteio`, {
        pais_sede: paisSede,
        potes_customizados: null
      })
      
      if (response.data.success) {
        setGrupos(response.data.grupos)
        carregarLogs()
        setEtapa('resultado')
      }
    } catch (error) {
      console.error('Erro ao fazer sorteio:', error)
      alert('Erro ao realizar o sorteio. Verifique se o backend está rodando.')
    } finally {
      setLoadingSorteio(false)
    }
  }

  const handleSorteioComCustomizacao = async (potes) => {
    try {
      setLoadingSorteio(true)
      setViewMode('sorteio-animado') // Começar com o sorteio animado
      const response = await axios.post(`${API_BASE}/api/sorteio`, {
        pais_sede: paisSede,
        potes_customizados: potes
      })
      
      if (response.data.success) {
        setGrupos(response.data.grupos)
        carregarLogs()
        setEtapa('resultado')
      }
    } catch (error) {
      console.error('Erro ao fazer sorteio:', error)
      alert('Erro ao realizar o sorteio. Verifique se o backend está rodando.')
    } finally {
      setLoadingSorteio(false)
    }
  }

  const carregarLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/logs`)
      if (response.data.success) {
        setLogs(response.data.logs)
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const handleVoltar = () => {
    setGrupos(null)
    setEtapa('lista')
  }

  const handleIrParaCustomizacao = () => {
    setEtapa('customizacao')
  }

  return (
    <div className="app-container">
      {/* Hero Section com Logo */}
      <section className="hero-section">
        <img src={heroImage} alt="Logo Copa 2026" className="hero-image" />
        <div className="hero-overlay">
          <h1 className="hero-title">FIFA WORLD CUP 2026</h1>
          <p className="hero-subtitle">Simulador Oficial de Sorteio</p>
        </div>
      </section>

      <header className="app-header">
        <h1>⚽ Sorteio Copa do Mundo 2026</h1>
        <p className="subtitle">Algoritmo da FIFA com restrições geográficas</p>
      </header>

      {etapa === 'lista' ? (
        <div className="main-content">
          <TeamList />
          
          <div className="sorteio-section">
            <div className="sorteio-card">
              <h2>🎲 Iniciar Sorteio</h2>

              <div className="button-group">
                <button 
                  className="sorteio-btn"
                  onClick={handleIniciarSorteio}
                  disabled={loadingSorteio}
                >
                  {loadingSorteio ? '⏳ Sorteando...' : '🎱 Iniciar Sorteio Padrão'}
                </button>

                <button 
                  className="customizar-btn"
                  onClick={handleIrParaCustomizacao}
                >
                  🎯 Personalizar Potes
                </button>
              </div>

              <div className="rules-info">
                <h3>📋 Regras do Sorteio:</h3>
                <ul>
                  <li>✓ 12 Grupos de 4 times</li>
                  <li>✓ Um time de cada pote por grupo</li>
                  <li>✓ Máximo 1 representante por confederação (exceto UEFA)</li>
                  <li>✓ UEFA pode ter até 2 representantes por grupo</li>
                  <li>✓ Países sedes: Canadá (Grupo A), México (Grupo B), EUA (Grupo D)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : etapa === 'customizacao' ? (
        <div className="customizacao-section">
          <PotCustomizer 
            onSorteio={handleSorteioComCustomizacao}
            paisSede={paisSede}
          />
          <button className="voltar-simples-btn" onClick={handleVoltar}>
            ← Voltar
          </button>
        </div>
      ) : (
        <div className="resultado-section">
          {viewMode === 'sorteio-animado' ? (
            <ResultScreen 
              grupos={grupos} 
              paisSede={paisSede}
              onVoltar={() => setViewMode('grupos-completos')}
            />
          ) : (
            <>
              <GroupsDisplay grupos={grupos} paisSede={paisSede} />
              
              <div className="resultado-actions">
                <button 
                  className="voltar-btn" 
                  onClick={() => setViewMode('sorteio-animado')}
                >
                  ← Ver Sorteio Animado
                </button>
                <button className="voltar-btn" onClick={handleVoltar}>
                  ← Voltar para Seleção de Times
                </button>
                <button 
                  className="novo-sorteio-btn"
                  onClick={handleIniciarSorteio}
                  disabled={loadingSorteio}
                >
                  {loadingSorteio ? '⏳ Sorteando...' : '🔄 Fazer Novo Sorteio'}
                </button>
              </div>
            </>
          )}
          
          {logs && viewMode === 'grupos-completos' && (
            <div className="logs-section">
              <button 
                className="toggle-logs-btn"
                onClick={() => setMostrarLogs(!mostrarLogs)}
              >
                {mostrarLogs ? '📋 Ocultar Logs' : '📋 Mostrar Logs'}
              </button>
              {mostrarLogs && (
                <div className="logs-container">
                  <pre>{logs}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
