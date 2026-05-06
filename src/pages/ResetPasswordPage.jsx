// src/pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ResetPasswordPage = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')

  useEffect(() => {
    const verificarSessaoRecovery = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (!data?.session) {
          setError(
            'Link inválido ou expirado. Solicite um novo link de recuperação.'
          )
        }
      } catch (err) {
        console.error(err)
        setError(
          'Não foi possível validar o link de recuperação.'
        )
      } finally {
        setLoading(false)
      }
    }

    verificarSessaoRecovery()
  }, [])

  const validarSenha = (valor) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
    return regex.test(valor)
  }

  const calcularForcaSenha = () => {
    if (!senha) return null

    let score = 0

    if (senha.length >= 8) score++
    if (/[A-Z]/.test(senha)) score++
    if (/\d/.test(senha)) score++
    if (/[^A-Za-z0-9]/.test(senha)) score++

    if (score <= 1) {
      return {
        label: 'Fraca',
        color: 'bg-red-500'
      }
    }

    if (score <= 3) {
      return {
        label: 'Média',
        color: 'bg-yellow-500'
      }
    }

    return {
      label: 'Forte',
      color: 'bg-emerald-500'
    }
  }

  const forcaSenha = calcularForcaSenha()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validarSenha(senha)) {
      setError(
        'A senha deve ter no mínimo 8 caracteres, incluindo letras e números.'
      )
      return
    }

    if (senha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    setSalvando(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha
      })

      if (error) throw error

      await supabase.auth.signOut()

      setSucesso(true)

      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      console.error(err)

      const msg = err?.message || ''

      if (
        msg.toLowerCase().includes('expired') ||
        msg.toLowerCase().includes('invalid')
      ) {
        setError(
          'Link expirado. Solicite um novo link de recuperação.'
        )
      } else {
        setError(
          msg || 'Erro ao redefinir senha.'
        )
      }
    } finally {
      setSalvando(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200'

  const EyeButton = ({ visible, setVisible }) => (
    <button
      type="button"
      onClick={() => setVisible(!visible)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {visible ? '🙈' : '👁️'}
    </button>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/50">
            <span className="text-white font-extrabold text-2xl">BV</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Redefinir senha
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Segurança primeiro. Drama depois.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-10 text-gray-500">
              Validando link...
            </div>
          ) : sucesso ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="font-semibold text-gray-900">
                Senha redefinida com sucesso
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Redirecionando para login...
              </p>
            </div>
          ) : error && !senha ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">⚠️</div>
              <p className="text-sm text-gray-500 mb-5">
                {error}
              </p>

              <button
                onClick={() => navigate('/esqueci-senha')}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                Solicitar novo link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nova senha
                </label>

                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value)
                      setError(null)
                    }}
                    className={`${inputClass} pr-10`}
                    placeholder="Digite sua nova senha"
                  />
                  <EyeButton
                    visible={mostrarSenha}
                    setVisible={setMostrarSenha}
                  />
                </div>

                {forcaSenha && (
                  <div className="mt-2">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${forcaSenha.color}`}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Força: {forcaSenha.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirmar senha
                </label>

                <div className="relative">
                  <input
                    type={mostrarConfirmar ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e) => {
                      setConfirmar(e.target.value)
                      setError(null)
                    }}
                    className={`${inputClass} pr-10`}
                    placeholder="Repita sua senha"
                  />

                  <EyeButton
                    visible={mostrarConfirmar}
                    setVisible={setMostrarConfirmar}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:bg-gray-300"
              >
                {salvando
                  ? 'Salvando...'
                  : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage