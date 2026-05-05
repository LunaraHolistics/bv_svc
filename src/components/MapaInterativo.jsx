// src/components/MapaInterativo.jsx
import React, { useState } from 'react'

const MapaInterativo = ({ prestadores, mapaImageUrl }) => {
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [pinAtivo, setPinAtivo] = useState(null)

  // Filtrar apenas prestadores com coordenadas válidas
  const pins = prestadores.filter(p =>
    p.mapa_coords_x != null && p.mapa_coords_y != null
  )

  // Extrair categorias únicas ordenadas
  const categorias = ['Todas', ...new Set(
    prestadores
      .map(p => p.categoria)
      .filter(Boolean)
      .sort()
  )]

  // Aplicar filtro
  const pinsFiltrados = filtroCategoria === 'Todas'
    ? pins
    : pins.filter(p => p.categoria === filtroCategoria)

  // Limpar WhatsApp para link
  const formatarWhatsapp = (numero) => {
    if (!numero) return null
    const limpo = String(numero).replace(/\D/g, '')
    return limpo.length >= 10 ? limpo : null
  }

  return (
    <div className="space-y-3">
      {/* Filtro de categorias */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setFiltroCategoria(cat)
              setPinAtivo(null)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              filtroCategoria === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Área do mapa */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200">
        {/* Imagem de fundo (se fornecida) */}
        {mapaImageUrl && (
          <img
            src={mapaImageUrl}
            alt="Mapa do Condomínio"
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}

        {/* Placeholder quando não há imagem */}
        {!mapaImageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-xs">Mapa estático do condomínio</p>
            <p className="text-[10px] mt-0.5 opacity-60">(adicione a imagem via prop mapaImageUrl)</p>
          </div>
        )}

        {/* Grid de referência sutil */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '10% 10%'
          }}
        />

        {/* Pins dinâmicos */}
        {pinsFiltrados.map(pin => {
          const whatsapp = formatarWhatsapp(pin.whatsapp)
          const ativo = pinAtivo === pin.id

          return (
            <div
              key={pin.id}
              className="absolute z-10"
              style={{
                left: `${pin.mapa_coords_x}%`,
                top: `${pin.mapa_coords_y}%`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              {/* Botão do pin */}
              <button
                onClick={() => setPinAtivo(ativo ? null : pin.id)}
                className={`relative w-7 h-7 rounded-full border-2 border-white shadow-lg transition-all cursor-pointer flex items-center justify-center text-[10px] font-bold ${
                  ativo
                    ? 'bg-emerald-600 scale-125 ring-2 ring-emerald-300'
                    : 'bg-red-500 hover:scale-110'
                }`}
                title={pin.nome}
              >
                {ativo ? '✓' : pin.nome?.charAt(0)?.toUpperCase() || '•'}
              </button>

              {/* Card expandido ao clicar */}
              {ativo && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-white rounded-xl shadow-xl text-xs z-20 border border-gray-100">
                  {/* Seta do tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />

                  <p className="font-semibold text-gray-900 truncate">{pin.nome}</p>
                  {pin.categoria && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium">
                      {pin.categoria}
                    </span>
                  )}
                  {pin.casa_numero && (
                    <p className="text-gray-500 mt-1">Casa {pin.casa_numero}</p>
                  )}
                  {whatsapp && (
                    <a
                      href={`https://wa.me/55${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-medium hover:bg-green-600 transition-colors no-underline"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Overlay: sem resultados no filtro */}
        {pins.length > 0 && pinsFiltrados.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
            <p className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
              Nenhum prestador em &quot;{filtroCategoria}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Rodapé informativo */}
      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>
          {pinsFiltrados.length} de {pins.length} prestador(es) no mapa
        </span>
        {pins.length === 0 && (
          <span className="text-amber-500">
            Nenhum prestador com coordenadas cadastradas
          </span>
        )}
      </div>
    </div>
  )
}

export default MapaInterativo