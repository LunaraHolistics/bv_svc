// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth.jsx'

import Header from './components/Header'

import HomePage from './pages/HomePage'
import MapaPage from './pages/MapaPage'
import IndicacoesPage from './pages/IndicacoesPage'
import AnunciosPage from './pages/AnunciosPage'
import AnuncioDetailPage from './pages/AnuncioDetailPage'
import NovoAnuncioPage from './pages/NovoAnuncioPage'
import EditarAnuncioPage from './pages/EditarAnuncioPage'
import LoginPage from './pages/LoginPage'
import PerfilPage from './pages/PerfilPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PainelAdminPage from './pages/PainelAdminPage'
import NotFoundPage from './pages/NotFoundPage'

// ⚠️ COLE AQUI O SEU ID DE USUÁRIO MASTER DO SUPABASE
const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Verificando permissões...</div>
  if (!user || user.id !== MASTER_USER_ID) return <Navigate to="/" replace />

  return children
}

function AppContent() {
  const location = useLocation()
  const hideChrome = ['/login', '/reset-password', '/admin'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-[#f6f8f7] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] right-[-120px] w-[420px] h-[420px] bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[-150px] w-[350px] h-[350px] bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      {!hideChrome && <Header />}

      <main className="flex-1 relative z-10">
        <div className={hideChrome ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10'}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/servicos" element={<Navigate to="/mapa" replace />} />
            <Route path="/indicacoes" element={<IndicacoesPage />} />
            <Route path="/anuncios" element={<AnunciosPage />} />
            <Route path="/anuncio/:id" element={<AnuncioDetailPage />} />
            <Route path="/novo-anuncio" element={<NovoAnuncioPage />} />
            <Route path="/editar-anuncio/:id" element={<EditarAnuncioPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* ATENÇÃO: ESTÁ ROTA PRECISA FICAR ANTES DO path="*" */}
            <Route path="/admin" element={<AdminRoute><PainelAdminPage /></AdminRoute>} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>

      {!hideChrome && (
        <footer className="relative z-10 mt-10 border-t border-white/50 bg-white/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6 text-center">
            <p className="text-sm text-gray-500">BV Service • Condomínio Bella Vittà</p>
            <p className="text-xs text-gray-400 mt-1">Classificados, serviços e conexões entre moradores</p>
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
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App