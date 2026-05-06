// src/pages/NotFoundPage.jsx
import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl mb-6">🔍</div>
      <h1 className="text-3xl font-bold text-gray-900">
        Página não encontrada
      </h1>
      <p className="text-gray-500 mt-3 max-w-md">
        Essa página não existe ou foi removida.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition no-underline"
      >
        Voltar ao início
      </Link>
    </div>
  )
}

export default NotFoundPage