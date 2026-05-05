// src/pages/MapaPage.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import MapaInterativo from '../components/MapaInterativo'

const GOOGLE_MAPS_EMBED_URL = 'https://www.google.com/maps/d/u/1/embed?mid=1XFELlB7i9JmH3FVd6wR3O8HQ1nAdTSo&ehbc=2E312F'

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
}

const CardPrestador = ({ prestador }) => {
  const whatsapp = formatarWhatsapp(prestador.whatsapp)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{prestador.nome}</h3>
          {prestador.categoria && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium">
              {prestador.categoria}
            </span>
          )}
        </div>
        {prestador.casa_numero && (
          <span className="shrink-0 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
            Casa {prestador.casa_numero}
          </span>
        )}
      </div>

      {prestador.descricao && (
        <p className="text-gray-500 text-xs mt-2 line-clamp-2">{prestador.descricao}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {whatsapp ? (
          <a
            href={`https://wa.me/55${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors no-underline"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        ) : (
          <span className="text-xs text-gray-400">Sem contato</span>
        )}

        {prestador.mapa_coords_x != null && prestador.mapa_coords_y != null && (
          <span className="text-[10px] text-gray-400">📍 No mapa</span>
        )}
      </div>
    </div>
  )
}

const MapaPage = () => {
  const [prestadores, setPrestadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [abaAtiva, setAbaAtiva] = useState('satelite')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')

  useEffect(() => {
    buscarPrestadores()
  }, [])

  const buscarPrestadores = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('prestadores_servico')
        .select('*')
        .eq('opt_in', true)
        .order('nome')

      if (err) throw err
      setPrestadores(data || [])
    } catch (err) {
      console.error('Erro ao buscar prestadores:', err)
      setError('Não foi possível carregar os prestadores.')
    } finally {
      setLoading(false)
    }
  }

  const categorias = useMemo(() => {
    const cats = [...new Set(prestadores.map(p => p.categoria).filter(Boolean))].sort()
    return ['Todas', ...cats]
  }, [prestadores])

  const prestadoresFiltrados = useMemo(() => {
    if (filtroCategoria === 'Todas') return prestadores
    return prestadores.filter(p => p.categoria === filtroCategoria)
  }, [prestadores, filtroCategoria])

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mapa do Condomínio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Encontre prestadores de serviço próximos à sua casa
        </p>
      </div>

      {/* Abas do mapa */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setAbaAtiva('interativo')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            abaAtiva === 'interativo'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Prestadores
        </button>
        <button
          onClick={() => setAbaAtiva('satelite')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            abaAtiva === 'satelite'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Satélite
        </button>
      </div>

      {/* Área do mapa — fullscreen */}
      {loading ? (
        <div className="h-[70vh] bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">{error}</p>
          <button onClick={buscarPrestadores} className="text-sm text-emerald-600 hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {abaAtiva === 'interativo' && (
            <MapaInterativo prestadores={prestadores} />
          )}
          {abaAtiva === 'satelite' && (
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm h-[70vh]">
              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa Satélite do Condomínio"
              />
            </div>
          )}
        </>
      )}

      {/* Separador */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Diretório de Prestadores</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Filtros + contagem */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                filtroCategoria === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {prestadoresFiltrados.length} prestador(es)
        </span>
      </div>

      {/* Lista de prestadores */}
      {!loading && prestadoresFiltrados.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">
            {filtroCategoria === 'Todas'
              ? 'Nenhum prestador cadastrado ainda.'
              : `Nenhum prestador em "${filtroCategoria}".`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prestadoresFiltrados.map(p => (
          <CardPrestador key={p.id} prestador={p} />
        ))}
      </div>
    </div>
  )
}

export default MapaPage