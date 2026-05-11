import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

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

const ServicoDetalhePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [servico, setServico] = useState(null)
  const [error, setError] = useState(null)
  const [imagemAtiva, setImagemAtiva] = useState(0)

  useEffect(() => {
    buscarServico()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  const buscarServico = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('prestadores_servico')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setError('Serviço não encontrado.')
      setLoading(false)
      return
    }

    // Busca avatar do perfil do dono
    let avatarUrl = data.avatar_url || null
    if (!avatarUrl && data.usuario_id) {
      const { data: perfil } = await supabase
        .from('perfis')
        .select('avatar_url')
        .eq('id', data.usuario_id)
        .single()
      if (perfil?.avatar_url) avatarUrl = perfil.avatar_url
    }

    setServico({ ...data, avatar_do_perfil: avatarUrl })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500 gap-3">
        <div className="w-7 h-7 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        Carregando serviço...
      </div>
    )
  }

  if (error || !servico) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-gray-900">{error || 'Serviço não encontrado'}</h2>
        <button
          onClick={() => navigate('/mapa')}
          className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition cursor-pointer"
        >
          Voltar aos serviços
        </button>
      </div>
    )
  }

  const whatsapp = formatarWhatsapp(servico.whatsapp)
  const imagens = getImagens(servico.imagens_url)
  const isMaster = user?.id === MASTER_USER_ID
  const isOwner = user?.id === servico.usuario_id
  const canManage = isMaster || isOwner

  const whatsappLink = whatsapp
    ? `https://wa.me/55${whatsapp}?text=${encodeURIComponent(
        `Olá, também sou morador do Bella Vittà e quero conversar sobre seu serviço de ${servico.categoria || 'serviço'}`
      )}`
    : null

  const handleDelete = async () => {
    if (window.confirm(`Deseja realmente EXCLUIR o serviço de ${servico.nome}?`)) {
      await supabase.from('prestadores_servico').delete().eq('id', id)
      navigate('/mapa', { replace: true })
    }
  }

  const irParaImagem = (direcao) => {
    if (direcao === 'anterior') {
      setImagemAtiva(prev => (prev === 0 ? imagens.length - 1 : prev - 1))
    } else {
      setImagemAtiva(prev => (prev === imagens.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* VOLTAR */}
      <button
        onClick={() => navigate('/mapa')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
      >
        ← Voltar aos serviços
      </button>

      {/* GALERIA DE IMAGENS */}
      {imagens.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Imagem principal */}
          <div className="relative w-full h-64 sm:h-80 md:h-[420px] bg-gray-100">
            <img
              src={imagens[imagemAtiva]}
              alt=""
              className="w-full h-full object-cover"
            />

            {imagens.length > 1 && (
              <>
                <button
                  onClick={() => irParaImagem('anterior')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition cursor-pointer text-xl"
                >
                  ‹
                </button>
                <button
                  onClick={() => irParaImagem('proximo')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition cursor-pointer text-xl"
                >
                  ›
                </button>
                <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg font-medium">
                  {imagemAtiva + 1} / {imagens.length}
                </span>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {imagens.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
              {imagens.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImagemAtiva(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    i === imagemAtiva
                      ? 'border-emerald-500 shadow-md'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CARD PRINCIPAL DE INFORMAÇÕES */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-7">

          {/* CABEÇALHO: Avatar + Nome + Badges */}
          <div className="flex items-start gap-5">
            <div className="relative shrink-0">
              {servico.avatar_do_perfil ? (
                <img
                  src={servico.avatar_do_perfil}
                  alt={servico.nome}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className={`w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center border-2 border-white shadow-md ${
                  servico.avatar_do_perfil ? 'hidden' : 'flex'
                }`}
              >
                <span className="text-emerald-700 font-bold text-2xl">
                  {servico.nome?.charAt(0)?.toUpperCase() || '🏠'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {servico.nome || 'Prestador'}
              </h1>
              {servico.nome_fantasia && (
                <p className="text-lg text-emerald-600 mt-1 font-medium">
                  {servico.nome_fantasia}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {servico.categoria && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
                    {servico.categoria}
                  </span>
                )}
                {servico.casa_numero && (
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                    📍 Casa {servico.casa_numero}
                  </span>
                )}
                {servico.opt_in !== false ? (
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                    ✅ Ativo
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm font-medium">
                    ⏸️ Oculto
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          {(servico.descricao_comercial || servico.descricao) && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Sobre o serviço
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                {servico.descricao_comercial || servico.descricao}
              </p>
            </div>
          )}

          {/* SERVIÇOS OFERECIDOS */}
          {servico.servicos_oferecidos?.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Serviços oferecidos
              </h2>
              <div className="flex flex-wrap gap-2">
                {servico.servicos_oferecidos.map((item, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-gray-50 border border-gray-100 text-gray-700 rounded-xl text-sm font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BENEFÍCIOS PARA MORADORES */}
          {servico.condicoes_moradores && (
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
              <h2 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                ⭐ Benefícios exclusivos para moradores
              </h2>
              <p className="text-amber-800 font-semibold text-lg">
                {servico.condicoes_moradores}
              </p>
            </div>
          )}

          {/* REDES SOCIAIS */}
          {(servico.instagram_url || servico.site_url) && (
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Na internet
              </h2>
              <div className="flex flex-wrap gap-3">
                {servico.instagram_url && (
                  <a
                    href={
                      servico.instagram_url.startsWith('http')
                        ? servico.instagram_url
                        : `https://instagram.com/${servico.instagram_url.replace('@', '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium no-underline hover:opacity-90 transition"
                  >
                    📸 Instagram
                  </a>
                )}
                {servico.site_url && (
                  <a
                    href={servico.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium no-underline hover:bg-gray-200 transition"
                  >
                    🌐 Site
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ: CONTATO + GERENCIAMENTO */}
        <div className="border-t border-gray-100 p-5 flex flex-col sm:flex-row gap-3 bg-gray-50/50">
          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 bg-green-500 text-white rounded-2xl font-semibold text-center no-underline hover:bg-green-600 transition text-base flex items-center justify-center gap-2"
            >
              💬 Conversar no WhatsApp
            </a>
          ) : (
            <div className="flex-1 py-3.5 text-center text-gray-400 bg-gray-100 rounded-2xl">
              Nenhum contato disponível
            </div>
          )}

          {canManage && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigate(`/editar-servico/${servico.id}`)}
                className="px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition cursor-pointer"
              >
                ✏️ Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-3.5 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition cursor-pointer"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServicoDetalhePage