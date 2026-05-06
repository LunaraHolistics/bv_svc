import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth.jsx'

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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-gray-50 flex flex-col">

          {/* HEADER */}
          <Header />

          {/* MAIN */}
          <main className="flex-1 w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* páginas internas continuam centralizadas */}
              <Route
                path="/mapa"
                element={
                  <div className="max-w-6xl mx-auto px-4 py-8">
                    <MapaPage />
                  </div>
                }
              />

              <Route
                path="/servicos"
                element={
                  <div className="max-w-6xl mx-auto px-4 py-8">
                    <ServicosPage />
                  </div>
                }
              />

              <Route
                path="/indicacoes"
                element={
                  <div className="max-w-6xl mx-auto px-4 py-8">
                    <IndicacoesPage />
                  </div>
                }
              />

              <Route
                path="/anuncios"
                element={
                  <div className="max-w-6xl mx-auto px-4 py-8">
                    <AnunciosPage />
                  </div>
                }
              />

              <Route
                path="/novo-anuncio"
                element={
                  <div className="max-w-4xl mx-auto px-4 py-8">
                    <NovoAnuncioPage />
                  </div>
                }
              />

              <Route
                path="/editar-anuncio/:id"
                element={
                  <div className="max-w-4xl mx-auto px-4 py-8">
                    <EditarAnuncioPage />
                  </div>
                }
              />

              <Route
                path="/perfil"
                element={
                  <div className="max-w-4xl mx-auto px-4 py-8">
                    <PerfilPage />
                  </div>
                }
              />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
          </main>

          {/* FOOTER */}
          <footer className="mt-10 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                BV Service
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Marketplace interno • Condomínio Bella Vittà
              </p>
            </div>
          </footer>

        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App