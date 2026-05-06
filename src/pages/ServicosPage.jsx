import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const formatarWhatsapp = (numero) => {
  if (!numero) return null

  const limpo = String(numero).replace(/\D/g, '')

  return limpo.length >= 10 ? limpo : null
}

/* ---------------- CARD ---------------- */

const CardPrestador = ({ prestador }) => {
  const whatsapp = formatarWhatsapp(prestador.whatsapp)

  const nomeInicial =
    prestador.nome?.charAt(0)?.toUpperCase() || '🏡'

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      <div className="p-6">
        <div className="flex items-start gap-4">
          {prestador.avatar_url ? (
            <img
              src={prestador.avatar_url}
              alt={prestador.nome || 'Prestador'}
              className="w-14 h-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-bold">
                {nomeInicial}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">
              {prestador.nome || 'Prestador'}
            </h3>

            {prestador.nome_fantasia && (
              <p className="text-sm text-emerald-600 truncate">
                {prestador.nome_fantasia}
              </p>
            )}
          </div>
        </div>

        {prestador.categoria && (
          <span className="inline-flex mt-4 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
            {prestador.categoria}
          </span>
        )}

        {prestador.descricao_comercial && (
          <p className="text-sm text-gray-500 mt-4 leading-relaxed line-clamp-3">
            {prestador.descricao_comercial}
          </p>
        )}

        {prestador.servicos_oferecidos?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {prestador.servicos_oferecidos.map((item, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {prestador.condicoes_moradores && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              Benefício para moradores: {prestador.condicoes_moradores}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-4 flex gap-2 flex-wrap">
        {whatsapp && (
          <a
            href={`https://wa.me/55${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium no-underline hover:bg-green-600 transition"
          >
            WhatsApp
          </a>
        )}

        {prestador.instagram_url && (
          <a
            href={
              prestador.instagram_url.startsWith('http')
                ? prestador.instagram_url
                : `https://instagram.com/${prestador.instagram_url.replace('@', '')}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium no-underline"
          >
            Instagram
          </a>
        )}

        {prestador.site_url && (
          <a
            href={prestador.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium no-underline hover:bg-gray-200 transition"
          >
            Site
          </a>
        )}
      </div>
    </div>
  )
}

/* ---------------- PAGE ---------------- */

const ServicosPage = () => {
  const [prestadores, setPrestadores] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    buscarDados()
  }, [])

  const buscarDados = async () => {
    setLoading(true)
    setError(null)

    try {
      const [resPrestadores, resCategorias] = await Promise.all([
        supabase
          .from('prestadores_servico')
          .select('*')
          .eq('opt_in', true)
          .order('nome'),

        supabase
          .from('categorias')
          .select('*')
          .eq('tipo', 'condominio')
          .order('ordem')
      ])

      if (resPrestadores.error) throw resPrestadores.error
      if (resCategorias.error) throw resCategorias.error

      setPrestadores(resPrestadores.data || [])
      setCategorias(resCategorias.data || [])
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os serviços.')
    } finally {
      setLoading(false)
    }
  }

  const categoriasFiltro = useMemo(() => {
    const doBanco = categorias.map((c) => c.nome)

    const doDados = [
      ...new Set(
        prestadores
          .map((p) => p.categoria)
          .filter(Boolean)
      )
    ]

    return ['Todas', ...new Set([...doBanco, ...doDados])]
  }, [categorias, prestadores])

  const filtrados = useMemo(() => {
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
          p.nome_fantasia,
          p.categoria,
          p.descricao_comercial
        ]
          .filter(Boolean)
          .some((item) =>
            item.toLowerCase().includes(termo)
          )
      )
    }

    return resultado
  }, [prestadores, filtroCategoria, busca])

  return (
    <div className="space-y-8">
      
      {/* HERO */}
      <section className="rounded-[32px] bg-gradient-to-br from-emerald-700 to-teal-700 text-white p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold">
            Serviços confiáveis da comunidade
          </h1>

          <p className="mt-3 text-emerald-100 max-w-2xl">
            Encontre profissionais que moram, atuam ou são recomendados
            dentro do Bella Vittà.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
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
                {categoriasFiltro.length - 1}
              </p>
              <p className="text-sm text-emerald-100">
                Categorias
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold">
                {filtrados.length}
              </p>
              <p className="text-sm text-emerald-100">
                Resultados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BUSCA */}
      <section className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4">
        <input
          type="text"
          placeholder="Buscar por nome, categoria ou serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
        />

        <div className="flex gap-3 overflow-x-auto pb-2">
          {categoriasFiltro.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filtroCategoria === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}

          {(filtroCategoria !== 'Todas' || busca) && (
            <button
              onClick={() => {
                setFiltroCategoria('Todas')
                setBusca('')
              }}
              className="px-4 py-2 rounded-full text-sm bg-red-50 text-red-600"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* GRID */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-72 bg-white rounded-3xl border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Nenhum serviço encontrado
          </h3>

          <p className="text-gray-500 mt-2">
            Tente ajustar sua busca ou filtros.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((prestador) => (
            <CardPrestador
              key={prestador.id}
              prestador={prestador}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ServicosPage