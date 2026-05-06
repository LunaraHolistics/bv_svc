// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth.jsx'

import Header from './components/Header'

import HomePage from './pages/HomePage'
import MapaPage from './pages/MapaPage'
import ServicosPage from './pages/ServicosPage'
import IndicacoesPage from './pages/IndicacoesPage'
import AnunciosPage from './pages/AnunciosPage'
import NovoAnuncioPage from './pages/NovoAnuncioPage'
import EditarAnuncioPage from './pages/EditarAnuncioPage'
import LoginPage from './pages/LoginPage'
import PerfilPage from './pages/PerfilPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

function AppLayout() {
  const location = useLocation()
  const authPages = ['/login', '/reset-password']
  const isAuthPage = authPages.includes(location.pathname)

  return (
    <div className="min-h-screen bg-[#f6f8f7] flex flex-col relative overflow-hidden">

      {/* background decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] right-[-120px] w-[420px] h-[420px] bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[-150px] w-[350px] h-[350px] bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      {!isAuthPage && <Header />}

      <main className="flex-1 relative z-10">
        <div className={`${isAuthPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10'}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/servicos" element={<ServicosPage />} />
            <Route path="/indicacoes" element={<IndicacoesPage />} />
            <Route path="/anuncios" element={<AnunciosPage />} />
            <Route path="/novo-anuncio" element={<NovoAnuncioPage />} />
            <Route path="/editar-anuncio/:id" element={<PrivateRoute><EditarAnuncioPage /></PrivateRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      {!isAuthPage && (
        <footer className="relative z-10 mt-10 border-t border-white/50 bg-white/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6 text-center">
            <p className="text-sm text-gray-500">
              BV Service • Condomínio Bella Vittà
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Classificados, serviços e conexões entre moradores
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App