// ============================================================================
// ARQUIVO COMPLETO: src/components/Header.jsx
// ----------------------------------------------------------------------------
// ✅ COMPARTILHAR CORRIGIDO (definitivamente):
// O painel cinza que "abria e sumia" era o painel NATIVO do Windows/Edge
// (navigator.share) falhando no desktop — e como o erro vinha como
// AbortError/OperationError, o código anterior ficava em silêncio.
//
// NOVO COMPORTAMENTO:
//   • Em DESKTOP (pointer: fine) o navigator.share NUNCA é chamado.
//     Em vez disso, abre um PAINEL PRÓPRIO dentro do app (sempre funciona),
//     com opções: Copiar link, WhatsApp, Telegram e E-mail.
//   • Em CELULAR/Tablet (pointer: coarse) tenta o compartilhamento nativo;
//     se falhar (e não for cancelamento do usuário), abre o painel próprio.
//   • Cópia de link com tríplice fallback: Clipboard API → execCommand → prompt.
//   • Feedback visual "✅ Link copiado!" dentro do painel (sem alert bloqueado).
//
// DEMAIS ALTERAÇÕES MANTIDAS:
//   • Logo icone.png no lugar do quadrado "BV" (salvar em public/icone.png).
//   • marcarTodasComoLidas corrigida (aviso_id: aviso.id).
//   • Comentários originais (✅ CORREÇÃO) preservados.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Share2 } from 'lucide-react'

const navItems = [
  {
    to: '/',
    label: 'Início',
    emoji: '🏠',
    icon: (
      <path d="M3 10.5L12 3l9 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-9z" />
    )
  },
  {
    to: '/mapa',
    label: 'Serviços',
    emoji: '🛠️',
    icon: (
      <path d="M14.25 6.75l3 3m0-3l-3 3M4.5 19.5l6.75-6.75m0 0l4.5-4.5a2.121 2.121 0 10-3-3l-4.5 4.5m3 3l-3-3" />
    )
  },
  {
    to: '/indicacoes',
    label: 'Indicações',
    emoji: '👥',
    icon: (
      <path d="M18 18.72a9 9 0 003.74-.48 3 3 0 00-4.68-2.72M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm-9 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 016 9.75z" />
    )
  },
  {
    to: '/anuncios',
    label: 'Anúncios',
    emoji: '📢',
    icon: (
      <path d="M7.5 6h9m-9 6h9m-9 6h6" />
    )
  }
]

const Icon = ({ path, active = false }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={active ? 'text-emerald-600' : ''}
  >
    {path}
  </svg>
)

/* ---------------------------------------------------------------------------
   ✅ HELPERS DE COMPARTILHAMENTO / CÓPIA
--------------------------------------------------------------------------- */

// Copia texto com fallback duplo: Clipboard API (HTTPS) → execCommand (legacy)
const copiarParaAreaDeTransferencia = async (texto) => {
  // 1) API moderna — disponível apenas em contexto seguro (HTTPS/localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch (err) {
      console.error('Clipboard API falhou, tentando fallback legacy:', err)
    }
  }

  // 2) Fallback legacy — funciona mesmo sem HTTPS
  try {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.focus()
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch (err) {
    console.error('Fallback legacy de cópia falhou:', err)
    return false
  }
}

