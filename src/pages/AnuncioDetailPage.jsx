// src/pages/AnuncioDetailPage.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const formatarPreco = (valor) => {
  if (!valor) return 'R$ 0,00'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const getImagens = (imagemUrl) => {
  if (!imagemUrl) return []
  try {
    const parsed = JSON.parse(imagemUrl)
    if (Array.isArray(parsed)) return parsed
    return [imagemUrl]
  } catch { return [imagemUrl] }
}

const AnuncioDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [anuncio, setAnuncio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { buscarAnuncio() }, [id])

  const buscarAnuncio = async () => {
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.from('anuncios_vendas').select('*').eq('id', id).single()
      if (error) throw error
      if (!data) throw new Error('Anúncio não encontrado.')
      setAnuncio(data)
    } catch (err) {
      console.error(err); setError(err.message || 'Erro ao carregar anúncio.')
    } finally { setLoading(false) }
  }

  const imagens = anuncio ? getImagens(anuncio.imagem_url) : []
  const ehDono = user && anuncio ? anuncio.usuario_id === user.id : false

  const statusNormalizado = anuncio?.status ? anuncio.status.charAt(0).toUpperCase() + anuncio.status.slice(1).toLowerCase() : ''
  const statusCor = statusNormalizado === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : statusNormalizado === 'Vendido' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Ops!</h2>
      <p className="text-gray-500 mb-6 max-w-md text-sm sm:text-base">{error}</p>
      <Link to="/anuncios" className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition no-underline text-sm">Ver todos os anúncios</Link>
    </div>
  )

  if (!anuncio) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition">
        ← Voltar aos anúncios
      </button>

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {imagens.length > 0 && (
          <div className="relative">
            <div className="flex gap-1 overflow-x-auto p-2 bg-gray-50 snap-x snap-mandatory">
              {imagens.map((img, index) => (
                <img key={index} src={img} alt={`${anuncio.titulo} - Foto ${index + 1}`} className="h-56 sm:h-64 md:h-80 flex-shrink-0 w-auto object-contain rounded-xl snap-start" />
              ))}
            </div>
            <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
          </div>
        )}

        {/* ✅ CORREÇÃO: Padding interno menor no mobile */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <span className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full ${statusCor}`}>
              {statusNormalizado}
            </span>
            {anuncio.destaque && (
              <span className="px-2.5 sm:px-3 py-1 bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-medium rounded-full">
                ★ Destaque
              </span>
            )}
            <p className="text-xl sm:text-2xl font-bold text-emerald-700">
              {formatarPreco(anuncio.preco)}
            </p>
          </div>

          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            {anuncio.titulo}
          </h1>

          <p className="text-gray-500 leading-relaxed whitespace-pre-line mb-4 sm:mb-6 text-sm sm:text-base">
            {anuncio.descricao}
          </p>

          <div className="border-t border-gray-100 pt-3 sm:pt-4 mb-3 sm:mb-4 space-y-2 text-xs sm:text-sm text-gray-500">
            <p>
              Publicado em{' '}
              <span className="font-medium text-gray-700">
                {new Date(anuncio.created_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(anuncio.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
            {anuncio.data_expiracao && (
              <p>
                Expira em{' '}
                <span className="font-medium text-gray-700">
                  {new Date(anuncio.data_expiracao).toLocaleDateString('pt-BR')}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-gray-100">
            <a
              href={`https://wa.me/?text=Olá, vi seu anúncio no BV Service: ${encodeURIComponent(anuncio.titulo)} ${encodeURIComponent(formatarPreco(anuncio.preco))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-green-500 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium hover:bg-green-600 transition no-underline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.871-1.964-.621-3.983-3.062-3.584-3.062-6.251 0-2.687.925-5.378.787-7.778-2.297-.08-4.686.19-6.492 1.137-1.844-2.884-2.06-4.037.175-5.683-2.995-4.795-7.586-4.795-4.795 0-1.768 1.337-3.584 4.795 5.228 4.795 4.795 0 2.178-.405 4.686-1.337 7.166-5.39 12.06z" /></svg>
              WhatsApp
            </a>
            {ehDono && (
              <button onClick={() => navigate(`/editar-anuncio/${anuncio.id}`)} className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium hover:bg-gray-200 transition no-underline cursor-pointer">
                ✏️ Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnuncioDetailPage