// src/App.jsx
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mapa" element={<MapaPage />} />
              <Route path="/servicos" element={<ServicosPage />} />
              <Route path="/indicacoes" element={<IndicacoesPage />} />
              <Route path="/anuncios" element={<AnunciosPage />} />
              <Route path="/novo-anuncio" element={<NovoAnuncioPage />} />
              <Route path="/editar-anuncio/:id" element={<EditarAnuncioPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
            </Routes>
          </main>
          <footer className="border-t border-gray-200 bg-white mt-8">
            <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
              BV Service Classificados &bull; Condomínio Bella Vittà
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App