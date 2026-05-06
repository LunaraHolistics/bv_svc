// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const formatarPreco = (valor) => {
  if (!valor) return 'R$ 0,00'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CardDestaque = ({ anuncio }) => (
  <Link to="/anuncios" className="shrink-0 w-[260px] sm:w-[300px] bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow no-underline group">
    {anuncio.imagem_url ? (
      <div className="h-40 overflow-hidden">
        <img
          src={anuncio.imagem_url}
          alt={anuncio.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
    ) : (
      <div className="h-40 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <span className="text-4xl">🏷️</span>
      </div>
    )}
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{anuncio.titulo}</h3>
        <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
          DESTAQUE
        </span>
      </div>
      <p className="text-emerald-600 font-bold mt-1.5 text-lg">{formatarPreco(anuncio.preco)}</p>
      {anuncio.descricao && (
        <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{anuncio.descricao}</p>
      )}
    </div>
  </Link>
)

const CardUltimo = ({ anuncio }) => (
  <Link to="/anuncios" className="bg-white rounded-xl border border-gray-200 p-3 flex gap-3 hover:shadow-md transition-shadow no-underline group">
    {anuncio.imagem_url ? (
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
        <img src={anuncio.imagem_url} alt={anuncio.titulo} className="w-full h-full object-cover" loading="lazy" />
      </div>
    ) : (
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <span className="text-xl text-gray-300">📦</span>
      </div>
    )}
    <div className="min-w-0">
      <h4 className="font-medium text-gray-900 text-sm truncate">{anuncio.titulo}</h4>
      <p className="text-emerald-600 font-semibold text-sm">{formatarPreco(anuncio.preco)}</p>
      <p className="text-gray-400 text-[11px] mt-0.5">{new Date(anuncio.created_at).toLocaleDateString('pt-BR')}</p>
    </div>
  </Link>
)

const QuickLink = ({ to, icon, label, descricao }) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-emerald-200 transition-all no-underline group"
  >
    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg mb-3 group-hover:bg-emerald-100 transition-colors">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
    <p className="text-gray-400 text-xs mt-1">{descricao}</p>
  </Link>
)

const Carrossel = ({ titulo, itens, children }) => {
  const scrollRef = useRef(null)

  const scroll = (direcao) => {
    if (!scrollRef.current) return
    const largura = scrollRef.current.offsetWidth * 0.7
    scrollRef.current.scrollBy({ left: direcao * largura, behavior: 'smooth' })
  }

  if (!itens || itens.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">{titulo}</h2>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <button onClick={() => scroll(1)} className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {children}
      </div>
    </div>
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

      // Destaques: destaque=true + ativo + NÃO expirado
      const { data: dataDestaque } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .eq('destaque', true)
        .ilike('status', 'ativo')
        .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
        .order('created_at', { ascending: false })
        .limit(10)

      // Últimos: ativo + NÃO expirado
      const { data: dataUltimos } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .ilike('status', 'ativo')
        .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
        .order('created_at', { ascending: false })
        .limit(8)

      setDestaques(dataDestaque || [])
      setUltimos(dataUltimos || [])
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold">Bem-vindo ao BV Service</h1>
          <p className="text-emerald-100 mt-2 text-sm sm:text-base max-w-lg">
            Classificados e serviços do Condomínio Bella Vittà. Encontre profissionais, indicações e oportunidades perto de você.
          </p>
          <div className="flex gap-3 mt-5">
            <Link
              to="/novo-anuncio"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors no-underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Anunciar Grátis
            </Link>
            <Link
              to="/servicos"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors no-underline border border-white/20"
            >
              Ver Serviços
            </Link>
          </div>
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickLink to="/servicos" icon="🔧" label="Serviços" descricao="Prestadores do condomínio" />
        <QuickLink to="/indicacoes" icon="👥" label="Indicações" descricao="Recomendados por moradores" />
        <QuickLink to="/anuncios" icon="🏷️" label="Anúncios" descricao="Produtos à venda" />
        <QuickLink to="/mapa" icon="📍" label="Mapa" descricao="Localização no condomínio" />
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shrink-0 w-[300px] h-[280px] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Carrossel de destaques */}
          {destaques.length > 0 && (
            <Carrossel titulo="🔥 Ofertas em Destaque" itens={destaques}>
              {destaques.map(a => <CardDestaque key={a.id} anuncio={a} />)}
            </Carrossel>
          )}

          {/* Últimos anúncios */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Últimos Anúncios</h2>
              <Link to="/anuncios" className="text-xs text-emerald-600 font-medium hover:underline no-underline">
                Ver todos →
              </Link>
            </div>
            {ultimos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ultimos.map(a => <CardUltimo key={a.id} anuncio={a} />)}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <span className="text-4xl block mb-3">🏷️</span>
                <p className="text-gray-500 text-sm">Nenhum anúncio ativo no momento.</p>
                <Link to="/novo-anuncio" className="inline-block mt-3 text-sm text-emerald-600 font-medium hover:underline no-underline">
                  Seja o primeiro a anunciar!
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default HomePage