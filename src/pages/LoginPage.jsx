// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { cadastrar, login, recuperarSenha, user } = useAuth()

  const [aba, setAba] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [animar, setAnimar] = useState(false)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nome, setNome] = useState('')

  useEffect(() => {
    setTimeout(() => setAnimar(true), 50)
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
        setSucesso('Conta criada com sucesso! Verifique seu e-mail para ativar.')
        setAba('login')
        setSenha('')
        setConfirmarSenha('')
        setNome('')
      } else if (aba === 'recuperar') {
        await recuperarSenha(email)
        setSucesso('Link de recuperação enviado para seu e-mail.')
        setAba('login')
        setEmail('')
      }
    } catch (err) {
      const msg = err.message
      if (msg.includes('Invalid login')) setError('E-mail ou senha incorretos.')
      else if (msg.includes('already registered')) setError('Este e-mail já está cadastrado.')
      else if (msg.includes('Password should be')) setError('Senha deve ter no mínimo 6 caracteres.')
      else if (msg.includes('Email not confirmed')) setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
      else setError(msg || 'Ocorreu um erro.')
    } finally {
      setLoading(false)
    }
  }

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

  const inputClass = "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-200"

  return (
    <div className={`min-h-[80vh] flex items-center justify-center px-4 py-12 transition-all duration-500 ${animar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/50">
            <span className="text-white font-extrabold text-2xl tracking-tight">BV</span>
          </div>
          <h1 className="text-[22px] font-bold text-gray-900">BV Service</h1>
          <p className="text-sm text-gray-500 mt-1">Classificados do Bella Vittà</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">

          {/* Abas */}
          {aba !== 'recuperar' && (
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  aba === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setAba('cadastro'); setError(null); setSucesso(null) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  aba === 'cadastro'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {/* Header recuperar */}
          {aba === 'recuperar' && (
            <div className="mb-6">
              <button
                onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
                className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors mb-3 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Voltar ao login
              </button>
              <h2 className="text-[15px] font-semibold text-gray-900">Recuperar Senha</h2>
              <p className="text-xs text-gray-500 mt-1">Enviaremos um link para criar uma nova senha</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200/60 text-red-600 px-3.5 py-2.5 rounded-xl text-xs mb-4 animate-[fadeIn_0.2s_ease-out]">
              {error}
            </div>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-700 px-3.5 py-2.5 rounded-xl text-xs mb-4 animate-[fadeIn_0.2s_ease-out]">
              ✅ {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
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
                  {aba === 'cadastro' && <span className="text-gray-400 font-normal ml-1">(mín. 6 caracteres)</span>}
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => { setSenha(e.target.value); setError(null) }}
                    className={`${inputClass} pr-10`}
                    placeholder={aba === 'login' ? 'Sua senha' : 'Crie uma senha'}
                    disabled={loading}
                  />
                  {iconeSenha(mostrarSenha, setMostrarSenha)}
                </div>
              </div>
            )}

            {/* Confirmar senha */}
            {aba === 'cadastro' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmar senha</label>
                <div className="relative">
                  <input
                    type={mostrarConfirmar ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => { setConfirmarSenha(e.target.value); setError(null) }}
                    className={`${inputClass} pr-10`}
                    placeholder="Repita a senha"
                    disabled={loading}
                  />
                  {iconeSenha(mostrarConfirmar, setMostrarConfirmar)}
                </div>
              </div>
            )}

            {/* Esqueci senha */}
            {aba === 'login' && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => { setAba('recuperar'); setError(null); setSucesso(null) }}
                  className="text-xs text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed mt-2"
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

        <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
          {aba === 'cadastro'
            ? 'Ao criar uma conta, você concorda com os termos de uso do BV Service.'
            : 'Acesso exclusivo para moradores do Condomínio Bella Vittà.'}
        </p>
      </div>
    </div>
  )
}

export default LoginPage