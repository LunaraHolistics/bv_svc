import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

const GOOGLE_MAPS_EMBED_URL =
  'https://www.google.com/maps/d/u/1/embed?mid=1XFELlB7i9JmH3FVd6wR3O8HQ1nAdTSo&ehbc=2E312F'

const formatarWhatsapp = (numero) => {
  if (!numero) return null
  const limpo = String(numero).replace(/\D/g, '')
  return limpo.length >= 10 ? limpo : null
}

// Normaliza o endereço para agrupar corretamente (ignora maiúsculas e espaços extras)
const normalizeAddr = (addr) => {
  if (!addr) return ''
  return addr.toLowerCase().trim().replace(/\s+/g, '')
}

/* ---------------- CARD INTERNO (Conteúdo de cada carta) ---------------- */

const CardConteudo = ({ prestador, onDelete, isFront, onBringToFront }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const whatsapp = formatarWhatsapp(prestador.whatsapp)
  const nomeInicial = prestador.nome?.charAt(0)?.toUpperCase() || '🏡'

  const isMaster = user?.id === MASTER_USER_ID
  const isOwner = user?.id === prestador.usuario_id
  const canManage = isMaster || isOwner

  const whatsappLink = useMemo(() => {
    if (!whatsapp) return null
    const servico = prestador.categoria || 'serviço disponível'
    const mensagem = `Olá, também sou morador do Bella Vittà e quero conversar com você sobre seu serviço de ${servico}`
    return `https://wa.me/55${whatsapp}?text=${encodeURIComponent(mensagem)}`
  }, [whatsapp, prestador.categoria])

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm(`Deseja realmente excluir o serviço de ${prestador.nome}?`)) {
      await onDelete(prestador.id)
    }
  }

  const handleCardClick = () => {
    if (isFront) navigate(`/servico/${prestador.id}`)
    else onBringToFront()
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow duration-300 ${isFront ? 'cursor-pointer' : 'cursor-pointer select-none'}`}
      style={{ pointerEvents: isFront ? 'auto' : 'none' }} // Evita cliques acidentais nos de trás
    >
      
      {prestador.imagens_url && (
        <div className="w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-400 shrink-0" />
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              {prestador.avatar_do_perfil ? (
                <img 
                  src={prestador.avatar_do_perfil} 
                  alt={prestador.nome} 
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className={`w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center border-2 border-white shadow-sm ${prestador.avatar_do_perfil ? 'hidden' : 'flex'}`}
              >
                <span className="text-emerald-700 font-bold text-lg">{nomeInicial}</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate">{prestador.nome || 'Prestador'}</h3>
              {prestador.nome_fantasia && (
                <p className="text-sm text-emerald-600 truncate">{prestador.nome_fantasia}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {prestador.casa_numero && (
              <div className="px-3 py-1 bg-gray-100 rounded-xl text-xs font-medium text-gray-600">
                📍 {prestador.casa_numero}
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
          {prestador.imagens_url && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">📸 Ver fotos</span>
          )}
        </div>

        {(prestador.descricao_comercial || prestador.descricao) && (
          <p className="text-sm text-gray-500 mt-4 leading-relaxed line-clamp-3">
            {prestador.descricao_comercial || prestador.descricao}
          </p>
        )}

        {prestador.condicoes_moradores && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-3">
            <p className="text-xs text-amber-700 font-medium">
              ⭐ Benefício moradores: {prestador.condicoes_moradores}
            </p>
          </div>
        )}

        {/* Botões só aparecem no card da frente para não poluir visual */}
        {canManage && isFront && (
          <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-4 border-t border-dashed border-red-200 mt-6 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/editar-servico/${prestador.id}`) }}
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

      {/* Rodapé de contato só no card da frente */}
      {isFront && (
        <div onClick={(e) => e.stopPropagation()} className="border-t border-gray-100 p-4 flex gap-2 flex-wrap mt-auto">
          {whatsappLink ? (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium no-underline hover:bg-green-600 transition">
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
      )}
    </div>
  )
}

/* ---------------- CARD AGRUPADO (Efeito Baralho) ---------------- */

