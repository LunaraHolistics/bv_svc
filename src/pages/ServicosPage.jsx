// src/pages/ServicosPage.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
}

const CardPrestador = ({ prestador }) => {
  const whatsapp = formatarWhatsapp(prestador.whatsapp)
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header do card */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {prestador.avatar_url ? (
            <img src={prestador.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-emerald-700 font-bold text-sm">{prestador.nome?.charAt(0)?.toUpperCase() || '?'}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{prestador.nome}</h3>
            {prestador.nome_fantasia && (
              <p className="text-emerald-600 text-xs truncate">{prestador.nome_fantasia}</p>
            )}
          </div>
        </div>

        {prestador.categoria && (
          <span className="inline-block mt-2.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium">
            {prestador.categoria}
          </span>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-400">
          {prestador.casa_numero && <span>Casa {prestador.casa_numero}</span>}
          {prestador.tipo === 'proprietario' && <span>Proprietário</span>}
          {prestador.whatsapp && <span>📱 WhatsApp</span>}
        </div>
      </div>

      {/* Descrição comercial */}
      {prestador.descricao_comercial && (
        <div className="px-4 pb-3">
          <p className="text-gray-500 text-xs leading-relaxed">{prestador.descricao_comercial}</p>
        </div>
      )}

      {/* Condições especiais */}
      {prestador.condicoes_moradores && (
        <div className="mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-amber-700 text-[11px] font-medium">⭐ {prestador.condicoes_moradores}</p>
        </div>
      )}

      {/* Ações */}
      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
        {whatsapp ? (
          <a
            href={`https://wa.me/55${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors no-underline"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contatar
          </a>
        ) : (
          <span className="text-xs text-gray-400">Sem contato</span>
        )}

        {prestador.instagram_url && (
          <a
            href={prestador.instagram_url.startsWith('http') ? prestador.instagram_url : `https://instagram.com/${prestador.instagram_url.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-colors no-underline"
          >
            Instagram
          </a>
        )}
      </div>
    </div>
  )
}

const ServicosPage = () => {
  const [prestadores, setPrestadores] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
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
        supabase.from('prestadores_servico').select('*').eq('opt_in', true).order('nome'),
        supabase.from('categorias').select('*').eq('tipo', 'condominio').order('ordem'),
      ])

      if (resPrestadores.error) throw resPrestadores.error
      if (resCategorias.error) throw resCategorias.error

      setPrestadores(resPrestadores.data || [])
      setCategorias(resCategorias.data || [])
    } catch (err) {
      console.error('Erro:', err)
      setError('Não foi possível carregar os serviços.')
    } finally {
      setLoading(false)
    }
  }

  const categoriasFiltro = useMemo(() => {
    const doBanco = categorias.map(c => c.nome)
    const doDados = [...new Set(prestadores.map(p => p.categoria).filter(Boolean))]
    const todas = [...new Set([...doBanco, ...doDados])].sort()
    return ['Todas', ...todas]
  }, [categorias, prestadores])

  const filtrados = useMemo(() => {
    if (filtroCategoria === 'Todas') return prestadores
    return prestadores.filter(p => p.categoria === filtroCategoria)
  }, [prestadores, filtroCategoria])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Serviços do Condomínio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Prestadores que moram ou são proprietários no Bella Vittà
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categoriasFiltro.map(cat => {
          const catObj = categorias.find(c => c.nome === cat)
          return (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                filtroCategoria === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {catObj?.icone && <span>{catObj.icone}</span>}
              {cat}
            </button>
          )
        })}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">{error}</p>
          <button onClick={buscarDados} className="text-sm text-emerald-600 hover:underline">Tentar novamente</button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <span className="text-4xl block mb-3">🔧</span>
          <p className="text-gray-500 text-sm">
            {filtroCategoria === 'Todas'
              ? 'Nenhum prestador cadastrado ainda.'
              : `Nenhum prestador em "${filtroCategoria}".`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{filtrados.length} prestador(es)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(p => <CardPrestador key={p.id} prestador={p} />)}
          </div>
        </>
      )}
    </div>
  )
}

export default ServicosPage