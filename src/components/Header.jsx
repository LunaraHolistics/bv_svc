// src/components/Header.jsx
import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const links = [
  {
    to: '/',
    label: 'Início',
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  },
  {
    to: '/servicos',
    label: 'Serviços',
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L3.5 12.9m2.82-2.83L3.5 7.25m5.1 5.1L13.5 7.25m-2.08 7.92l5.1-5.1m0 0l2.82 2.83m-2.82-2.83l2.82-2.83" /></svg>,
  },
  {
    to: '/indicacoes',
    label: 'Indicações',
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  },
  {
    to: '/mapa',
    label: 'Mapa',
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  },
  {
    to: '/anuncios',
    label: 'Anúncios',
    icon: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>,
  },
]

const Header = () => {
  const [menuAberto, setMenuAberto] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, perfil, logout, loading } = useAuth()

  useEffect(() => { setMenuAberto(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials = perfil?.nome_exibicao?.charAt(0) || perfil?.nome_completo?.charAt(0) || '?'

  return (
    <header className="sticky top-0 z-50">
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[56px]">
            <NavLink to="/" className="flex items-center gap-2.5 no-underline group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-white font-extrabold text-xs tracking-tight">BV</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-white" />
              </div>
              <div className="leading-none">
                <span className="font-bold text-gray-900 text-sm block tracking-tight">BV Service</span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Bella Vittà</span>
              </div>
            </NavLink>

            {/* Desktop */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {links.map(link => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all no-underline ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'}`
                  }
                >
                  {link.icon} {link.label}
                </NavLink>
              ))}

              <NavLink to="/novo-anuncio"
                className="inline-flex items-center gap-1.5 ml-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[13px] font-medium shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all no-underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Anunciar
              </NavLink>

              <div className="ml-2 border-l border-gray-200 pl-2">
                {loading ? (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
                ) : user ? (
                  <div className="flex items-center gap-2">
                    <NavLink to="/login" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors no-underline">
                      {perfil?.avatar_url ? (
                        <img src={perfil.avatar_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-700 text-[11px] font-bold">{initials}</span>
                        </div>
                      )}
                      <span className="text-xs text-gray-700 font-medium max-w-[80px] truncate">
                        {perfil?.nome_exibicao || perfil?.nome_completo?.split(' ')[0] || 'Morador'}
                      </span>
                    </NavLink>
                    <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sair">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                    </button>
                  </div>
                ) : (
                  <NavLink to="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-[13px] font-medium transition-all no-underline"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    Entrar
                  </NavLink>
                )}
              </div>
            </nav>

            {/* Mobile */}
            <div className="lg:hidden flex items-center gap-1">
              {!loading && !user && (
                <NavLink to="/login" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 no-underline">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </NavLink>
              )}
              {user && (
                <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                </button>
              )}
              <button onClick={() => setMenuAberto(!menuAberto)} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-colors" aria-label="Menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  {menuAberto ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuAberto && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setMenuAberto(false)} />
          <nav className="lg:hidden fixed top-[57px] left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-200/60 p-2 flex flex-col gap-0.5">
            {links.map(link => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors no-underline ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {link.icon} {link.label}
              </NavLink>
            ))}
            <div className="border-t border-gray-100 my-1" />
            <NavLink to="/novo-anuncio" className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium no-underline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Anunciar
            </NavLink>
            {user && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-700 text-xs font-bold">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{perfil?.nome_exibicao || perfil?.nome_completo?.split(' ')[0] || 'Morador'}</p>
                    <p className="text-[11px] text-gray-400">Logado</p>
                  </div>
                </div>
              </>
            )}
          </nav>
        </>
      )}
    </header>
  )
}

export default Header