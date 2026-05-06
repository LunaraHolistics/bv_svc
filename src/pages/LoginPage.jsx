// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const IMAGEM_FAIXADA = 'https://z-cdn-media.chatglm.cn/files/b9937a13-342e-41e5-8d19-9fd8d913e8cb.png?auth_key=1878080458-267389fd474745339cb6113468c6bdc9-0-c0b36b21b7cb816494310e3c8a21f146'

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
    setTimeout(() => setAnimar(true), 80)
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
        setSucesso('Conta criada! Verifique seu e-mail para ativar o acesso.')
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
      else if (msg.includes('Email not confirmed')) setError('Confirme seu e-mail antes de entrar. Verifique a caixa de entrada.')
      else setError(msg || 'Ocorreu um erro.')
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = ({ visivel, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
      tabIndex={-1}
    >
      {visivel ? (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  )

  const inputClass = "w-full px-4 py-3 bg-[#fafafa] border border-[#dbdbdb] rounded-lg text-[13px] text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all duration-150 outline-none"

  return (
    <div className={`min-h-[calc(100vh-56px-49px)] flex items-center justify-center px-4 py-6 sm:py-10 transition-all duration-700 ${animar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

      <div className="w-full max-w-[920px] flex flex-col md:flex-row bg-white rounded-xl shadow-[0_1px_20px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-200/50">

        {/* ===== LADO ESQUERDO: Imagem (só desktop) ===== */}
        <div className="hidden md:flex md:w-[380px] lg:w-[420px] flex-col justify-between relative bg-gray-900 overflow-hidden">
          {/* Imagem de fundo */}
          <div className="absolute inset-0">
            <img
              src={IMAGEM_FAIXADA}
              alt="Entrada Bella Vittà"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-gray-900/30" />
          </div>

          {/* Conteúdo sobreposto */}
          <div className="relative z-10 p-8 sm:p-10 flex flex-col justify-between h-full">
            {/* Logo */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-6">
                <span className="text-white font-extrabold text-lg tracking-tight">BV</span>
              </div>
              <h2 className="text-white text-xl font-bold leading-snug">
                Portal de<br />
                <span className="text-emerald-400">Classificados</span>
              </h2>
              <p className="text-white/50 text-[13px] mt-2 leading-relaxed max-w-[260px]">
                Conecte-se com moradores e prestadores do condomínio Bella Vittà
              </p>
            </div>

            {/* Crédito */}
            <div>
              <div className="flex gap-3 text-white/30 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                  Moradores
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>
                  Serviços
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>
                  Anúncios
                </div>
              </div>
              <p className="text-white/20 text-[10px] mt-3">Condomínio Bella Vittà © 2025</p>
            </div>
          </div>
        </div>

        {/* ===== LADO DIREITO: Formulário ===== */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-center max-w-[420px] mx-auto w-full">

          {/* Logo mobile */}
          <div className="md:hidden text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200/50">
              <span className="text-white font-extrabold text-xl tracking-tight">BV</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">BV Service</h1>
            <p className="text-[13px] text-gray-400">Classificados do Bella Vittà</p>
          </div>

          {/* Header desktop */}
          <div className="hidden md:block mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-extrabold text-xl tracking-tight">BV</span>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              {aba === 'login' && 'Faça login para acessar'}
              {aba === 'cadastro' && 'Crie sua conta'}
              {aba === 'recuperar' && 'Recuperar sua senha'}
            </h2>
          </div>

          {/* Abas */}
          {aba !== 'recuperar' && (
            <div className="flex gap-0 mb-5 bg-[#fafafa] p-[2px] rounded-lg border border-[#dbdbdb]">
              <button
                onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
                className={`flex-1 py-[9px] rounded-[6px] text-[13px] font-medium transition-all duration-150 ${
                  aba === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setAba('cadastro'); setError(null); setSucesso(null) }}
                className={`flex-1 py-[9px] rounded-[6px] text-[13px] font-medium transition-all duration-150 ${
                  aba === 'cadastro'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {/* Header recuperar */}
          {aba === 'recuperar' && (
            <div className="mb-5">
              <button
                onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
                className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors mb-4 text-[13px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Voltar
              </button>
              <h2 className="text-[15px] font-semibold text-gray-900 text-center">Recuperar senha</h2>
              <p className="text-[13px] text-gray-400 text-center mt-1">
                Digite seu e-mail para receber o link de recuperação
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200/50 text-red-600 px-3 py-2.5 rounded-lg text-[12px] mb-3 leading-relaxed">
              {error}
            </div>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-700 px-3 py-2.5 rounded-lg text-[12px] mb-3 leading-relaxed">
              ✅ {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-[6px]">
            {/* Nome */}
            {aba === 'cadastro' && (
              <div>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setError(null) }}
                  className={inputClass}
                  placeholder="Nome completo"
                  disabled={loading}
                  autoFocus={aba === 'cadastro'}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                className={inputClass}
                placeholder="E-mail"
                disabled={loading}
                autoFocus={aba !== 'cadastro'}
              />
            </div>

            {/* Senha */}
            {aba !== 'recuperar' && (
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError(null) }}
                  className={`${inputClass} pr-11`}
                  placeholder="Senha"
                  disabled={loading}
                />
                <EyeIcon visivel={mostrarSenha} onClick={() => setMostrarSenha(!mostrarSenha)} />
              </div>
            )}

            {/* Confirmar senha */}
            {aba === 'cadastro' && (
              <div className="relative">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => { setConfirmarSenha(e.target.value); setError(null) }}
                  className={`${inputClass} pr-11`}
                  placeholder="Confirmar senha"
                  disabled={loading}
                />
                <EyeIcon visivel={mostrarConfirmar} onClick={() => setMostrarConfirmar(!mostrarConfirmar)} />
              </div>
            )}

            {/* Esqueci senha */}
            {aba === 'login' && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => { setAba('recuperar'); setError(null); setSucesso(null) }}
                  className="text-[12px] text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-[9px] bg-emerald-600 text-white rounded-lg text-[13px] font-semibold hover:bg-[#047857] active:bg-emerald-800 transition-all duration-150 disabled:bg-emerald-300 disabled:cursor-not-allowed mt-2"
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
                aba === 'cadastro' ? 'Criar conta' : aba === 'recuperar' ? 'Enviar link' : 'Entrar'
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Continuar sem conta */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-[9px] bg-[#0095f6] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1877f2] active:bg-[#0062cc] transition-all duration-150"
          >
            Explorar sem conta
          </button>
        </div>
      </div>

      {/* Footer mobile */}
      <p className="text-[11px] text-gray-400 text-center mt-6 md:mt-8">
        Acesso exclusivo para moradores do Condomínio Bella Vittà
      </p>
    </div>
  )
}

export default LoginPage