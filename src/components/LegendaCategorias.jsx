// ============================================================================
// src/components/LegendaCategorias.jsx
// Modal com a "legenda" dos nichos: nome + descrição + exemplos.
// ============================================================================
import React from 'react'

const LegendaCategorias = ({ aberto, onFechar, categorias }) => {
  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">📚 Legenda de nichos — onde cadastrar?</h2>
          <button onClick={onFechar} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer" aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          {categorias.map((c, i) => (
            <div key={c.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-sm font-bold text-gray-800">{i + 1}. {c.nome}</p>
              <p className="text-xs text-gray-600 mt-1">{c.descricao}</p>
              {c.exemplos && (
                <p className="text-[11px] text-gray-400 mt-1">Ex.: {c.exemplos}</p>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">
            Não encontrou seu nicho? Use <strong>Serviços Diversos</strong> apenas como último recurso
            ou solicite uma nova categoria ao administrador do condomínio.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LegendaCategorias