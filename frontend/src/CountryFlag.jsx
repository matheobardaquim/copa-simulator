import { useState } from 'react'
import './CountryFlag.css'

/**
 * Componente reutilizável para exibir bandeira de um país
 * @param {string} sigla - Código ISO do país (ex: "BRA", "FRA")
 * @param {string} nome - Nome do país (ex: "Brasil", "França")
 * @param {boolean} mostrarNome - Se deve exibir o nome ao lado da bandeira (padrão: false)
 * @param {string} tamanho - Tamanho 'pequeno' | 'medio' | 'grande' (padrão: 'pequeno')
 */
function CountryFlag({ sigla, nome, mostrarNome = false, tamanho = 'pequeno' }) {
  const [flagLoaded, setFlagLoaded] = useState(false)
  const [flagError, setFlagError] = useState(false)

  const tamanhos = {
    pequeno: 24,
    medio: 40,
    grande: 64
  }

  const altura = tamanhos[tamanho] || tamanhos.pequeno

  const urlFifa = `https://api.fifa.com/api/v3/picture/flags-sq-2/${sigla}`
  const urlFallback = 'https://flagcdn.com/w40/un.png'
  const flagUrl = flagError ? urlFallback : urlFifa

  const handleImageLoad = () => {
    setFlagLoaded(true)
  }

  const handleImageError = () => {
    if (!flagError) {
      setFlagError(true)
    }
  }

  return (
    <div className={`country-flag country-flag-${tamanho}`}>
      <img
        src={flagUrl}
        alt={`Bandeira de ${nome}`}
        title={nome}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`flag-image ${flagLoaded ? 'loaded' : 'loading'}`}
      />
      {mostrarNome && (
        <span className="country-name">{nome}</span>
      )}
    </div>
  )
}

export default CountryFlag
