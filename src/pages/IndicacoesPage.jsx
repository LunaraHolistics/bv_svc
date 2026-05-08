// src/pages/IndicacoesPage.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import FormIndicacao from '../components/FormIndicacao'

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
}

const CardIndicacao = ({ indicacao }) => {
  const whatsapp = formatarWhatsapp(indicacao.contato_whatsapp)

  return (
    <div className="group bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
              {indicacao.nome_profissional}
            </h3>
            {indicacao.categoria && (
              <span className="inline-flex mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {indicacao.categoria}
              </span>
            )}
          </div>
          {Number(indicacao.avaliacao_media) > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-xl">
              <span>⭐</span>
              <span className="text-sm font-semibold text-amber-700">
                {Number(indicacao.avaliacao_media).toFixed(1)}
              </span>
            </div>
          )}
        </div>
        {indicacao.descricao && (
          <p className="text-gray-500 text-sm leading-relaxed mt-4 line-clamp-3">
            {indicacao.descricao}
          </p>
        )}
        {Array.isArray(indicacao.servicos) && indicacao.servicos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {indicacao.servicos.map((servico, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                {servico}
              </span>
            ))}
          </div>
        )}
        {indicacao.condicoes_moradores && (
          <div className="mt-5 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <p className="text-sm text-emerald-700 font-medium">
              🎁 Benefício para moradores: {indicacao.condicoes_moradores}
            </p>
          </div>
        )}
        {indicacao.endereco && (
          <p className="text-xs text-gray-400 mt-4">
            📍 {indicacao.endereco}
          </p>
        )}
      </div>
      <div className="border-t border-gray-100 p-4 flex flex-wrap gap-2">
        {whatsapp && (
          <a
            href={`https://wa.me/55${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition no-underline"
          >
            WhatsApp
          </a>
        )}
        {indicacao.instagram_url && (
          <a
            href={
              indicacao.instagram_url.startsWith('http')
                ? indicacao.instagram_url
                : `https://instagram.com/${indicacao.instagram_url.replace('@', '')}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium no-underline"
          >
            Instagram
          </a>
        )}
        {indicacao.site_url && (
          <a
            href={indicacao.site_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium no-underline"
          >
            Site
          </a>
        )}
      </div>
    </div>
  )
}

const IndicacoesPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [indicacoes, setIndicacoes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [busca, setBusca] = useState('')
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
        supabase
          .from('indicacoes')
          .select('*')
          .eq('status', 'ativo')
          .order('avaliacao_media', { ascending: false, nullsFirst: false }),
        supabase
          .from('categorias')
          .select('*')
          .in('tipo', ['indicacao', 'ambos'])
          .order('ordem')
      ])

      if (resIndicacoes.error) throw resIndicacoes.error
      if (resCategorias.error) throw resCategorias.error

      setIndicacoes(resIndicacoes.data || [])
      setCategorias(resCategorias.data || [])
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar as indicações.')
    } finally {
      setLoading(false)
    }
  }

  const categoriasFiltro = useMemo(() => {
    const banco = categorias.map((c) => c.nome)
    const dados = indicacoes.map((i) => i.categoria).filter(Boolean)
    return ['Todas', ...new Set([...banco, ...dados])]
  }, [categorias, indicacoes])

  const filtradas = useMemo(() => {
    return indicacoes.filter((item) => {
      const matchCategoria =
        filtroCategoria === 'Todas' || item.categoria === filtroCategoria
      const termo = busca.toLowerCase()
      const matchBusca =
        item.nome_profissional?.toLowerCase().includes(termo) ||
        item.descricao?.toLowerCase().includes(termo) ||
        item.categoria?.toLowerCase().includes(termo)
      return matchCategoria && matchBusca
    })
  }, [indicacoes, filtroCategoria, busca])

  const mediaGeral = useMemo(() => {
    const avaliadas = indicacoes.filter((i) => Number(i.avaliacao_media) > 0)
    if (!avaliadas.length) return '--'
    const total = avaliadas.reduce((acc, item) => acc + Number(item.avaliacao_media), 0)
    return (total / avaliadas.length).toFixed(1)
  }, [indicacoes])

  const abrirForm = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setMostrarForm(true)
  }

  return (
    <div className="space-y-8">

      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-8 md:p-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex px-4 py-2 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md mb-4">
            Rede de confiança
          </span>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Profissionais recomendados por vizinhos reais
          </h1>
          <p className="mt-4 text-blue-100 max-w-xl">
            Encontre prestadores bem avaliados pela comunidade Bella Vittà.
          </p>
          <button
            onClick={abrirForm}
            className="mt-6 px-6 py-3 bg-white text-blue-700 rounded-2xl font-semibold hover:scale-105 transition"
          >
            + Fazer indicação
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Profissionais</p>
          <h3 className="text-2xl font-bold mt-2">{indicacoes.length}</h3>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Categorias</p>
          <h3 className="text-2xl font-bold mt-2">{categoriasFiltro.length - 1}</h3>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <p className="text-sm text-gray-500">Avaliação média</p>
          <h3 className="text-2xl font-bold mt-2 text-amber-500">{mediaGeral}</h3>
        </div>
      </section>

      <section className="bg-white rounded-3xl border p-5">
        <input
          type="text"
          placeholder="Buscar profissional, serviço ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1">
          {categoriasFiltro.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${filtroCategoria === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">
          {error}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-3xl border p-12 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <h3 className="text-xl font-bold text-gray-900">Nenhuma indicação encontrada</h3>
          <p className="text-gray-500 mt-2">Tente outro filtro ou seja o primeiro a indicar alguém.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtradas.map((item) => (
            <CardIndicacao key={item.id} indicacao={item} />
          ))}
        </div>
      )}

      <section className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-bold">Conhece um profissional excelente?</h2>
        <p className="text-blue-100 mt-2">Ajude a comunidade compartilhando boas experiências.</p>
        <button
          onClick={abrirForm}
          className="mt-5 px-6 py-3 bg-white text-blue-700 rounded-2xl font-semibold"
        >
          Indicar agora
        </button>
      </section>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Nova indicação</h2>
              <button
                onClick={() => setMostrarForm(false)}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <FormIndicacao
              onSucesso={() => {
                setMostrarForm(false)
                buscarDados()
              }}
              onFechar={() => setMostrarForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default IndicacoesPage