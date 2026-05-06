import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const formatarPreco = (valor) => {
  if (!valor) return 'R$ 0,00'

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

const CardDestaque = ({ anuncio }) => (
  <Link
    to="/anuncios"
    className="shrink-0 w-[280px] bg-white rounded-3xl border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 no-underline group"
  >
    {anuncio.imagem_url ? (
      <div className="h-44 overflow-hidden">
        <img
          src={anuncio.imagem_url}
          alt={anuncio.titulo}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        />
      </div>
    ) : (
      <div className="h-44 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <span className="text-5xl">🏷️</span>
      </div>
    )}

    <div className="p-5">
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">
          {anuncio.titulo}
        </h3>

        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">
          DESTAQUE
        </span>
      </div>

      <p className="text-emerald-600 font-bold text-xl mt-3">
        {formatarPreco(anuncio.preco)}
      </p>

      {anuncio.descricao && (
        <p className="text-gray-500 text-xs mt-2 line-clamp-2">
          {anuncio.descricao}
        </p>
      )}
    </div>
  </Link>
)

const CardUltimo = ({ anuncio }) => (
  <Link
    to="/anuncios"
    className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 no-underline"
  >
    <div className="flex gap-4">
      {anuncio.imagem_url ? (
        <img
          src={anuncio.imagem_url}
          alt={anuncio.titulo}
          className="w-20 h-20 rounded-xl object-cover"
        />
      ) : (
        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
          📦
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">
          {anuncio.titulo}
        </h4>

        <p className="text-emerald-600 font-bold mt-1">
          {formatarPreco(anuncio.preco)}
        </p>

        <p className="text-xs text-gray-400 mt-2">
          {new Date(anuncio.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  </Link>
)

const QuickLink = ({ to, icon, label, descricao }) => (
  <Link
    to={to}
    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 no-underline group"
  >
    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
      {icon}
    </div>

    <h3 className="font-semibold text-gray-900">
      {label}
    </h3>

    <p className="text-gray-500 text-sm mt-1">
      {descricao}
    </p>
  </Link>
)

const Carrossel = ({ titulo, itens, children }) => {
  const scrollRef = useRef(null)

  const scroll = (direction) => {
    if (!scrollRef.current) return

    scrollRef.current.scrollBy({
      left: direction * 320,
      behavior: 'smooth'
    })
  }

  if (!itens?.length) return null

  return (
    <section>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          {titulo}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
          >
            ←
          </button>

          <button
            onClick={() => scroll(1)}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>
    </section>
  )
}

const HomePage = () => {
  const [destaques, setDestaques] = useState([])
  const [ultimos, setUltimos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarDados()
  }, [])

  const buscarDados = async () => {
    try {
      const agora = new Date().toISOString()

      const { data: dataDestaque } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .eq('destaque', true)
        .ilike('status', 'ativo')
        .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: dataUltimos } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .ilike('status', 'ativo')
        .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
        .order('created_at', { ascending: false })
        .limit(8)

      setDestaques(dataDestaque || [])
      setUltimos(dataUltimos || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-8 sm:p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/15 rounded-full text-sm mb-4">
              Marketplace interno do condomínio
            </span>

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Bem-vindo ao BV Service
            </h1>

            <p className="text-emerald-100 mt-4 text-lg">
              Encontre serviços, produtos, recomendações e oportunidades
              dentro do Bella Vittà com muito mais praticidade.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/novo-anuncio"
                className="px-6 py-3 bg-white text-emerald-700 rounded-2xl font-semibold no-underline hover:scale-105 transition"
              >
                Anunciar grátis
              </Link>

              <Link
                to="/servicos"
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl no-underline hover:bg-white/20 transition"
              >
                Explorar serviços
              </Link>
            </div>
          </div>
        </section>

        {/* QUICK LINKS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <QuickLink
            to="/servicos"
            icon="🔧"
            label="Serviços"
            descricao="Prestadores do condomínio"
          />

          <QuickLink
            to="/indicacoes"
            icon="👥"
            label="Indicações"
            descricao="Recomendações reais"
          />

          <QuickLink
            to="/anuncios"
            icon="🏷️"
            label="Anúncios"
            descricao="Produtos à venda"
          />

          <QuickLink
            to="/mapa"
            icon="📍"
            label="Mapa"
            descricao="Localizações"
          />
        </section>

        {!loading && destaques.length > 0 && (
          <Carrossel
            titulo="🔥 Ofertas em destaque"
            itens={destaques}
          >
            {destaques.map((item) => (
              <CardDestaque
                key={item.id}
                anuncio={item}
              />
            ))}
          </Carrossel>
        )}

        {/* ÚLTIMOS */}
        <section>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Últimos anúncios
            </h2>

            <Link
              to="/anuncios"
              className="text-emerald-600 font-semibold no-underline"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {ultimos.map((item) => (
              <CardUltimo
                key={item.id}
                anuncio={item}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

export default HomePage