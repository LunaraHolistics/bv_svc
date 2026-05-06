// src/pages/LoginPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

const LoginPage = () => {
  const navigate = useNavigate()
  const { loginMagicLink, user } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(false)

  React.useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Digite um e-mail válido.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await loginMagicLink(email.trim().toLowerCase())
      setEnviado(true)
    } catch (err) {
      setError(err.message || 'Erro ao enviar link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <span className="text-white font-extrabold text-2xl tracking-tight">BV</span>
          </div>
          <h1 className="text-[22px] font-bold text-gray-900">BV Service</h1>
          <p className="text-sm text-gray-500 mt-1">Classificados do Bella Vittà</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">

          {!enviado ? (
            <>
              <h2 className="text-[15px] font-semibold text-gray-900 text-center mb-1">
                Acesse sua conta
              </h2>
              <p className="text-xs text-gray-400 text-center mb-6">
                Enviaremos um link de acesso para seu e-mail
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null) }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors"
                    placeholder="seu@email.com"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar link de acesso'}
                </button>
              </form>

              {/* Separador */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium">OU</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Entrar sem login */}
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Continuar sem conta
              </button>
            </>
          ) : (
            /* Estado: link enviado */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900">Verifique seu e-mail</h2>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Enviamos um link de acesso para
              </p>
              <p className="text-sm text-gray-900 font-medium mt-1">{email}</p>
              <p className="text-xs text-gray-400 mt-3">
                Clique no link para entrar. O link expira em 1 hora.
              </p>

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => { setEnviado(false); setEmail(''); setError(null) }}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Enviar para outro e-mail
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
          Ao entrar, você concorda com os termos de uso do BV Service.<br />
          Sem senha necessária — acesso seguro por link único.
        </p>
      </div>
    </div>
  )
}

export default LoginPage