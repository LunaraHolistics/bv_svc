// ============================================================================
// src/pages/AnunciosPage.jsx
// - Cards de anúncio com ImagemFluida: retrato/paisagem/quadrada sem corte seco
// - Hero com imagem decorativa /anuncios-hero.png (mesmo padrão das outras)
// - Busca por título/descrição + grid responsivo
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import ImagemFluida from '../components/ImagemFluida'
import { ShoppingBag } from 'lucide-react'

const formatarPreco = (valor) => {
  if (valor === null || valor === undefined || valor === '') return 'Sob consulta'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const getImagens = (imagemUrl) => {
  if (!imagemUrl) return []
  try {
    const parsed = JSON.parse(imagemUrl)
    if (Array.isArray(parsed)) return parsed
    return [imagemUrl]
  } catch {
    return [imagemUrl]
  }
}

const AnunciosPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [anuncios, setAnuncios] = useState([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { buscarAnuncios() }, [])

  const buscarAnuncios = async () => {
    setLoading(true); setError(null)
    try {
      const agora = new Date().toISOString()
      const { data, error } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .ilike('status', 'ativo')
        .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnuncios(data || [])
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os anúncios.')
    } finally { setLoading(false) }
  }

  const anunciosFiltrados = useMemo(() => {
    if (!busca.trim()) return anuncios
    const termo = busca.toLowerCase()
    return anuncios.filter(a =>
      [a.titulo, a.descricao].filter(Boolean).some(c => String(c).toLowerCase().includes(termo))
    )
  }, [anuncios, busca])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-[36px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white p-6 sm:p-8 md:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-6 sm:gap-8 md:gap-10">
          <div className="flex-1 min-w-0">
            <span className="inline-flex px-4 py-2 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium mb-5 !text-white">
              Marketplace Bella Vittà
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight !text-white max-w-3xl">
              Compre e venda entre vizinhos com muito mais confiança
            </h1>
            <p className="mt-5 text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
              Um marketplace privado para moradores anunciarem produtos, encontrarem oportunidades e negociarem com pessoas da própria comunidade.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-8">
              <Link to="/novo-anuncio" className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-semibold no-underline hover:scale-105 transition text-sm sm:text-base">
                Criar anúncio
              </Link>
              <Link to="/servicos" className="px-6 py-3 bg-white/15 border border-white/25 rounded-2xl !text-white no-underline hover:bg-white/25 transition text-sm sm:text-base">
                Explorar serviços
              </Link>
            </div>
          </div>

          <div className="hidden sm:block shrink-0 w-36 md:w-48 lg:w-60 aspect-square">
            <img
              src="/anuncios-hero.png"
              alt="Ícones em contorno representando compras e vendas entre vizinhos"
              className="w-full h-full object-cover rounded-2xl sm:rounded-3xl shadow-xl shadow-black/25 ring-1 ring-white/15"
            />
          </div>
        </div>
      </section>

      {/* BUSCA */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-5">
        <div className="relative">
          <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar produto ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base"
          />
        </div>
      </section>

      {/* GRID */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl sm:rounded-3xl p-8 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      ) : anunciosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-8 sm:p-12 text-center">
          <div className="text-4xl sm:text-5xl mb-4">🛒</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Nenhum anúncio encontrado</h3>
          <p className="text-gray-500 mt-2 text-sm">Seja o primeiro a anunciar para seus vizinhos.</p>
          {user && (
            <button onClick={() => navigate('/novo-anuncio')} className="mt-5 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition cursor-pointer">
              Criar anúncio agora
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {anunciosFiltrados.map((a) => {
            const imagens = getImagens(a.imagem_url)
            const imagem = imagens[0] || null
            return (
              <Link
                key={a.id}
                to={`/anuncio/${a.id}`}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all no-underline flex flex-col"
              >
                {/* ✅ Janela fluida: retrato fica retrato, paisagem fica paisagem */}
                {imagem ? (
                  <ImagemFluida
                    src={imagem}
                    alt={a.titulo}
                    semCentralizar
                    arredondado="rounded-t-2xl sm:rounded-t-3xl"
                    imgClassName="group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-[4/3] w-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-emerald-400" />
                  </div>
                )}

                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  {a.destaque && (
                    <span className="self-start px-2 py-0.5 mb-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">⭐ Destaque</span>
                  )}
                  <p className="text-emerald-600 font-bold text-sm sm:text-base">{formatarPreco(a.preco)}</p>
                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 text-sm sm:text-base">{a.titulo}</h3>
                  {a.descricao && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{a.descricao}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3">
                    Publicado em {new Date(a.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AnunciosPage