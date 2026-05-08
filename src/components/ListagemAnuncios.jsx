// src/components/ListagemAnuncios.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supababase'
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
  } catch {
    return [imagemUrl]
  }
}

const CarouselFotos = ({ imagens, titulo }) => {
  if (imagens.length <= 1) return null

  const [atual, setAtual] = useState(0)

  const voltar = () => {
    setAtual((prev) => (prev <= 0 ? imagens.length - 1 : prev - 1))
  }

  const avancar = () => {
    setAtual((prev) => (prev >= imagens.length - 1 ? 0 : prev + 1))
  }

  if (!titulo) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={voltar}
          className="w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5 7.5" /></svg>
        </button>
        <span className="text-[11px] text-gray-500">
          1/{imagens.length}
        </span>
        <button
          type="button"
          onClick={avancar}
          className="w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5" /></svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        type="button"
        onClick={voltar}
        className="w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5 7.5" /></svg>
      </button>
      <span className="text-[11px] text-gray-500">
        {atual + 1}/{imagens.length}
      </span>
      <button
        type="button"
        onClick={avancar}
        className="w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5" /></svg>
      </button>
    </div>
  )
}

const CardAnuncio = ({ anuncio, ehDono }) => {
  const navigate = useNavigate()
  const imagens = getImagens(anuncio.imagem_url)
  const totalImagens = imagens.length
  const temMaisDeUma = totalImagens > 1

  const statusNormalizado = anuncio.status
    ? anuncio.status.charAt(0).toUpperCase() + anuncio.status.slice(1).toLowerCase()
    : 'Ativo'

  const statusCor =
    statusNormalizado === 'Ativo'
      ? 'bg-emerald-100 text-emerald-700'
      : statusNormalizado === 'Vendido'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-gray-100 text-gray-600'

  const capaImagem = totalImagens > 0 ? imagens[0] : null

  return (
    <div
      onClick={(e) => {
        if (e.target.closest('button')) return
        navigate(`/anuncio/${anuncio.id}`)
      }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
    >
      {/* Capa */}
      {capaImagem && (
        <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
          <img
            src={capaImagem}
            alt={anuncio.titulo}
            className="w-full h-full object-contain"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
            {anuncio.titulo}
          </h3>
          <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${statusCor}`}>
            {statusNormalizado}
          </span>
        </div>

        <p className="text-emerald-600 font-bold mt-1">
          {formatarPreco(anuncio.preco)}
        </p>

        <p className="text-gray-500 text-xs mt-1 line-clamp-1">
          {anuncio.descricao}
        </p>

        {/* Carousel + ver mais */}
        <div className="flex items-center justify-between mt-3">
          {temMaisDeUma && <CarouselFotos imagens={imagens} titulo={anuncio.titulo} />}

          {temMaisDeUma && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/anuncio/${anuncio.id}`)
              }}
              className="text-[11px] text-emerald-600 font-medium hover:text-emerald-700 mt-1 block text-right cursor-pointer"
            >
              Ver mais fotos →
            </button>
          )}

          {ehDono && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/editar-anuncio/${anuncio.id}`)
              }}
              className="text-[11px] text-gray-400 hover:text-gray-600 mt-1 block text-right cursor-pointer"
            >
              ✏️ Editar
            </button>
          )}
        </div>

        <p className="text-[10px] text-gray-400 mt-2">
          {new Date(anuncio.created_at).toLocaleDateString('pt-BR')}
          {anuncio.data_expiracao && ` · Expira: ${new Date(anuncio.data_expiracao).toLocaleDateString('pt-BR')}`}
        </p>
      </div>
    </div>
  )
}

const ListagemAnuncios = () => {
  const { user } = useAuth()
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { buscarAnuncios() }, [])

  const buscarAnuncios = async () => {
    setLoading(true)
    setError(null)
    try {
      const agora = new Date().toISOString()
      const { data, error: err } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .ilike('status', 'ativo')
        .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
        .order('destaque', { ascending: false })
        .order('created_at', { ascending: false })
      if (err) throw err
      setAnuncios(data || [])
    } catch (err) {
      setError('Não foi possível carregar os anúncios.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-2">{error}</p>
        <button
          onClick={buscarAnuncios}
          className="text-sm text-emerald-600 hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (anuncios.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🏷️</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Nenhum anúncio ativo
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Seja o primeiro a anúnciar algo no condomínio!
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {anuncios.length} anúncio(s) ativo(s)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {anuncios.map(anuncio => (
          <CardAnuncio
            key={anuncio.id}
            anuncio={anuncio}
            ehDono={user ? anuncio.usuario_id === user.id : false}
          />
        ))}
      </div>
    </div>
  )
}

export default ListagemAnuncios