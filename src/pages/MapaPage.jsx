// src/pages/MapaPage.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import MapaInterativo from '../components/MapaInterativo'

const GOOGLE_MAPS_EMBED_URL = 'https://www.google.com/maps/d/u/1/embed?mid=1XFELlB7i9JmH3FVd6wR3O8HQ1nAdTSo&ehbc=2E312F'

const MapaPage = () => {
  const [prestadores, setPrestadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [abaAtiva, setAbaAtiva] = useState('interativo')

  useEffect(() => {
    buscarPrestadores()
  }, [])

  const buscarPrestadores = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('prestadores_servico')
        .select('*')
        .eq('opt_in', true)
        .order('nome')

      if (err) throw err
      setPrestadores(data || [])
    } catch (err) {
      console.error('Erro ao buscar prestadores:', err)
      setError('Não foi possível carregar os prestadores.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mapa do Condomínio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Encontre prestadores de serviço próximos à sua casa
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setAbaAtiva('interativo')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            abaAtiva === 'interativo'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Prestadores
        </button>
        <button
          onClick={() => setAbaAtiva('satelite')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            abaAtiva === 'satelite'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Satélite
        </button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-sm text-gray-500">Carregando mapa...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={buscarPrestadores}
            className="text-sm text-emerald-600 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {abaAtiva === 'interativo' && (
            <MapaInterativo prestadores={prestadores} />
          )}
          {abaAtiva === 'satelite' && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                width="100%"
                height="480"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa Satélite do Condomínio"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MapaPage