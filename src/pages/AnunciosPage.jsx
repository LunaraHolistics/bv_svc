// src/pages/AnunciosPage.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import ListagemAnuncios from '../components/ListagemAnuncios'

const AnunciosPage = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Anúncios</h1>
          <p className="text-sm text-gray-500 mt-1">Produtos e serviços dos moradores</p>
        </div>
        <Link
          to="/novo-anuncio"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Anunciar
        </Link>
      </div>
      <ListagemAnuncios />
    </div>
  )
}

export default AnunciosPage