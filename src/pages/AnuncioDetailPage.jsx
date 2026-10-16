// ============================================================================
// src/pages/AnuncioDetailPage.jsx — VERSÃO EVOLUÍDA
// ----------------------------------------------------------------------------
// - ImagemFluida com altura máxima (não ocupa tela toda)
// - Verificação de expiração (badge "Expirado" se necessário)
// - Botão Compartilhar (WhatsApp, copiar link, etc.)
// - Navegação por setas na galeria
// - Descrição com "leia mais" se for longa
// - Data relativa (expira em X dias / expirado há X dias)
// - Tratamento de erro se vendedor não tiver perfil
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import ImagemFluida from '../components/ImagemFluida'
import { ShoppingBag, ArrowLeft, Share2, ChevronLeft, ChevronRight } from 'lucide-react'

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

const getDataRelativa = (dataStr) => {
  if (!dataStr) return null
  const data = new Date(dataStr)
  const agora = new Date()
  const diffMs = data - agora
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDias < 0) {
    return { texto: `Expirado há ${Math.abs(diffDias)} dia${Math.abs(diffDias) !== 1 ? 's' : ''}`, status: 'expirado' }
  } else if (diffDias === 0) {
    return { texto: 'Expira hoje', status: 'hoje' }
  } else if (diffDias === 1) {
    return { texto: 'Expira amanhã', status: 'urgente' }
  } else if (diffDias <= 7) {
    return { texto: `Expira em ${diffDias} dias`, status: 'urgente' }
  } else {
    return { texto: `Expira em ${diffDias} dias`, status: 'normal' }
  }
}

const AnuncioDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [anuncio, setAnuncio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [idx, setIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => { buscarAnuncio() }, [id])

  const buscarAnuncio = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('anuncios_vendas')
      .select('*, vendedor:perfis(id, nome_completo, avatar_url, whatsapp)')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) { setNaoEncontrado(true); setLoading(false); return }
    setAnuncio(data)
    setLoading(false)
  }

  const imagens = useMemo(() => getImagens(anuncio?.imagem_url), [anuncio])
  
  const isExpired = useMemo(() => {
    if (!anuncio?.data_expiracao) return false
    return new Date(anuncio.data_expiracao) < new Date()
  }, [anuncio?.data_expiracao])

  const dataRelativa = useMemo(() => getDataRelativa(anuncio?.data_expiracao), [anuncio?.data_expiracao])

  const isMaster = user?.id === MASTER_USER_ID
  const isOwner = user?.id === anuncio?.usuario_id
  const canManage = isMaster || isOwner
  
  const whatsapp = formatarWhatsapp(anuncio?.vendedor?.whatsapp)
  const whatsappLink = whatsapp
    ? `https://wa.me/55${whatsapp}?text=${encodeURIComponent(`Olá! Vi seu anúncio "${anuncio?.titulo}" no Bella Vittà e tenho interesse.`)}`
    : null

  const handleDelete = async () => {
    if (!window.confirm('Excluir este anúncio permanentemente?')) return
    const { error } = await supabase.from('anuncios_vendas').delete().eq('id', id)
    if (error) return alert('Erro ao excluir: ' + error.message)
    navigate('/anuncios')
  }

  const irParaImagem = (direcao) => {
    if (direcao === 'anterior') setIdx(prev => (prev === 0 ? imagens.length - 1 : prev - 1))
    else setIdx(prev => (prev === imagens.length - 1 ? 0 : prev + 1))
  }

  const handleCompartilhar = async (tipo) => {
    const url = window.location.href
    const texto = `Confira este anúncio no Bella Vittà: ${anuncio?.titulo}`
    
    if (tipo === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank')
    } else if (tipo === 'copiar') {
      await navigator.clipboard.writeText(url)
      alert('Link copiado para a área de transferência!')
    }
    setShowShareMenu(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-500 gap-3 text-sm">
      <div className="w-7 h-7 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      Carregando anúncio...
    </div>
  )

  if (naoEncontrado) return (
    <div className="max-w-3xl mx-auto py-20 text-center px-4">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-gray-900">Anúncio não encontrado ou removido</h2>
      <Link to="/anuncios" className="inline-block mt-6 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition no-underline text-sm">Ver outros anúncios</Link>
    </div>
  )

  const descricaoLonga = (anuncio?.descricao || '').length > 200

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0 space-y-6 pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* ===== GALERIA ===== */}
        <div className="space-y-3">
          {imagens.length > 0 ? (
            <div className="relative">
              {/* ✅ Janela principal fluida com altura máxima */}
              <ImagemFluida
                src={imagens[idx]}
                alt={anuncio.titulo}
                arredondado="rounded-2xl sm:rounded-3xl"
                className="shadow-lg max-h-[60vh]"
                contem={false}
              />

              {/* Setas de navegação (só aparecem se houver +1 imagem) */}
              {imagens.length > 1 && (
                <>
                  <button 
                    onClick={() => irParaImagem('anterior')}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => irParaImagem('proximo')}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition cursor-pointer backdrop-blur-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Contador de imagens */}
              {imagens.length > 1 && (
                <span className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-black/60 text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-lg font-medium backdrop-blur-sm">
                  {idx + 1} / {imagens.length}
                </span>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl sm:rounded-3xl flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-emerald-300" />
            </div>
          )}

          {/* Thumbnails */}
          {imagens.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imagens.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    i === idx ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== INFO ===== */}
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badges de status */}
              <div className="flex flex-wrap gap-2 mb-2">
                {anuncio.destaque && (
                  <span className="inline-flex px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">⭐ Destaque</span>
                )}
                {isExpired ? (
                  <span className="inline-flex px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-bold">⏳ Expirado</span>
                ) : (
                  <span className="inline-flex px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold">✅ Ativo</span>
                )}
                {dataRelativa && (
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    dataRelativa.status === 'expirado' ? 'bg-gray-100 text-gray-600' :
                    dataRelativa.status === 'urgente' ? 'bg-orange-50 text-orange-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {dataRelativa.texto}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{anuncio.titulo}</h1>
              <p className="text-emerald-600 font-bold text-xl sm:text-2xl mt-2">{formatarPreco(anuncio.preco)}</p>
            </div>

            {/* Botão Compartilhar */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
                title="Compartilhar"
              >
                <Share2 size={20} className="text-gray-600" />
              </button>
              
              {showShareMenu && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 min-w-[180px]">
                  <button
                    onClick={() => handleCompartilhar('whatsapp')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition flex items-center gap-2"
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    onClick={() => handleCompartilhar('copiar')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2"
                  >
                    📋 Copiar link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Descrição com "leia mais" */}
          {anuncio.descricao && (
            <div>
              <p className={`text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line ${expanded ? '' : 'line-clamp-4'}`}>
                {anuncio.descricao}
              </p>
              {descricaoLonga && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-xs mt-1"
                >
                  {expanded ? 'ver menos' : 'leia mais'}
                </button>
              )}
            </div>
          )}

          {/* Informações adicionais */}
          <div className="text-xs text-gray-400 space-y-1 pt-3 border-t border-gray-100">
            <p>📅 Publicado em {new Date(anuncio.created_at).toLocaleDateString('pt-BR')}</p>
            {anuncio.data_expiracao && (
              <p className={isExpired ? 'text-red-500 font-medium' : ''}>
                 Expira em {new Date(anuncio.data_expiracao).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          {/* Vendedor */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            {anuncio.vendedor?.avatar_url ? (
              <img src={anuncio.vendedor.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                {anuncio.vendedor?.nome_completo?.charAt(0)?.toUpperCase() || '🏡'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{anuncio.vendedor?.nome_completo || 'Morador'}</p>
              <p className="text-[11px] text-gray-400">Vendedor verificado da comunidade</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isExpired && whatsappLink ? (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-5 py-3 bg-green-500 text-white rounded-xl font-semibold no-underline hover:bg-green-600 transition text-sm sm:text-base">
                💬 Chamar no WhatsApp
              </a>
            ) : isExpired ? (
              <div className="flex-1 text-center px-5 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm">Anúncio expirado</div>
            ) : (
              <div className="flex-1 text-center px-5 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm">Sem contato cadastrado</div>
            )}
            
            {canManage && (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => navigate(`/editar-anuncio/${anuncio.id}`)} className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 transition cursor-pointer text-sm">
                  ✏️
                </button>
                <button onClick={handleDelete} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition cursor-pointer text-sm">
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside para fechar menu de compartilhar */}
      {showShareMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
      )}
    </div>
  )
}

export default AnuncioDetailPage