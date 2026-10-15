// ============================================================================
// src/components/ImagemFluida.jsx
// Janela de imagem que se AJUSTA à orientação do arquivo (retrato/paisagem/
// quadrada) com transição suave, em vez de cortar tudo para paisagem.
//
// Uso mínimo:  <ImagemFluida src={url} alt="..." />
// Props úteis:
//   contem={true}   → mostra a imagem INTEIRA (sem crop), com fundo neutro
//   className       → classes extras do container (ex.: bordas do card)
//   semCentralizar  → não centraliza/restringe largura no retrato/quadrada
// ============================================================================

import React, { useState } from 'react'

const ImagemFluida = ({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  arredondado = 'rounded-2xl',
  fundo = 'bg-gray-100',
  contem = false,
  semCentralizar = false,
  ...rest
}) => {
  const [orient, setOrient] = useState(null) // null | 'retrato' | 'quadrada' | 'paisagem'

  const aoCarregar = (e) => {
    const { naturalWidth, naturalHeight } = e.target
    if (!naturalWidth || !naturalHeight) return
    const r = naturalWidth / naturalHeight
    if (r < 0.85) setOrient('retrato')
    else if (r > 1.15) setOrient('paisagem')
    else setOrient('quadrada')
  }

  // Forma da janela conforme a orientação (com transição fluida)
  const forma =
    orient === 'retrato'
      ? `aspect-[3/4] ${semCentralizar ? 'w-full' : 'max-w-[300px] sm:max-w-[360px] mx-auto'}`
      : orient === 'quadrada'
      ? `aspect-square ${semCentralizar ? 'w-full' : 'max-w-[380px] sm:max-w-[460px] mx-auto'}`
      : orient === 'paisagem'
      ? 'aspect-[4/3] sm:aspect-[16/10] w-full'
      : 'aspect-[4/3] w-full' // padrão até carregar (evita "pulo" brusco)

  return (
    <div
      className={`relative overflow-hidden ${arredondado} ${fundo} ${forma} transition-all duration-500 ease-out ${className}`}
    >
      <img
        src={src}
        alt={alt}
        onLoad={aoCarregar}
        className={`w-full h-full ${contem ? 'object-contain' : 'object-cover'} transition-all duration-500 ${imgClassName}`}
        {...rest}
      />
    </div>
  )
}

export default ImagemFluida