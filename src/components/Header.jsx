// src/components/Header.jsx
import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const links = [
  {
    to: '/',
    label: 'Mapa',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
  },
  {
    to: '/anuncios',
    label: 'Anúncios',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    to: '/novo-anuncio',
    label: 'Anunciar',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    highlight: true,
  },
]

const Header = () => {
  const [menuAberto, setMenuAberto] = useState(false)
  const location = useLocation()

  // Fechar menu ao mudar de rota
  React.useEffect(() => {
    setMenuAberto(false)
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-50">
      {/* Barra de destaque topo */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />

      {/* Fundo com blur */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 no-underline group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-white font-extrabold text-sm tracking-tight">BV</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-teal-400 rounded-full border-2 border-white" />
              </div>
              <div className="leading-none">
                <span className="font-bold text-gray-900 text-[15px] block tracking-tight">
                  BV Service
                </span>
                <span className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
                  Classificados
                </span>
              </div>
            </NavLink>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all no-underline ${
                      link.highlight
                        ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md'
                        : isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                    }`
                  }
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100/60 transition-colors"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                {menuAberto ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {menuAberto && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setMenuAberto(false)}
          />

          {/* Drawer */}
          <nav className="md:hidden fixed top-[61px] left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-200/60 p-2 flex flex-col gap-0.5">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors no-underline ${
                    link.highlight
                      ? 'bg-emerald-600 text-white'
                      : isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </nav>
        </>
      )}
    </header>
  )
}

export default Header