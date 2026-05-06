// src/pages/IndicacoesPage.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import FormIndicacao from '../components/FormIndicacao'

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
}

const CardIndicacao = ({ indicacao }) => {
  const whatsapp = formatarWhatsapp(indicacao.contato_whatsapp)
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">{indicacao.nome_profissional}</h3>
            {indicacao.categoria && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                {indicacao.categoria}
              </span>
            )}
          </div>
          {indicacao.avaliacao_media > 0 && (
            <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
              <span className="text-amber-500 text-xs">★</span>
              <span className="text-xs font-medium text-amber-700">{Number(indicacao.avaliacao_media).toFixed(1)}</span>
            </div>
          )}
        </div>

        {indicacao.descricao && (
          <p className="text-gray-500 text-xs mt-2 leading-relaxed">{indicacao.descricao}</p>
        )}

        {indicacao.servicos && indicacao.servicos.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {indicacao.servicos.map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{s}</span>
            ))}
          </div>
        )}

        {indicacao.condicoes_moradores && (
          <div className="mt-2.5 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-amber-700 text-[11px] font-medium">⭐ {indicacao.condicoes_moradores}</p>
          </div>
        )}

        {indicacao.endereco && (
          <p className="text-gray-400 text-[11px] mt-2">📍 {indicacao.endereco}</p>
        )}
      </div>

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
            WhatsApp
          </a>
        ) : (
          <span className="text-xs text-gray-400">Sem contato</span>
        )}

        {indicacao.instagram_url && (
          <a
            href={indicacao.instagram_url.startsWith('http') ? indicacao.instagram_url : `https://instagram.com/${indicacao.instagram_url.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-colors no-underline"
          >
            Instagram
          </a>
        )}

        {indicacao.site_url && (
          <a
            href={indicacao.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors no-underline"
          >
            Site
          </a>
        )}
      </div>
    </div>
  )
}

const IndicacoesPage = () => {
  const [indicacoes, setIndicacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    buscarDados()
  }, [])

  const buscarDados = async () => {
    setLoading(true)
    setError(null)
    try {
      const [resIndicacoes, resCategorias] = await Promise.all([
        supabase.from('indicacoes').select('*').eq('status', 'ativo').order('avaliacao_media', { ascending: false, nullsFirst: false }),
        supabase.from('categorias').select('*').in('tipo', ['indicacao', 'ambos']).order('ordem'),
      ])

      if (resIndicacoes.error) throw resIndicacoes.error
      if (resCategorias.error) throw resCategorias.error

      setIndicacoes(resIndicacoes.data || [])
      setCategorias(resCategorias.data || [])
    } catch (err) {
      console.error('Erro:', err)
      setError('Não foi possível carregar as indicações.')
    } finally {
      setLoading(false)
    }
  }

  const categoriasFiltro = useMemo(() => {
    const doBanco = categorias.map(c => c.nome)
    const doDados = [...new Set(indicacoes.map(i => i.categoria).filter(Boolean))]
    const todas = [...new Set([...doBanco, ...doDados])].sort()
    return ['Todas', ...todas]
  }, [categorias, indicacoes])

  const filtradas = useMemo(() => {
    if (filtroCategoria === 'Todas') return indicacoes
    return indicacoes.filter(i => i.categoria === filtroCategoria)
  }, [indicacoes, filtroCategoria])

  return (
    <div className="space-y-6">
      {/* Header com botão */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Indicações de Moradores</h1>
          <p className="text-sm text-gray-500 mt-1">
            Profissionais recomendados pelos moradores do Bella Vittà
          </p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all no-underline shrink-0 ${
            mostrarForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {mostrarForm ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            )}
          </svg>
          {mostrarForm ? 'Fechar' : 'Indicar Profissional'}
        </button>
      </div>

      {/* Formulário (expansível) */}
      {mostrarForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Nova Indicação</h2>
          <FormIndicacao
            onSucesso={() => {
              setMostrarForm(false)
              buscarDados()
            }}
            onFechar={() => setMostrarForm(false)}
          />
        </div>
      )}

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
                  ? 'bg-blue-600 text-white'
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
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">{error}</p>
          <button onClick={buscarDados} className="text-sm text-emerald-600 hover:underline">Tentar novamente</button>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <span className="text-4xl block mb-3">👥</span>
          <p className="text-gray-500 text-sm">
            {filtroCategoria === 'Todas'
              ? 'Nenhuma indicação cadastrada ainda.'
              : `Nenhuma indicação em "${filtroCategoria}".`}
          </p>
          {!mostrarForm && (
            <button
              onClick={() => setMostrarForm(true)}
              className="mt-4 text-sm text-blue-600 font-medium hover:underline"
            >
              Seja o primeiro a indicar!
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">{filtradas.length} indicação(ões)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtradas.map(i => <CardIndicacao key={i.id} indicacao={i} />)}
          </div>
        </>
      )}
    </div>
  )
}

export default IndicacoesPage