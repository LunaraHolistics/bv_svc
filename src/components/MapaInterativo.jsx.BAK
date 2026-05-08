import React, { useState, useEffect, useRef } from 'react'

const MapaInterativo = ({ prestadores = [], mapaImageUrl }) => {
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [pinAtivo, setPinAtivo] = useState(null)

  const mapaRef = useRef(null)

  // Fecha tooltip ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mapaRef.current &&
        !mapaRef.current.contains(event.target)
      ) {
        setPinAtivo(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  const coordenadaValida = (valor) => {
    const numero = Number(valor)
    return !isNaN(numero) && numero >= 0 && numero <= 100
  }

  // Apenas prestadores com coordenadas válidas
  const pins = prestadores.filter(
    (p) =>
      coordenadaValida(p.mapa_coords_x) &&
      coordenadaValida(p.mapa_coords_y)
  )

  // Categorias únicas
  const categorias = [
    'Todas',
    ...new Set(
      prestadores
        .map((p) => p.categoria)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    )
  ]

  const pinsFiltrados =
    filtroCategoria === 'Todas'
      ? pins
      : pins.filter(
          (p) => p.categoria === filtroCategoria
        )

  const formatarWhatsapp = (numero) => {
    if (!numero) return null

    const limpo = String(numero).replace(/\D/g, '')

    return limpo.length >= 10 ? limpo : null
  }

  const obterPosicaoTooltip = (x) => {
    if (x < 20) {
      return 'left-0 translate-x-0'
    }

    if (x > 80) {
      return 'right-0 translate-x-0'
    }

    return 'left-1/2 -translate-x-1/2'
  }

  return (
    <div className="space-y-4">
      {/* filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categorias.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setFiltroCategoria(cat)
              setPinAtivo(null)
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              filtroCategoria === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* mapa */}
      <div
        ref={mapaRef}
        className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-200"
      >
        {mapaImageUrl ? (
          <img
            src={mapaImageUrl}
            alt="Mapa do condomínio"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 px-6 text-center">
            <div className="text-5xl mb-2">🗺️</div>

            <p className="text-sm font-medium">
              Mapa do condomínio não configurado
            </p>

            <p className="text-xs mt-1 opacity-70">
              Adicione uma imagem para posicionar os prestadores
            </p>
          </div>
        )}

        {/* grid opcional */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '10% 10%'
          }}
        />

        {/* pins */}
        {pinsFiltrados.map((pin) => {
          const whatsapp = formatarWhatsapp(
            pin.whatsapp || pin.contato_whatsapp
          )

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
              <button
                type="button"
                aria-label={`Ver detalhes de ${
                  pin.nome || 'prestador'
                }`}
                onClick={() =>
                  setPinAtivo(
                    ativo ? null : pin.id
                  )
                }
                className={`relative w-8 h-8 rounded-full border-2 border-white shadow-lg transition-all flex items-center justify-center text-[10px] font-bold ${
                  ativo
                    ? 'bg-emerald-600 scale-110 ring-4 ring-emerald-200'
                    : 'bg-red-500 hover:scale-110'
                }`}
              >
                {ativo
                  ? '✓'
                  : pin.nome?.charAt(0)?.toUpperCase() ||
                    '•'}
              </button>

              {ativo && (
                <div
                  className={`absolute bottom-full mb-3 w-56 max-w-[80vw] p-3 bg-white rounded-2xl shadow-xl text-xs z-20 border border-gray-100 ${obterPosicaoTooltip(
                    pin.mapa_coords_x
                  )}`}
                >
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />

                  <p className="font-semibold text-gray-900 truncate">
                    {pin.nome || 'Prestador sem nome'}
                  </p>

                  {pin.categoria && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium">
                      {pin.categoria}
                    </span>
                  )}

                  {pin.casa_numero && (
                    <p className="text-gray-500 mt-2">
                      Casa {pin.casa_numero}
                    </p>
                  )}

                  {pin.descricao && (
                    <p className="text-gray-500 mt-2 line-clamp-3">
                      {pin.descricao}
                    </p>
                  )}

                  {whatsapp && (
                    <a
                      href={`https://wa.me/55${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 px-3 py-2 bg-green-500 text-white rounded-lg text-[11px] font-medium hover:bg-green-600 transition-colors no-underline"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* sem resultados */}
        {pins.length > 0 &&
          pinsFiltrados.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
              <p className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
                Nenhum prestador em "{filtroCategoria}"
              </p>
            </div>
          )}
      </div>

      {/* rodapé */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
        <span>
          {pinsFiltrados.length} de {pins.length}{' '}
          prestador(es) exibidos
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