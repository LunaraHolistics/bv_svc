import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import MapaInterativo from '../components/MapaInterativo'

const GOOGLE_MAPS_EMBED_URL =
  'https://www.google.com/maps/d/u/1/embed?mid=1XFELlB7i9JmH3FVd6wR3O8HQ1nAdTSo&ehbc=2E312F'

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
}

const CardPrestador = ({ prestador }) => {
  const whatsapp = formatarWhatsapp(prestador.whatsapp)

  return (
    <div className="group bg-white border border-gray-200 rounded-3xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {prestador.avatar_url ? (
            <img
              src={prestador.avatar_url}
              alt={prestador.nome}
              className="w-14 h-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-lg">
              🏠
            </div>
          )}

          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {prestador.nome}
            </h3>

            {prestador.categoria && (
              <span className="inline-block mt-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                {prestador.categoria}
              </span>
            )}
          </div>
        </div>

        {prestador.casa_numero && (
          <div className="px-3 py-1 bg-gray-100 rounded-xl text-xs font-medium text-gray-600">
            Casa {prestador.casa_numero}
          </div>
        )}
      </div>

      {prestador.descricao && (
        <p className="text-sm text-gray-500 mt-4 line-clamp-2 leading-relaxed">
          {prestador.descricao}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {prestador.mapa_coords_x && prestador.mapa_coords_y && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
            📍 Localizado no mapa
          </span>
        )}

        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
          Resposta rápida
        </span>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
        {whatsapp ? (
          <a
            href={`https://wa.me/55${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
        ) : (
          <div className="text-sm text-gray-400">
            Sem contato disponível
          </div>
        )}
      </div>
    </div>
  )
}

const MapaPage = () => {
  const [prestadores, setPrestadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [abaAtiva, setAbaAtiva] = useState('interativo')
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    buscarPrestadores()
  }, [])

  const buscarPrestadores = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('prestadores_servico')
        .select('*')
        .eq('opt_in', true)
        .order('nome')

      if (error) throw error

      setPrestadores(data || [])
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os prestadores.')
    } finally {
      setLoading(false)
    }
  }

  const categorias = useMemo(() => {
    const lista = [
      ...new Set(
        prestadores
          .map((p) => p.categoria)
          .filter(Boolean)
      )
    ].sort()

    return ['Todas', ...lista]
  }, [prestadores])

  const prestadoresFiltrados = useMemo(() => {
    let resultado = prestadores

    if (filtroCategoria !== 'Todas') {
      resultado = resultado.filter(
        (p) => p.categoria === filtroCategoria
      )
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase()

      resultado = resultado.filter((p) =>
        [
          p.nome,
          p.categoria,
          String(p.casa_numero || '')
        ]
          .filter(Boolean)
          .some((item) =>
            item.toLowerCase().includes(termo)
          )
      )
    }

    return resultado
  }, [prestadores, filtroCategoria, busca])

  const totalCasas = useMemo(() => {
    return new Set(
      prestadores
        .map((p) => p.casa_numero)
        .filter(Boolean)
    ).size
  }, [prestadores])

  return (
    <div className="space-y-8">

      {/* HERO */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-4">
            📍 Navegação local
          </span>

          <h1 className="text-3xl font-bold mb-2">
            Encontre serviços perto de você
          </h1>

          <p className="text-emerald-100 max-w-2xl">
            Descubra moradores e prestadores disponíveis dentro do Bella Vittà.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold">
                {prestadores.length}
              </p>
              <p className="text-sm text-emerald-100">
                Prestadores
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold">
                {categorias.length - 1}
              </p>
              <p className="text-sm text-emerald-100">
                Categorias
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold">
                {totalCasas}
              </p>
              <p className="text-sm text-emerald-100">
                Casas ativas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-5">
        <input
          type="text"
          placeholder="Buscar por nome, categoria ou casa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
        />

        <div className="flex flex-wrap gap-2">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${filtroCategoria === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setAbaAtiva('interativo')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${abaAtiva === 'interativo'
                ? 'bg-white shadow-sm'
                : ''
              }`}
          >
            🏠 Prestadores
          </button>

          <button
            onClick={() => setAbaAtiva('satelite')}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${abaAtiva === 'satelite'
                ? 'bg-white shadow-sm'
                : ''
              }`}
          >
            🛰 Satélite
          </button>
        </div>
      </div>

      {/* MAPA */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="h-[65vh] flex items-center justify-center">
            <p className="text-gray-500">Carregando mapa...</p>
          </div>
        ) : error ? (
          <div className="h-[65vh] flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : abaAtiva === 'interativo' ? (
          <MapaInterativo prestadores={prestadoresFiltrados} />
        ) : (
          <iframe
            src={GOOGLE_MAPS_EMBED_URL}
            width="100%"
            height="650"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="Mapa Satélite"
          />
        )}
      </div>

      {/* LISTA */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Prestadores disponíveis
          </h2>

          <span className="text-sm text-gray-500">
            {prestadoresFiltrados.length} resultados
          </span>
        </div>

        {prestadoresFiltrados.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum prestador encontrado
            </h3>

            <p className="text-gray-500">
              Tente remover filtros ou pesquisar outro termo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {prestadoresFiltrados.map((prestador) => (
              <CardPrestador
                key={prestador.id}
                prestador={prestador}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MapaPage