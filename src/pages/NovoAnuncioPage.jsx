// src/pages/NovoAnuncioPage.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import PreviewAnuncio from '../components/PreviewAnuncio'

const NovoAnuncioPage = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>
      <PreviewAnuncio
        onAnuncioCriado={() => navigate('/anuncios')}
        onClose={() => navigate(-1)}
      />
    </div>
  )
}

export default NovoAnuncioPage