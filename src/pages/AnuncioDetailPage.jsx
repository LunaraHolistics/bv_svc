// ============================================================================
// src/pages/AnuncioDetailPage.jsx
// - Galeria principal com ImagemFluida (retrato/paisagem sem corte seco)
// - Miniaturas quadradas fixas (padrão de mercado) + troca suave
// - Dados do vendedor via perfis; contato WhatsApp; gestão dono/master
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import ImagemFluida from '../components/ImagemFluida'
import { ShoppingBag, ArrowLeft } from 'lucide-react'

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

const AnuncioDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [anuncio, setAnuncio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [idx, setIdx] = useState(0)

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

  const handleDelete = async () => {
    if (!window.confirm('Excluir este anúncio permanentemente?')) return
    const { error } = await supabase.from('anuncios_vendas').delete().eq('id', id)
    if (error) return alert('Erro ao excluir: ' + error.message)
    navigate('/anuncios')
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

  const isMaster = user?.id === MASTER_USER_ID
  const isOwner = user?.id === anuncio.usuario_id
  const canManage = isMaster || isOwner
  const whatsapp = formatarWhatsapp(anuncio.vendedor?.whatsapp)
  const whatsappLink = whatsapp
    ? `https://wa.me/55${whatsapp}?text=${encodeURIComponent(`Olá! Vi seu anúncio "${anuncio.titulo}" no Bella Vittà e tenho interesse.`)}`
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* ===== GALERIA ===== */}
        <div className="space-y-3">
          {imagens.length > 0 ? (
            <>
              {/* ✅ Janela principal fluida */}
              <ImagemFluida
                src={imagens[idx]}
                alt={anuncio.titulo}
                arredondado="rounded-2xl sm:rounded-3xl"
                className="shadow-lg"
              />

              {imagens.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {imagens.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        i === idx ? 'border-emerald-500' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl sm:rounded-3xl flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-emerald-300" />
            </div>
          )}
        </div>

        {/* ===== INFO ===== */}
        <div className="space-y-5">
          <div>
            {anuncio.destaque && (
              <span className="inline-block px-2.5 py-1 mb-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">⭐ Destaque</span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{anuncio.titulo}</h1>
            <p className="text-emerald-600 font-bold text-xl sm:text-2xl mt-2">{formatarPreco(anuncio.preco)}</p>
          </div>

          {anuncio.descricao && (
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">{anuncio.descricao}</p>
          )}

          <div className="text-xs text-gray-400 space-y-1">
            <p>📅 Publicado em {new Date(anuncio.created_at).toLocaleDateString('pt-BR')}</p>
            {anuncio.data_expiracao && (
              <p>⏳ Expira em {new Date(anuncio.data_expiracao).toLocaleDateString('pt-BR')}</p>
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
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{anuncio.vendedor?.nome_completo || 'Morador'}</p>
              <p className="text-[11px] text-gray-400">Vendedor verificado da comunidade</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            {whatsappLink ? (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-5 py-3 bg-green-500 text-white rounded-xl font-semibold no-underline hover:bg-green-600 transition text-sm sm:text-base">
                💬 Chamar no WhatsApp
              </a>
            ) : (
              <div className="flex-1 text-center px-5 py-3 bg-gray-100 text-gray-400 rounded-xl text-sm">Sem contato cadastrado</div>
            )}
            {canManage && (
              <>
                <button onClick={() => navigate(`/editar-anuncio/${anuncio.id}`)} className="px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-100 transition cursor-pointer text-sm">
                  ✏️ Editar
                </button>
                <button onClick={handleDelete} className="px-5 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition cursor-pointer text-sm">
                  🗑️ Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnuncioDetailPage