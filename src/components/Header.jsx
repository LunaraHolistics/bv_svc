// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

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
  const dropdownRef = useRef(null)

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <>
      {/* ===== DESKTOP ===== */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">

            {/* LOGO */}
            <NavLink
              to="/"
              className="flex items-center gap-3 no-underline"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <span className="text-white font-bold text-sm">
                  BV
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Bella Vittà
                </p>
                <p className="text-xs text-gray-400">
                  Marketplace interno
                </p>
              </div>
            </NavLink>

            {/* NAVEGAÇÃO */}
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const active = isActive(item.to)

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition no-underline ${
                      active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon
                      path={item.icon}
                      active={active}
                    />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>

            {/* AÇÕES */}
            <div className="flex items-center gap-3">

              <NavLink
                to="/novo-anuncio"
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-sm font-semibold shadow-md hover:scale-[1.02] transition no-underline"
              >
                + Anunciar
              </NavLink>

              {!loading && user ? (
                <div
                  className="relative"
                  ref={dropdownRef}
                >
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-2 py-2 rounded-xl transition cursor-pointer"
                  >
                    {perfil?.avatar_url ? (
                      <img
                        src={perfil.avatar_url}
                        alt="Avatar"
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                        {initials}
                      </div>
                    )}
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">

                      <button
                        onClick={irPerfil}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        Meu perfil
                      </button>

                      <button
                        onClick={() => navigate('/novo-anuncio')}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer"
                      >
                        Novo anúncio
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition cursor-pointer"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE ===== */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pb-[env(safe-area-inset-bottom)]">
        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl px-1.5 py-2">
          <div className="flex items-center justify-between">

            {navItems.slice(0, 2).map((item) => {
              const active = isActive(item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="flex flex-col items-center flex-1 no-underline"
                >
                  <span className={`text-lg ${active ? 'scale-110' : 'opacity-70'} transition-transform`}>
                    {item.emoji}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </NavLink>
              )
            })}

            {/* BOTÃO FLUTUANTE */}
            <NavLink
              to="/novo-anuncio"
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-xl -mt-7 no-underline"
            >
              +
            </NavLink>

            {navItems.slice(2, 4).map((item) => {
              const active = isActive(item.to)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center flex-1 no-underline"
                >
                  <span className={`text-lg ${active ? 'scale-110' : 'opacity-70'} transition-transform`}>
                    {item.emoji}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </NavLink>
              )
            })}

            {/* PERFIL / ENTRAR */}
            <button
              onClick={() => navigate(user ? '/perfil' : '/login')}
              className="flex flex-col items-center flex-1 cursor-pointer"
            >
              {user ? (
                <>
                  {perfil?.avatar_url ? (
                    <img
                      src={perfil.avatar_url}
                      alt="Avatar"
                      className="w-5 h-5 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-emerald-700">
                        {initials}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] mt-0.5 text-gray-400">
                    Perfil
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg opacity-70">🔐</span>
                  <span className="text-[10px] mt-0.5 text-emerald-600 font-semibold">
                    Entrar
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ESPAÇO MOBILE */}
      <div className="md:hidden h-28" />
    </>
  )
}

export default Header