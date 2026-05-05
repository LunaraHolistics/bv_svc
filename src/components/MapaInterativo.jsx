// src/components/MapaInterativo.jsx
import React, { useState } from 'react'

const MAPA_URL = <iframe src="https://www.google.com/maps/d/u/1/embed?mid=1XFELlB7i9JmH3FVd6wR3O8HQ1nAdTSo&ehbc=2E312F" width="640" height="480"></iframe>
const MapaInterativo = ({ prestadores, mapaImageUrl }) => {
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  
  // Filtrar apenas prestadores com opt_in e coordenadas
  const pins = prestadores.filter(p => 
    p.opt_in && p.mapa_coords_x != null && p.mapa_coords_y != null
  )
  
  const categorias = ['Todas', ...new Set(prestadores.map(p => p.categoria).filter(Boolean))]
  
  const pinsFiltrados = filtroCategoria === 'Todas' 
    ? pins 
    : pins.filter(p => p.categoria === filtroCategoria)

  return (
    <div className="mapa-container relative w-full max-w-4xl mx-auto">
      {/* Filtro de categorias */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(cat)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors
              ${filtroCategoria === cat 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Imagem do mapa + pins */}
      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border">
        <img 
          src={mapaImageUrl} 
          alt="Mapa do Condomínio" 
          className="absolute inset-0 w-full h-full object-contain"
        />
        
        {/* Pins dinâmicos */}
        {pinsFiltrados.map(pin => (
          <button
            key={pin.id}
            className="absolute transform -translate-x-1/2 -translate-y-full group"
            style={{ 
              left: `${pin.mapa_coords_x}%`, 
              top: `${pin.mapa_coords_y}%` 
            }}
            title={pin.nome}
          >
            {/* Ícone do pin */}
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg 
                          hover:scale-110 transition-transform cursor-pointer" />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                          hidden group-hover:block w-48 p-2 bg-white rounded shadow-lg text-xs z-10">
              <p className="font-semibold">{pin.nome}</p>
              <p className="text-gray-600">{pin.categoria}</p>
              <p className="text-gray-500">{pin.casa_numero}</p>
              {pin.whatsapp && (
                <a 
                  href={`https://wa.me/${pin.whatsapp.replace(/\D/g,'')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline mt-1 inline-block"
                >
                  📱 Contatar
                </a>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        {pinsFiltrados.length} prestadores exibidos • Clique nos pins para ver detalhes
      </p>
    </div>
  )
}

export default MapaInterativo