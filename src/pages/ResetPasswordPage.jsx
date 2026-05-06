// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')

  // Verificar se o hash do Supabase é válido ao montar
  useEffect(() => {
    const hash = window.location.hash
    if (!hash || hash.length < 10) {
      setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
      setLoading(false)
      return
    }
    // Extrair o access_token do hash para verificar a sessão
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    if (!accessToken) {
      setError('Link inválido ou expirado.')
      setLoading(false)
      return
    }
    setLoading(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (senha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    setSalvando(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password: senha })
      if (err) throw err
      setSucesso(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      const msg = err.message
      if (msg.includes('expired') || msg.includes('Invalid')) {
        setError('Link expirado. Solicite um novo link de recuperação.')
      } else {
        setError(msg || 'Erro ao redefinir senha.')
      }
    } finally {
      setSalvando(false)
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"

  const iconeSenha = (visivel, setVisivel) => (
    <button
      type="button"
      onClick={() => setVisivel(!visivel)}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      tabIndex={-1}
    >
      {visivel ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/50">
            <span className="text-white font-extrabold text-2xl tracking-tight">BV</span>
          </div>
          <h1 className="text-[22px] font-bold text-gray-900">BV Service</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : sucesso ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Senha redefinida!</h2>
              <p className="text-sm text-gray-500 mt-1">Redirecionando para o login...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Link inválido</h2>
              <p className="text-sm text-gray-500 mt-1 mb-5">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors no-underline"
              >
                Solicitar novo link
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-[15px] font-semibold text-gray-900">Nova Senha</h2>
                <p className="text-xs text-gray-500 mt-1">Crie uma senha forte para sua conta</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200/60 text-red-600 px-3.5 py-2.5 rounded-xl text-xs mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Nova senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => { setSenha(e.target.value); setError(null) }}
                      className={`${inputClass} pr-10`}
                      placeholder="Mínimo 6 caracteres"
                      disabled={salvando}
                      autoFocus
                    />
                    {iconeSenha(mostrarSenha, setMostrarSenha)}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
                  <div className="relative">
                    <input
                      type={mostrarConfirmar ? 'text' : 'password'}
                      value={confirmar}
                      onChange={(e) => { setConfirmar(e.target.value); setError(null) }}
                      className={`${inputClass} pr-10`}
                      placeholder="Repita a nova senha"
                      disabled={salvando}
                    />
                    {iconeSenha(mostrarConfirmar, setMostrarConfirmar)}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed mt-2"
                >
                  {salvando ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Salvando...
                    </span>
                  ) : 'Redefinir Senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage