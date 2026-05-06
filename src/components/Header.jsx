// src/components/Header.jsx
import React, { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/', label: 'Início', icon: '🏠' },
  { to: '/servicos', label: 'Serviços', icon: '🛠️' },
  { to: '/indicacoes', label: 'Indicações', icon: '👥' },
  { to: '/mapa', label: 'Mapa', icon: '📍' },
  { to: '/anuncios', label: 'Anúncios', icon: '📢' },
]

const desktopIcons = {
  '/': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2.25 12l8.954-8.955a2.126 2.126 0 013.020 0H19.5a2.126 2.126 0 013.020-0H4.5a2.126 2.126 0 01-3.020 0L2.25 12z" /></svg>,
  '/servicos': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11.42 15.17L5.1 5.1m0 0L3.5 12.9m2.82-2.83L3.5 7.25m5.1 5.1L13.5 7.25m-2.08 7.92l5.1-5.1m0 0l2.82 2.82m-2.82-2.82l2.82-2.82" /></svg>,
  '/indicacoes': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  '/mapa': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  '/anuncios': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>,
}

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, perfil, logout, loading: authLoading } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const initials =
    perfil?.nome_exibicao?.charAt(0) ||
    perfil?.nome_completo?.charAt(0) ||
    '?'

  const sairIcon = <svg className="w-4 h-4 text-gray-300 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>

  const loginIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>

  return (
    <>
      {/* ===== DESKTOP ===== */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-[58px]">

            <NavLink to="/" className="flex items-center gap-2.5 no-underline group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <span className="text-white font-extrabold text-xs">BV</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-white" />
              </div>
              <div className="leading-none">
                <span className="font-bold text-gray-900 text-[13px] block tracking-tight">BV Service</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Bella Vittà</span>
              </div>
            </NavLink>

            <nav className="flex items-center gap-1">
              {navItems.map((item, idx) => {
                const active = isActive(item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={`px-3 py-2 rounded-xl text-sm font-medium no-underline transition-all duration-200 no-underline ${
                      active
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1.5">{desktopIcons[item.to]}</span>
                    {item.label}
                  </NavLink>
                )
              })}

              <div className="w-px h-6 bg-gray-200 mx-2" />

              <NavLink
                to="/novo-anuncio"
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-[13px] font-semibold hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg hover:shadow-emerald-200/40 transition-all duration-200 no-underline active:scale-[0.98] active:shadow-lg active:shadow-emerald-200/40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span>Anunciar</span>
              </NavLink>

              <div className="ml-2 pl-2 border-l border-gray-200">
                {authLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                ) : user ? (
                  <button
                    onClick={() => navigate('/perfil')}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-all duration-150"
                  >
                    {perfil?.avatar_url ? (
                      <img src={perfil.avatar_url} alt="Avatar" className="w-8 h-8 rounded-xl object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 ring-2 ring-emerald-200 flex items-center justify-center">
                        <span className="text-emerald-700 text-xs font-bold">{initials}</span>
                      </div>
                    )}
                    <p className="hidden lg:block text-[12px] font-medium text-gray-700 max-w-[90px] truncate leading-tight">
                      {perfil?.nome_exibicao || perfil?.nome_completo?.split(' ')[0] || 'Morador'}
                    </p>
                    {sairIcon}
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    className="px-3 py-2 text-gray-500 hover:text-gray-900 no-underline"
                  >
                    {loginIcon}
                    <span className="hidden sm:inline">Entrar</span>
                  </NavLink>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/60">
        <div className="h-[env(safe-area-inset-bottom)]" />
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/60 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-1 pt-1 pb-2">
            {navItems.map((item, idx) => {
              const active = isActive(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={`flex flex-col items-center text-xs no-underline transition-all duration-200 no-underline ${active ? 'text-emerald-600' : 'text-gray-400'}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </NavLink>
              )
            })}

            <NavLink
              to="/novo-anuncio"
              className="flex flex-col items-center text-emerald-600 no-underline"
            >
              <span className="text-lg">➕</span>
              <span className="text-[10px] font-semibold leading-none text-emerald-600">Anunciar</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="md:hidden h-[70px]" />
    </>
  )
}

export default Header