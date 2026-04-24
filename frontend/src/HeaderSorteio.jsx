import './HeaderSorteio.css'

function HeaderSorteio({ paisSede }) {
  return (
    <div className="header-sorteio">
      <div className="header-background"></div>
      
      <div className="header-content">
        {/* Logo Copa 2026 - Centro */}
        <div className="logo-container">
          <div className="logo-copa">
            <div className="copa-text">2026</div>
            <div className="copa-trophy">🏆</div>
          </div>
          <h1 className="header-title">FIFA WORLD CUP 2026</h1>
          <p className="header-subtitle">Simulador Oficial de Sorteio</p>
          {paisSede && <p className="header-pais">Sede: <strong>{paisSede}</strong></p>}
        </div>

        {/* Apoio Técnico - Direita */}
        <div className="apoio-tecnico">
          <span className="apoio-label">Powered by</span>
          <span className="apoio-nome">Matheo</span>
        </div>
      </div>
    </div>
  )
}

export default HeaderSorteio
