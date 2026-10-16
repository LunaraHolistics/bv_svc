// ============================================================================
// src/pages/AnunciosPage.jsx — VERSÃO FINAL COM CARDS NO MODELO MAPA
// ----------------------------------------------------------------------------
// - Hero com imagem decorativa /anuncios-hero.png
// - Cards com layout revista (imagem flutuante + texto ao redor)
// - Carrossel automático (4s) com dots apenas para visitantes
// - Botões harmonizados: WhatsApp + Site (visitantes) / 5 botões (dono)
// - Busca por título/descrição
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { ShoppingBag } from 'lucide-react'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

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

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
}

/* ---------------- CARD DE ANÚNCIO (Modelo Revista) ---------------- */

const CardAnuncio = ({ anuncio }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const whatsapp = formatarWhatsapp(anuncio.whatsapp)
  const [expanded, setExpanded] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)

  const imagens = useMemo(() => getImagens(anuncio.imagem_url), [anuncio.imagem_url])

  const isMaster = user?.id === MASTER_USER_ID
  const isOwner = user?.id === anuncio.usuario_id
  const canManage = isMaster || isOwner

  const whatsappLink = useMemo(() => {
    if (!whatsapp) return null
    return `https://wa.me/55${whatsapp}?text=${encodeURIComponent(`Olá! Vi seu anúncio "${anuncio.titulo}" no Bella Vittà e tenho interesse.`)}`
  }, [whatsapp, anuncio.titulo])

  // Carrossel automático
  useEffect(() => {
    if (imagens.length <= 1) return
    const timer = setInterval(() => setImgIndex((prev) => (prev + 1) % imagens.length), 4000)
    return () => clearInterval(timer)
  }, [imagens.length])

  const handleVerMais = (e) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const handleCardClick = () => {
    navigate(`/anuncio/${anuncio.id}`)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm(`Deseja realmente excluir o anúncio "${anuncio.titulo}"?`)) {
      const { error } = await supabase.from('anuncios_vendas').delete().eq('id', anuncio.id)
      if (error) alert('Erro ao excluir: ' + error.message)
      else window.location.reload()
    }
  }

  return (
    <div onClick={handleCardClick} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      
      {/* ===== CABEÇALHO: Avatar + Nome + Chips ===== */}
      <div className="p-3 sm:p-4 pb-2">
        <div className="flex items-start gap-2">
          <div className="relative shrink-0">
            {anuncio.vendedor?.avatar_url ? (
              <img src={anuncio.vendedor.avatar_url} alt={anuncio.vendedor.nome_completo} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border-2 border-white shadow-sm" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex' }} />
            ) : null}
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center border-2 border-white shadow-sm ${anuncio.vendedor?.avatar_url ? 'hidden' : 'flex'}`}>
              <span className="text-emerald-700 font-bold text-xs sm:text-sm">{anuncio.vendedor?.nome_completo?.charAt(0)?.toUpperCase() || '🏡'}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 truncate text-xs sm:text-sm">{anuncio.vendedor?.nome_completo || 'Vendedor'}</h3>
            {anuncio.titulo && <p className="text-[10px] sm:text-xs text-emerald-600 truncate">{anuncio.titulo}</p>}
            <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold mt-0.5">{formatarPreco(anuncio.preco)}</p>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {anuncio.destaque && <span className="inline-flex px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[8px] sm:text-[10px] font-medium">⭐ Destaque</span>}
          {imagens.length > 0 && <span className="inline-flex px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[8px] sm:text-[10px] font-medium"> {imagens.length}</span>}
          <span className="inline-flex px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[8px] sm:text-[10px] font-medium"> {new Date(anuncio.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* ===== CONTEÚDO: Imagem + Texto no MESMO bloco ===== */}
      <div className="px-3 sm:px-4 pb-3 flex-1 flex flex-col">
        
        {/* Bloco único com imagem flutuante + texto fluindo ao redor */}
        <div className="mb-2">
          {imagens.length > 0 && (
            <div className="float-left mr-3 mb-1 w-[35%] sm:w-[40%] relative">
              <div className="w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={imagens[imgIndex]} alt={anuncio.titulo} className="w-full h-full object-cover transition-opacity duration-500" />
              </div>
              {/* Dots do carrossel: SÓ aparecem quando NÃO é o dono */}
              {imagens.length > 1 && !canManage && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                  {imagens.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setImgIndex(i) }} className={`h-1 rounded-full transition-all ${i === imgIndex ? 'bg-white w-2' : 'bg-white/60 w-1'}`} aria-label={`Ver imagem ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Texto flui ao redor da imagem flutuante */}
          {anuncio.descricao && (
            <p className={`text-[10px] sm:text-xs text-gray-600 leading-snug ${expanded ? '' : 'line-clamp-5'}`}>
              {anuncio.descricao}
            </p>
          )}

          {/* Limpa o float */}
          <div className="clear-both"></div>

          {/* Link "leia mais" / "ver menos" */}
          {anuncio.descricao?.length > 100 && (
            <button onClick={handleVerMais} className="text-blue-600 hover:text-blue-700 font-medium text-[10px] sm:text-xs mt-1">
              {expanded ? 'ver menos' : 'leia mais'}
            </button>
          )}
        </div>

        {/* ===== BOTÕES DE AÇÃO ===== */}
        <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-2">
          {canManage ? (
            /* DONO/MASTER: 4 botões na mesma linha */
            <div className="flex gap-1.5 items-center">
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-2 py-1.5 bg-green-500 text-white rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-green-600 transition flex-1">
                  💬
                </a>
              )}
              {anuncio.site_url && (
                <a href={anuncio.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-2 py-1.5 bg-gray-100 text-gray-700 rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-gray-200 transition">
                  🌐
                </a>
              )}
              <button onClick={(e) => { e.stopPropagation(); navigate(`/editar-anuncio/${anuncio.id}`) }} className="flex items-center justify-center px-2 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] sm:text-xs font-medium hover:bg-emerald-100 transition cursor-pointer flex-1">
                ✏️
              </button>
              <button onClick={handleDelete} className="flex items-center justify-center px-2 py-1.5 bg-red-50 text-red-600 rounded-md text-[10px] sm:text-xs font-medium hover:bg-red-100 transition cursor-pointer">
                🗑️
              </button>
            </div>
          ) : (
            /* VISITANTE: Só 2 botões (WhatsApp + Site) com ícones */
            <div className="flex gap-1.5">
              {whatsappLink ? (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-green-600 transition flex-1">
                  💬 WhatsApp
                </a>
              ) : (
                <div className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-md text-[10px] text-center flex-1">Sem contato</div>
              )}
              {anuncio.site_url && (
                <a href={anuncio.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-gray-200 transition">
                  🌐 Site
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- PAGE PRINCIPAL ---------------- */

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
        .select('*, vendedor:perfis(id, nome_completo, avatar_url, whatsapp)')
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
      {/* ===== HERO ===== */}
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
              <Link to="/mapa" className="px-6 py-3 bg-white/15 border border-white/25 rounded-2xl !text-white no-underline hover:bg-white/25 transition text-sm sm:text-base">
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

      {/* ===== BUSCA ===== */}
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

      {/* ===== GRID DE ANÚNCIOS ===== */}
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
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Anúncios disponíveis</h2>
            <span className="text-xs sm:text-sm text-gray-500">{anunciosFiltrados.length} anúncio(s)</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {anunciosFiltrados.map((a) => (
              <CardAnuncio key={a.id} anuncio={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnunciosPage