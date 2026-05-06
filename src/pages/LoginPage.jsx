// src/pages/LoginPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { cadastrar, login, recuperarSenha, user } = useAuth()

  const [aba, setAba] = useState('login') // 'login' | 'cadastro' | 'recuperar'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(null)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nome, setNome] = useState('')

  React.useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const validar = () => {
    if (aba === 'cadastro') {
      if (!nome.trim()) return 'Nome completo é obrigatório.'
      if (!email.includes('@')) return 'E-mail inválido.'
      if (senha.length < 6) return 'Senha deve ter no mínimo 6 caracteres.'
      if (senha !== confirmarSenha) return 'As senhas não coincidem.'
    }
    if (aba === 'login') {
      if (!email.includes('@')) return 'E-mail inválido.'
      if (!senha) return 'Senha é obrigatória.'
    }
    if (aba === 'recuperar') {
      if (!email.includes('@')) return 'E-mail inválido.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const erroValidacao = validar()
    if (erroValidacao) { setError(erroValidacao); return }

    setLoading(true)
    setError(null)
    setSucesso(null)

    try {
      if (aba === 'login') {
        await login(email, senha)
        navigate('/')
      } else if (aba === 'cadastro') {
        await cadastrar(email, senha, nome)
        setSucesso('Conta criada com sucesso! Você já pode entrar.')
        setAba('login')
        setSenha('')
        setConfirmarSenha('')
      } else if (aba === 'recuperar') {
        await recuperarSenha(email)
        setSucesso('Link de recuperação enviado para seu e-mail.')
        setAba('login')
      }
    } catch (err) {
      const msg = err.message
      if (msg.includes('Invalid login')) setError('E-mail ou senha incorretos.')
      else if (msg.includes('already registered')) setError('Este e-mail já está cadastrado.')
      else if (msg.includes('Password should be')) setError('Senha deve ter no mínimo 6 caracteres.')
      else setError(msg || 'Ocorreu um erro.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-colors"

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

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

          {/* Abas login/cadastro */}
          {aba !== 'recuperar' && (
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  aba === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setAba('cadastro'); setError(null); setSucesso(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  aba === 'cadastro'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* Título recuperar */}
          {aba === 'recuperar' && (
            <div className="mb-6">
              <button
                onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
                className="text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Voltar
              </button>
              <h2 className="text-[15px] font-semibold text-gray-900">Recuperar Senha</h2>
              <p className="text-xs text-gray-500 mt-1">Enviaremos um link para redefinir sua senha</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs mb-4">
              {error}
            </div>
          )}

          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg text-xs mb-4">
              ✅ {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nome (só cadastro) */}
            {aba === 'cadastro' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setError(null) }}
                  className={inputClass}
                  placeholder="Seu nome"
                  disabled={loading}
                  autoFocus={aba === 'cadastro'}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                className={inputClass}
                placeholder="seu@email.com"
                disabled={loading}
                autoFocus={aba !== 'cadastro'}
              />
            </div>

            {/* Senha */}
            {aba !== 'recuperar' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Senha
                  {aba === 'cadastro' && <span className="text-gray-400 font-normal"> (mín. 6 caracteres)</span>}
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError(null) }}
                  className={inputClass}
                  placeholder={aba === 'login' ? 'Sua senha' : 'Crie uma senha'}
                  disabled={loading}
                />
              </div>
            )}

            {/* Confirmar senha (só cadastro) */}
            {aba === 'cadastro' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmar senha</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => { setConfirmarSenha(e.target.value); setError(null) }}
                  className={inputClass}
                  placeholder="Repita a senha"
                  disabled={loading}
                />
              </div>
            )}

            {/* Esqueci senha (só login) */}
            {aba === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setAba('recuperar'); setError(null); setSucesso(null) }}
                  className="text-xs text-emerald-600 font-medium hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Aguarde...
                </span>
              ) : (
                aba === 'cadastro' ? 'Criar Conta' : aba === 'recuperar' ? 'Enviar Link' : 'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
          Ao criar uma conta, você concorda com os termos de uso do BV Service.
        </p>
      </div>
    </div>
  )
}

export default LoginPage