import React from 'react'

const AlertaPerfil = ({ onFechar }) => {
  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 mb-6">
      <div className="text-2xl shrink-0 mt-0.5">⚠️</div>
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-800">
          Complete seu perfil para aparecer corretamente no portal!
        </p>
        <p className="text-xs text-amber-700 mt-1">
          Preencha seu endereço (Fase, Quadra, Lote) e defina se é Morador ou Prestador. Isso ajuda a te encontrarem no mapa.
        </p>
        {onFechar && (
          <button
            onClick={onFechar}
            className="mt-2 text-xs text-amber-700 font-bold underline cursor-pointer hover:text-amber-900"
          >
            Entendi, esconder este aviso
          </button>
        )}
      </div>
    </div>
  )
}

export default AlertaPerfil