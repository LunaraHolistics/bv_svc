// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import MapaPage from './pages/MapaPage'
import AnunciosPage from './pages/AnunciosPage'
import NovoAnuncioPage from './pages/NovoAnuncioPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<MapaPage />} />
            <Route path="/anuncios" element={<AnunciosPage />} />
            <Route path="/novo-anuncio" element={<NovoAnuncioPage />} />
          </Routes>
        </main>

        <footer className="border-t border-gray-200 bg-white mt-8">
          <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
            BV Service Classificados &bull; Condomínio BV Service
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App