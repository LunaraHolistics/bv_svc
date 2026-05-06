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

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, perfil, logout, loading: authLoading } = useAuth()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    // reservado para ações futuras no mobile menu
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials =
    perfil?.nome_exibicao?.charAt(0) ||
    perfil?.nome_completo?.charAt(0) ||
    '?'

  return (
    <>
      {/* DESKTOP */}
      <header className="hidden md:block sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-[58px]">

            {/* Logo */}
            <NavLink
              to="/"
              className="flex items-center gap-2.5 no-underline group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <span className="text-white font-bold text-xs">BV</span>
              </div>

              <div className="leading-none">
                <span className="font-bold text-gray-900 text-[13px] block">
                  BV Service
                </span>
                <span className="text-[10px] text-gray-400 uppercase">
                  Bella Vittà
                </span>
              </div>
            </NavLink>

            {/* Navegação */}
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const active = isActive(item.to)

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={`px-3 py-2 rounded-xl text-sm no-underline ${
                      active
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </NavLink>
                )
              })}

              <NavLink
                to="/novo-anuncio"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl no-underline"
              >
                Anunciar
              </NavLink>

              {/* Usuário */}
              <div className="ml-2 pl-2 border-l border-gray-200">
                {authLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                ) : user ? (
                  <button
                    onClick={() => navigate('/perfil')}
                    className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-gray-50"
                  >
                    {perfil?.avatar_url ? (
                      <img
                        src={perfil.avatar_url}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 text-xs font-bold">
                          {initials}
                        </span>
                      </div>
                    )}
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    className="px-3 py-2 text-gray-500 hover:text-gray-900 no-underline"
                  >
                    Entrar
                  </NavLink>
                )}
              </div>
            </nav>

          </div>
        </div>
      </header>

      {/* MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const active = isActive(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={`flex flex-col items-center text-xs no-underline ${
                  active ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          })}

          <NavLink
            to="/novo-anuncio"
            className="flex flex-col items-center text-xs text-emerald-600 no-underline"
          >
            <span>➕</span>
            <span>Anunciar</span>
          </NavLink>
        </div>
      </nav>

      {/* espaço para mobile nav */}
      <div className="md:hidden h-[70px]" />
    </>
  )
}

export default Header