// Detecta dispositivo touch (celular/tablet) vs desktop
const ehDispositivoTouch = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { user, perfil, logout, loading } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [naoLidas, setNaoLidas] = useState([])
  const [shareOpen, setShareOpen] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)
  const shareModalRef = useRef(null)

  const hideChrome = ['/login', '/reset-password', '/admin', '/adm_bv'].includes(location.pathname)

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const initials =
    perfil?.nome_exibicao?.trim()?.charAt(0)?.toUpperCase() ||
    perfil?.nome_completo?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'U'

 useEffect(() => {
    if (!user) return
    
    const fetchNotificacoes = async () => {
      const agora = new Date().toISOString()
      
      const { data } = await supabase
        .from('avisos_admin')
        .select('id, titulo, mensagem, created_at, data_fim, reativado_em')
        .eq('ativo', true)
        .or(`data_fim.is.null,data_fim.gte.${agora}`)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!data || data.length === 0) {
        setNaoLidas([])
        return
      }

      const { data: lidos } = await supabase
        .from('avisos_lidos')
        .select('aviso_id, lido_em, created_at')
        .eq('user_id', user.id)

      // Mapa: aviso_id -> data da ÚLTIMA leitura deste morador
      const mapaLidos = new Map((lidos || []).map(l => [l.aviso_id, l.lido_em || l.created_at]))

      // ✅ CORREÇÃO REATIVAÇÃO: aviso é "não lido" quando:
      //   a) não há registro de leitura, OU
      //   b) a última leitura é ANTERIOR ao início do ciclo atual (reativado_em),
      //      ou seja, o morador leu no ciclo passado e o aviso foi reativado.
      const pendentes = data.filter(d => {
        const quandoLeu = mapaLidos.get(d.id)
        if (!quandoLeu) return true
        const inicioCiclo = d.reativado_em || d.data_inicio || d.created_at
        return new Date(quandoLeu) < new Date(inicioCiclo)
      })
      setNaoLidas(pendentes)
    }

    fetchNotificacoes()

    const subscription = supabase
      .channel('avisos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos_admin' }, fetchNotificacoes)
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [user])

  const marcarComoLido = async (avisoId) => {
    if (!user) return
    // ✅ lido_em = agora: registra QUANDO viu (atualiza a cada leitura/ciclo)
    await supabase
      .from('avisos_lidos')
      .upsert(
        { aviso_id: avisoId, user_id: user.id, lido_em: new Date().toISOString() },
        { onConflict: 'aviso_id,user_id' }
      )
    setNaoLidas(prev => prev.filter(n => n.id !== avisoId))
  }

  const marcarTodasComoLidas = async () => {
    if (!user || naoLidas.length === 0) return
    const agoraIso = new Date().toISOString()
    const registros = naoLidas.map(aviso => ({ aviso_id: aviso.id, user_id: user.id, lido_em: agoraIso }))
    const { error } = await supabase.from('avisos_lidos').upsert(registros, { onConflict: 'aviso_id,user_id' })
    if (!error) setNaoLidas([])
  }

  /* ------------------------------------------------------------------
     ✅ COMPARTILHAR — CORRIGIDO
     Desktop: NUNCA chama navigator.share (painel do Windows abre vazio
     e some). Abre direto o painel próprio do app.
     Touch: tenta nativo; se falhar (menos cancelamento), painel próprio.
  ------------------------------------------------------------------ */
  const handleShare = async () => {
    const urlParaCompartilhar = window.location.href
    const dadosShare = {
      title: 'BV Service - Bella Vittà',
      text: 'Confira os serviços e anúncios do nosso condomínio!',
      url: urlParaCompartilhar
    }

    if (ehDispositivoTouch() && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(dadosShare)
        return // ✅ compartilhou pelo painel nativo do celular
      } catch (err) {
        // Usuário cancelou o painel nativo → encerra sem fallback
        if (err && err.name === 'AbortError') return
        console.error('Web Share API falhou, abrindo painel próprio:', err)
      }
    }

    // Desktop OU falha do nativo → painel próprio (sempre funciona)
    setLinkCopiado(false)
    setShareOpen(true)
  }

  const copiarLink = async () => {
    const ok = await copiarParaAreaDeTransferencia(window.location.href)
    if (ok) {
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2500)
    } else {
      window.prompt('Não foi possível copiar automaticamente.\nCopie o link manualmente:', window.location.href)
    }
  }

  const compartilharWhatsApp = () => {
    const url = window.location.href
    const texto = 'Confira os serviços e anúncios do condomínio Bella Vittà: ' + url
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener,noreferrer')
  }

  const compartilharTelegram = () => {
    const url = window.location.href
    const texto = 'Confira os serviços e anúncios do condomínio Bella Vittà!'
    window.open(
      'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(texto),
      '_blank',
      'noopener,noreferrer'
    )
  }

  const compartilharEmail = () => {
    const url = window.location.href
    window.location.href =
      'mailto:?subject=' + encodeURIComponent('BV Service - Bella Vittà') +
      '&body=' + encodeURIComponent('Confira os serviços e anúncios do nosso condomínio: ' + url)
  }

  const handleLogout = async () => { setMenuOpen(false); await logout(); navigate('/login', { replace: true }) }
  const irPerfil = () => { setMenuOpen(false); navigate('/perfil') }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false)
      // Fecha o painel de compartilhar ao clicar fora dele
      if (shareModalRef.current && !shareModalRef.current.contains(event.target)) setShareOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avisoMaisRecente = naoLidas.length > 0 ? naoLidas[0] : null

  if (hideChrome) return null

  return (
    <>
      <div className="sticky top-0 z-50">
        
        {/* ===== DESKTOP ===== */}
        <header className="hidden md:block bg-white/85 backdrop-blur-xl border-b border-gray-200/60">
          <div className="max-w-7xl mx-auto px-6">
            <div className="h-16 flex items-center justify-between">
              <NavLink to="/" className="flex items-center gap-3 no-underline">
                {/* ✅ ALTERAÇÃO: logo icone.png no lugar do quadrado com "BV" */}
                <img
                  src="/icone.png"
                  alt="Logo Bella Vittà"
                  className="w-10 h-10 rounded-2xl object-contain bg-white p-0.5 shadow-lg shadow-emerald-200/50"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">Bella Vittà</p>
                  <p className="text-xs text-gray-400">Marketplace interno</p>
                </div>
              </NavLink>

              <nav className="flex items-center gap-2">
                {navItems.map((item) => {
                  const active = isActive(item.to)
                  return (
                    <NavLink key={item.to} to={item.to} end={item.to === '/'} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition no-underline ${active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <Icon path={item.icon} active={active} />
                      {item.label}
                    </NavLink>
                  )
                })}
              </nav>

              <div className="flex items-center gap-3">
                <NavLink to="/novo-anuncio" className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-sm font-semibold shadow-md hover:scale-[1.02] transition no-underline">
                  + Anunciar
                </NavLink>

                <button onClick={handleShare} title="Compartilhar esta página" className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                  <Share2 size={20} className="text-gray-600" />
                </button>

                {!loading && user ? (
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={notifRef}>
                      <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition cursor-pointer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                        {naoLidas.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">{naoLidas.length}</span>
                        )}
                      </button>

                      {notifOpen && (
                        // ✅ CORREÇÃO: w-80 forçava 320px e estourava em telas pequenas. Agora é responsivo.
                        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[60]">
                          <div className="p-3 bg-gray-50 border-b font-semibold text-sm text-gray-700 flex justify-between items-center">
                            <span>Avisos da Administração</span>
                            {naoLidas.length > 0 && (
                              <button onClick={marcarTodasComoLidas} className="text-xs text-emerald-600 font-medium hover:underline cursor-pointer shrink-0 ml-2">Ler todas</button>
                            )}
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {naoLidas.length === 0 ? (
                              <p className="p-4 text-sm text-gray-400 text-center">Nenhuma notificação nova 🎉</p>
                            ) : (
                              naoLidas.map(aviso => (
                                <div key={aviso.id} className="p-3 border-b hover:bg-gray-50 transition">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="text-sm font-medium text-gray-900">{aviso.titulo || 'Aviso'}</p>
                                    {aviso.data_fim && (
                                      <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full shrink-0">Até {new Date(aviso.data_fim).toLocaleDateString('pt-BR')}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{aviso.mensagem}</p>
                                  <button onClick={() => marcarComoLido(aviso.id)} className="text-xs text-blue-500 mt-2 hover:underline cursor-pointer">Marcar como lido</button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative" ref={dropdownRef}>
                      <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-2 py-2 rounded-xl transition cursor-pointer">
                        {perfil?.avatar_url ? (
                          <img src={perfil.avatar_url} alt="Avatar" className="w-8 h-8 rounded-xl object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{initials}</div>
                        )}
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[60]">
                          <button onClick={irPerfil} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer">Meu perfil</button>
                          <button onClick={() => navigate('/novo-anuncio')} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer">Novo anúncio</button>
                          {(perfil?.is_admin_condominio) && (
                            <button onClick={() => { setMenuOpen(false); navigate('/adm_bv') }} className="w-full text-left px-4 py-3 text-sm hover:bg-orange-50 text-orange-600 cursor-pointer font-medium">🏢 Painel Adm. Condomínio</button>
                          )}
                          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer">Sair</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => navigate('/login')} className="px-5 py-2.5 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition cursor-pointer">Entrar</button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ===== BARRA AMARELA GLOBAL ===== */}
        {avisoMaisRecente && user && (
          // ✅ CORREÇÃO: Adicionado safe-area-top para não ficar por baixo da "notch" de celulares newer
          <div className="bg-amber-50 border-b border-amber-200 animate-[slideDown_0.3s_ease-out] pt-[env(safe-area-inset-top)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0">📢</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-800 truncate">
                    Aviso da Administração {naoLidas.length > 1 ? `(${naoLidas.length} novos)` : '(Novo)'}
                  </p>
                  <p className="text-xs text-amber-600 truncate hidden sm:block">
                    {avisoMaisRecente.titulo}: {avisoMaisRecente.mensagem}
                  </p>
                  <p className="text-xs text-amber-600 truncate sm:hidden">
                    {avisoMaisRecente.titulo}
                  </p>
                </div>
              </div>
              <button
                onClick={marcarTodasComoLidas}
                className="shrink-0 px-4 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-800 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== MOBILE (MENU INFERIOR) ===== */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pb-[env(safe-area-inset-bottom)]">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl px-1.5 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const active = isActive(item.to)
              return (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className="flex flex-col items-center flex-1 no-underline">
                  <span className={`text-lg ${active ? 'scale-110' : 'opacity-70'} transition-transform`}>{item.emoji}</span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>{item.label}</span>
                </NavLink>
              )
            })}

            <button onClick={handleShare} className="flex flex-col items-center flex-1 cursor-pointer">
              <span className="text-lg opacity-70">📤</span>
              <span className="text-[10px] mt-0.5 text-gray-400">Compartilhar</span>
            </button>

            <div className="flex flex-col items-center flex-1 relative">
              {user && naoLidas.length > 0 && (
                <span className="absolute -top-1 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center z-20">{naoLidas.length}</span>
              )}
              <button onClick={() => navigate(user ? '/perfil' : '/login')} className="flex flex-col items-center cursor-pointer">
                {user ? (
                  <>
                    {perfil?.avatar_url ? (
                      <img src={perfil.avatar_url} alt="Avatar" className="w-5 h-5 rounded-lg object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-emerald-700">{initials}</span>
                      </div>
                    )}
                    <span className="text-[10px] mt-0.5 text-gray-400">Perfil</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg opacity-70">🔐</span>
                    <span className="text-[10px] mt-0.5 text-emerald-600 font-semibold">Entrar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Espaçamento para a barra inferior não cobrir o conteúdo */}
      <div className="md:hidden h-28" />

      {/* ===== PAINEL PRÓPRIO DE COMPARTILHAR (fallback garantido) ===== */}
      {shareOpen && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            ref={shareModalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Compartilhar</h2>
              <button
                onClick={() => setShareOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
                aria-label="Fechar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 space-y-1">
              <button
                onClick={copiarLink}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer text-left transition"
              >
                <span className="text-lg">📋</span>
                <span className={`text-sm font-medium ${linkCopiado ? 'text-emerald-600' : 'text-gray-800'}`}>
                  {linkCopiado ? '✅ Link copiado!' : 'Copiar link'}
                </span>
              </button>

              <button
                onClick={compartilharWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer text-left transition"
              >
                <span className="text-lg">💬</span>
                <span className="text-sm font-medium text-gray-800">WhatsApp</span>
              </button>

              <button
                onClick={compartilharTelegram}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer text-left transition"
              >
                <span className="text-lg">✈️</span>
                <span className="text-sm font-medium text-gray-800">Telegram</span>
              </button>

              <button
                onClick={compartilharEmail}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer text-left transition"
              >
                <span className="text-lg">✉️</span>
                <span className="text-sm font-medium text-gray-800">E-mail</span>
              </button>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 break-all">{window.location.href}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Header