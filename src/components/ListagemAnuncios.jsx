// src/components/ListagemAnuncios.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  } catch {
    return [imagemUrl]
  }
}

const CardAnuncio = ({ anuncio, ehDono }) => {
  const navigate = useNavigate()
  const imagens = getImagens(anuncio.imagem_url)
  const imagem = imagens.length > 0 ? imagens[0] : null

  const statusNormalizado = anuncio.status
    ? anuncio.status.charAt(0).toUpperCase() + anuncio.status.slice(1).toLowerCase()
    : 'Ativo'

  const statusCor =
    statusNormalizado === 'Ativo'
      ? 'bg-emerald-100 text-emerald-700'
      : statusNormalizado === 'Vendido'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-gray-100 text-gray-600'

  return (
    <div
      onClick={() => navigate(`/anuncio/${anuncio.id}`)}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
    >
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {imagem ? (
          <img
            src={imagem}
            alt={anuncio.titulo}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
          </div>
        )}
        {anuncio.destaque && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full shadow-sm">
            ★ DESTAQUE
          </div>
        )}
      </div>

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

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/anuncio/${anuncio.id}`)
          }}
          className="text-[11px] text-emerald-600 font-medium hover:text-emerald-700 mt-2 block text-left"
        >
          Clique para mais informações →
        </button>
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