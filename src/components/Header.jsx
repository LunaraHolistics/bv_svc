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
      <path d="M18 18.72a9 9 0 003.74-.48 3 3 0 00-4.68-2.72M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm-9 3a2.25 2.25 0 11-4.5 0A2.25 2.25 0 016 9.75z" />
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

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const {
    user,
    perfil,
    logout,
    loading
  } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [naoLidas, setNaoLidas] = useState([])
  
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  // Esconde o menu interno em páginas de login/admin
  const hideChrome = ['/login', '/reset-password', '/admin', '/adm_bv'].includes(location.pathname)

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
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
        .select('id, titulo, mensagem, created_at, data_fim')
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
        .select('aviso_id')
        .eq('user_id', user.id)

      const idsLidos = new Set((lidos || []).map(l => l.aviso_id))
      const pendentes = data.filter(d => !idsLidos.has(d.id))
      setNaoLidas(pendentes)
    }

    fetchNotificacoes()

    const subscription = supabase
      .channel('avisos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'avisos_admin' }, fetchNotificacoes)
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user])

  const marcarComoLido = async (avisoId) => {
    if (!user) return
    await supabase
      .from('avisos_lidos')
      .upsert({ aviso_id: avisoId, user_id: user.id }, { onConflict: 'aviso_id,user_id' })
    
    setNaoLidas(prev => prev.filter(n => n.id !== avisoId))
  }

  const marcarTodasComoLidas = async () => {
    if (!user || naoLidas.length === 0) return
    
    const registros = naoLidas.map(aviso => ({ aviso_id: aviso.id, user_id: user.id }))
    
    const { error } = await supabase
      .from('avisos_lidos')
      .upsert(registros, { onConflict: 'aviso_id,user_id' })

    if (!error) {
      setNaoLidas([])
    }
  }

  // ✅ NOVA FUNÇÃO: Compartilhar Link
  const handleShare = async () => {
    const urlParaCompartilhar = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BV Service - Bella Vittà',
          text: 'Confira os serviços e anúncios do nosso condomínio!',
          url: urlParaCompartilhar
        })
      } catch (err) {
        console.error('Erro ao compartilhar:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(urlParaCompartilhar)
        alert('✅ Link copiado para a área de transferência!\n\nCole no WhatsApp ou envie para outro morador. Ao abrir, a pessoa verá exatamente esta tela que você está vendo.')
      } catch (err) {
        prompt("Copie o link manualmente:", urlParaCompartilhar)
      }
    }
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const irPerfil = () => {
    setMenuOpen(false)
    navigate('/perfil')
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avisoMaisRecente = naoLidas.length > 0 ? naoLidas[0] : null

  // Se for página de login/admin, não renderiza nada
  if (hideChrome) return null

  return (
    <>
      {/* WRAPPER STICKY: Garante que Menu + Barra Amarela fiquem grudados no topo juntos */}
      <div className="sticky top-0 z-50">
        
        {/* ===== DESKTOP ===== */}
        <header className="hidden md:block bg-white/85 backdrop-blur-xl border-b border-gray-200/60">
          <div className="max-w-7xl mx-auto px-6">
            <div className="h-16 flex items-center justify-between">
              <NavLink to="/" className="flex items-center gap-3 no-underline">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                  <span className="text-white font-bold text-sm">BV</span>
                </div>
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

                {/* ✅ NOVO: Botão Compartilhar Desktop */}
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
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[60]">
                          <div className="p-3 bg-gray-50 border-b font-semibold text-sm text-gray-700 flex justify-between items-center">
                            <span>Avisos da Administração</span>
                            {naoLidas.length > 0 && (
                              <button onClick={marcarTodasComoLidas} className="text-xs text-emerald-600 font-medium hover:underline cursor-pointer">Marcar todas como lidas</button>
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
          <div className="bg-amber-50 border-b border-amber-200 animate-[slideDown_0.3s_ease-out]">
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
                Marcar como lido
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

            {/* ✅ NOVO: Botão Compartilhar Mobile */}
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

      <div className="md:hidden h-28" />
    </>
  )
}

export default Header