const CardAgrupado = ({ grupo, filtroAtivo, onDelete }) => {
  const [activeIdx, setActiveIdx] = useState(0)

  // Se o filtro da página mudar, traz o card correspondente para a frente
  useEffect(() => {
    if (filtroAtivo && filtroAtivo !== 'Todas') {
      const idx = grupo.findIndex(p => p.categoria === filtroAtivo)
      if (idx !== -1 && idx !== activeIdx) {
        setActiveIdx(idx)
      }
    }
  }, [filtroAtivo, grupo])

  // Se o card da frente for deletado, volta para o primeiro
  useEffect(() => {
    if (activeIdx >= grupo.length) setActiveIdx(0)
  }, [grupo.length, activeIdx])

  const prestadorDaFrente = grupo[activeIdx]

  return (
    <div className="relative h-[420px] w-full">
      {grupo.map((prestador, i) => {
        const diff = activeIdx - i
        const isFront = diff === 0
        
        // Cálculo do efeito de profundidade
        const translateX = diff > 0 ? diff * 12 : 0
        const translateY = diff > 0 ? diff * 8 : 0
        const scale = 1 - (Math.abs(diff) * 0.03)
        const opacity = isFront ? 1 : Math.max(0.2, 1 - (Math.abs(diff) * 0.25))
        const zIndex = 20 - Math.abs(diff)
        const blur = Math.abs(diff) > 2 ? 'blur(2px)' : 'none'

        return (
          <div
            key={prestador.id}
            className="absolute inset-0 transition-all duration-300 ease-out"
            style={{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              opacity,
              zIndex,
              filter: blur
            }}
          >
            <CardConteudo
              prestador={prestador}
              onDelete={onDelete}
              isFront={isFront}
              onBringToFront={() => setActiveIdx(i)}
            />
          </div>
        )
      })}

      {/* Indicadores de quantidade (bolinhas na base) */}
      {grupo.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-50 pointer-events-none">
          {grupo.map((_, i) => (
            <div 
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === activeIdx ? 'bg-emerald-500 scale-125' : 'bg-white/90 shadow-sm'
              }`} 
            />
          ))}
        </div>
      )}

      {/* Faixa lateral indicando mais serviços (aparece se tiver mais de 1) */}
      {grupo.length > 1 && (
        <div 
          onClick={(e) => { e.stopPropagation(); setActiveIdx(prev => (prev + 1) % grupo.length) }}
          className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full bg-emerald-600 text-white text-xs font-bold px-2 py-4 rounded-r-xl shadow-lg cursor-pointer hover:bg-emerald-700 transition z-40 hidden md:flex flex-col items-center justify-center h-24"
        >
          <span className="rotate-90 whitespace-nowrap mb-6">+{grupo.length - 1} serviço{grupo.length - 1 > 1 ? 's' : ''}</span>
        </div>
      )}
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
      const listaCategorias = resCategorias.error ? [] : (resCategorias.data || [])
      const listaPrestadores = resPrestadores.data || []

      const listaIdsUnicos = [...new Set(listaPrestadores.map(p => p.usuario_id).filter(Boolean))]
      let mapaAvatares = {}
      
      if (listaIdsUnicos.length > 0) {
        const { data: perfis } = await supabase
          .from('perfis')
          .select('id, avatar_url')
          .in('id', listaIdsUnicos)
        
        if (perfis) {
          perfis.forEach(p => { 
            if (p.avatar_url) mapaAvatares[p.id] = p.avatar_url 
          })
        }
      }

      const prestadoresComAvatar = listaPrestadores.map(p => ({
        ...p,
        avatar_do_perfil: p.avatar_url || mapaAvatares[p.usuario_id] || null
      }))

      setPrestadores(prestadoresComAvatar)
      setCategorias(listaCategorias)
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar os serviços.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteServico = async (id) => {
    const prestadorBackup = prestadores.find(p => p.id === id)
    setPrestadores((prev) => prev.filter((p) => p.id !== id))

    const { error } = await supabase.from('prestadores_servico').delete().eq('id', id)
    
    if (error) {
      alert('Erro ao excluir: ' + error.message)
      if (prestadorBackup) {
        setPrestadores((prev) => [...prev, prestadorBackup])
      }
    }
  }

  // ✅ NOVA LÓGICA: Agrupa por endereço (rua e número)
  const agrupados = useMemo(() => {
    const grupos = new Map()
    const soltos = [] // Para quem não preencheu endereço

    prestadores.forEach(p => {
      const key = normalizeAddr(p.casa_numero)
      if (!key) {
        soltos.push([p]) // Não agrupa quem não tem endereço
        return
      }
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key).push(p)
    })

    return [...soltos, ...Array.from(grupos.values())]
  }, [prestadores])

  // ✅ NOVA LÓGICA: Filtra os grupos (se qualquer membro bater, o grupo inteiro aparece)
  const gruposFiltrados = useMemo(() => {
    let resultado = agrupados
    if (filtroCategoria !== 'Todas') {
      resultado = resultado.filter(grupo => 
        grupo.some(p => p.categoria === filtroCategoria)
      )
    }
    if (busca.trim()) {
      const termo = busca.toLowerCase()
      resultado = resultado.filter(grupo =>
        grupo.some(p =>
          [p.nome, p.nome_fantasia, p.categoria, p.descricao_comercial, p.descricao, String(p.casa_numero || '')]
            .filter(Boolean).some((item) => item.toLowerCase().includes(termo))
        )
      )
    }
    return resultado
  }, [agrupados, filtroCategoria, busca])

  const categoriasFiltro = useMemo(() => {
    const doBanco = categorias.map((c) => c.nome)
    const doDados = [...new Set(prestadores.map((p) => p.categoria).filter(Boolean))]
    return ['Todas', ...new Set([...doBanco, ...doDados])]
  }, [categorias, prestadores])

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

      {/* GRID COM AGRUPAMENTO */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-[420px] bg-white rounded-3xl border border-gray-100 animate-pulse" />)}</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center"><p className="text-red-600">{error}</p></div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900">Nenhum serviço encontrado</h3>
          <p className="text-gray-500 mt-2">Tente ajustar sua busca ou filtros.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-900">Prestadores disponíveis</h2>
            <span className="text-sm text-gray-500">{gruposFiltrados.length} endereço(s) • {prestadores.length} serviço(s)</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {gruposFiltrados.map((grupo, index) => (
              <CardAgrupado 
                key={`${normalizeAddr(grupo[0]?.casa_numero)}-${index}`} 
                grupo={grupo} 
                filtroAtivo={filtroCategoria}
                onDelete={handleDeleteServico} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MapaPage