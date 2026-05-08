import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

// ⚠️ COLE AQUI O SEU ID DE USUÁRIO MASTER DO SUPABASE
const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

const GOOGLE_MAPS_EMBED_URL =
  'https://www.google.com/maps/d/u/1/embed?mid=1XFELlB7i9JmH3FVd6wR3O8HQ1nAdTSo&ehbc=2E312F'

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
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

/* ---------------- CARD UNIFICADO ---------------- */

const CardPrestador = ({ prestador, onDelete }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const whatsapp = formatarWhatsapp(prestador.whatsapp)
  const nomeInicial = prestador.nome?.charAt(0)?.toUpperCase() || '🏡'
  const imagens = getImagens(prestador.imagens_url)

  // Permissões
  const isMaster = user?.id === MASTER_USER_ID
  const isOwner = user?.id === prestador.user_id
  const canManage = isMaster || isOwner

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm(`Deseja realmente excluir o serviço de ${prestador.nome}?`)) {
      await onDelete(prestador.id)
    }
  }

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      
      {/* GALERIA DE IMAGENS */}
      {imagens.length > 0 && (
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
          <div className="flex h-full">
            <div className="w-1/2 h-full border-r border-gray-100">
              <img src={imagens[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-1/2 h-full grid grid-rows-2">
              {imagens[1] && <img src={imagens[1]} alt="" className="w-full h-full object-cover border-b border-gray-100" />}
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm relative">
                {imagens[2] ? (
                  <img src={imagens[2]} alt="" className="w-full h-full object-cover absolute inset-0" />
                ) : null}
                {imagens.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold z-10">
                    +{imagens.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {!imagens.length && (
              <>
                {prestador.avatar_url ? (
                  <img src={prestador.avatar_url} alt={prestador.nome} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-emerald-700 font-bold text-lg">{nomeInicial}</span>
                  </div>
                )}
              </>
            )}

            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{prestador.nome || 'Prestador'}</h3>
              {prestador.nome_fantasia && (
                <p className="text-sm text-emerald-600 truncate">{prestador.nome_fantasia}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {prestador.casa_numero && (
              <div className="px-3 py-1 bg-gray-100 rounded-xl text-xs font-medium text-gray-600">
                Casa {prestador.casa_numero}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {prestador.categoria && (
            <span className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              {prestador.categoria}
            </span>
          )}
          {prestador.mapa_coords_x && prestador.mapa_coords_y && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">📍 No mapa</span>
          )}
        </div>

        {prestador.descricao_comercial && (
          <p className="text-sm text-gray-500 mt-4 leading-relaxed line-clamp-3">
            {prestador.descricao_comercial}
          </p>
        )}

        {prestador.servicos_oferecidos?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {prestador.servicos_oferecidos.map((item, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{item}</span>
            ))}
          </div>
        )}

        {prestador.condicoes_moradores && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              ⭐ Benefício moradores: {prestador.condicoes_moradores}
            </p>
          </div>
        )}

        {/* BOTÕES DE GERENCIAMENTO (SÓ DONO OU MASTER) */}
        {canManage && (
          <div className="mt-auto pt-4 border-t border-dashed border-red-200 mt-6 flex gap-2">
            <button
              onClick={() => navigate(`/editar-servico/${prestador.id}`)}
              className="flex-1 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition cursor-pointer"
            >
              🗑️ Excluir
            </button>
          </div>
        )}
      </div>

      {/* RODAPÉ DE CONTATO */}
      <div className="border-t border-gray-100 p-4 flex gap-2 flex-wrap">
        {whatsapp ? (
          <a href={`https://wa.me/55${whatsapp}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium no-underline hover:bg-green-600 transition">
            WhatsApp
          </a>
        ) : (
          <div className="px-4 py-2 text-sm text-gray-400">Sem contato</div>
        )}

        {prestador.instagram_url && (
          <a href={prestador.instagram_url.startsWith('http') ? prestador.instagram_url : `https://instagram.com/${prestador.instagram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium no-underline">
            Instagram
          </a>
        )}

        {prestador.site_url && (
          <a href={prestador.site_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium no-underline hover:bg-gray-200 transition">
            Site
          </a>
        )}
      </div>
    </div>
  )
}

/* ---------------- PAGE UNIFICADA ---------------- */

const MapaPage = () => {
  const { user } = useAuth()
  const [prestadores, setPrestadores] = useState([])
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('Todas')
  const [busca, setBusca] = useState('')
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
        supabase.from('categorias').select('*').eq('tipo', 'condominio').order('ordem')
      ])
      if (resPrestadores.error) throw resPrestadores.error
      if (resCategorias.error) throw resCategorias.error
      setPrestadores(resPrestadores.data || [])
      setCategorias(resCategorias.data || [])
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os serviços.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteServico = async (id) => {
    const { error } = await supabase.from('prestadores_servico').delete().eq('id', id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      setPrestadores((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const categoriasFiltro = useMemo(() => {
    const doBanco = categorias.map((c) => c.nome)
    const doDados = [...new Set(prestadores.map((p) => p.categoria).filter(Boolean))]
    return ['Todas', ...new Set([...doBanco, ...doDados])]
  }, [categorias, prestadores])

  const filtrados = useMemo(() => {
    let resultado = prestadores
    if (filtroCategoria !== 'Todas') resultado = resultado.filter((p) => p.categoria === filtroCategoria)
    if (busca.trim()) {
      const termo = busca.toLowerCase()
      resultado = resultado.filter((p) =>
        [p.nome, p.nome_fantasia, p.categoria, p.descricao_comercial, String(p.casa_numero || '')]
          .filter(Boolean).some((item) => item.toLowerCase().includes(termo))
      )
    }
    return resultado
  }, [prestadores, filtroCategoria, busca])

  const totalCasas = useMemo(() => new Set(prestadores.map((p) => p.casa_numero).filter(Boolean)).size, [prestadores])

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] bg-gradient-to-br from-emerald-700 to-teal-700 text-white p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-4">🛠️ Serviços e Mapa</span>
          <h1 className="text-3xl md:text-5xl font-bold">Serviços da comunidade</h1>
          <p className="mt-3 text-emerald-100 max-w-2xl">Encontre profissionais que moram ou atuam dentro do Bella Vittà.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold">{prestadores.length}</p>
              <p className="text-sm text-emerald-100">Prestadores</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold">{categoriasFiltro.length - 1}</p>
              <p className="text-sm text-emerald-100">Categorias</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-2xl font-bold">{totalCasas}</p>
              <p className="text-sm text-emerald-100">Casas ativas</p>
            </div>
          </div>
        </div>
      </section>

      {/* SATÉLITE */}
      <div className="bg-white rounded-3xl border-2 border-emerald-400 overflow-hidden shadow-xl relative">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 z-10 flex items-center gap-3 shadow-md">
          <span className="text-2xl">🛰️</span>
          <div>
            <h2 className="font-bold text-base leading-tight">Visão por Satélite do Condomínio</h2>
            <p className="text-emerald-100 text-xs">Explore as ruas e a região de cima</p>
          </div>
        </div>
        <div className="pt-14">
          <iframe src={GOOGLE_MAPS_EMBED_URL} width="100%" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" title="Mapa Satélite" />
        </div>
      </div>

      {/* FILTROS */}
      <section className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" placeholder="Buscar por nome, serviço ou casa..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categoriasFiltro.map((cat) => (
            <button key={cat} onClick={() => setFiltroCategoria(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filtroCategoria === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
          {(filtroCategoria !== 'Todas' || busca) && (
            <button onClick={() => { setFiltroCategoria('Todas'); setBusca('') }} className="px-4 py-2 rounded-full text-sm bg-red-50 text-red-600 hover:bg-red-100 transition">Limpar</button>
          )}
        </div>
      </section>

      {/* GRID */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-white rounded-3xl border border-gray-100 animate-pulse" />)}</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center"><p className="text-red-600">{error}</p></div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900">Nenhum serviço encontrado</h3>
          <p className="text-gray-500 mt-2">Tente ajustar sua busca ou filtros.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900">Prestadores disponíveis</h2>
            <span className="text-sm text-gray-500">{filtrados.length} resultado(s)</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map((prestador) => (
              <CardPrestador key={prestador.id} prestador={prestador} onDelete={handleDeleteServico} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MapaPage