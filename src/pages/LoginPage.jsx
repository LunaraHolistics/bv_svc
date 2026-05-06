// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

// ⚠️ SUBSTITUIR pela URL do Supabase Storage após upload (veja instrução abaixo)
const IMAGEM_FAIXADA = 'https://z-cdn-media.chatglm.cn/files/87ba6203-a570-45ba-acba-2cf86cfb2e0c.png?auth_key=1878080770-c1bb91e3034146819b9b3eb0916e73a3-0-605f00e2b1c8fe66e1d5cf4f69bacfbd'

const LoginPage = () => {
  const navigate = useNavigate()
  const { cadastrar, login, recuperarSenha, user } = useAuth()

  const [aba, setAba] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [pronto, setPronto] = useState(false)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nome, setNome] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setPronto(true), 100)
    if (user) navigate('/')
    return () => clearTimeout(t)
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
        setSucesso('Conta criada! Verifique seu e-mail para ativar.')
        setAba('login')
        setSenha('')
        setConfirmarSenha('')
        setNome('')
      } else if (aba === 'recuperar') {
        await recuperarSenha(email)
        setSucesso('Link enviado para seu e-mail.')
        setAba('login')
        setEmail('')
      }
    } catch (err) {
      const msg = err.message
      if (msg.includes('Invalid login')) setError('E-mail ou senha incorretos.')
      else if (msg.includes('already registered')) setError('Este e-mail já está cadastrado.')
      else if (msg.includes('Password should be')) setError('Senha deve ter no mínimo 6 caracteres.')
      else if (msg.includes('Email not confirmed')) setError('Confirme seu e-mail antes de entrar.')
      else setError(msg || 'Ocorreu um erro.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-[calc(100vh-56px-49px)] flex items-center justify-center px-3 py-6 sm:py-10 transition-all duration-700 ${pronto ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

      <div className="w-full max-w-[900px] flex flex-col md:flex-row bg-white rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.07)] overflow-hidden">

        {/* ===== IMAGEM ===== */}
        <div className="md:w-[400px] lg:w-[440px] relative bg-[#1a1a1a] overflow-hidden flex-shrink-0">
          <img
            src={IMAGEM_FAIXADA}
            alt="Bella Vittà"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/40 to-transparent" />

          <div className="relative z-10 h-full min-h-[260px] md:min-h-full flex flex-col justify-between p-8 lg:p-10">

            <div>
              {/* Marca BV */}
              <div className="inline-flex items-center gap-2.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center">
                  <span className="text-white font-extrabold text-base tracking-tight">BV</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div>
                  <p className="text-white/90 text-[13px] font-semibold leading-none tracking-wide">BELLA VITTÀ</p>
                  <p className="text-white/30 text-[10px] font-medium tracking-[0.2em] mt-0.5">RESIDENCIAL</p>
                </div>
              </div>

              <h2 className="text-white text-[26px] sm:text-[28px] font-bold leading-[1.15] max-w-[280px]">
                Serviços e<br />
                <span className="text-emerald-400">vendas online</span>
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-white/40 text-[12px] leading-relaxed max-w-[240px]">
                Anúncios, indicações e prestadores — tudo em um só lugar, para quem mora no Bella Vittà.
              </p>
              <div className="flex gap-5 text-white/20 text-[11px] tracking-wider uppercase font-medium">
                <span>Moradores</span>
                <span className="w-px h-3 bg-white/10 self-center" />
                <span>Serviços</span>
                <span className="w-px h-3 bg-white/10 self-center" />
                <span>Vendas</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FORMULÁRIO ===== */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[22px] font-bold text-gray-900 text-center md:text-left">
              {aba === 'login' && 'Bem-vindo de volta'}
              {aba === 'cadastro' && 'Criar sua conta'}
              {aba === 'recuperar' && 'Recuperar senha'}
            </h1>
            <p className="text-[14px] text-gray-400 mt-1.5 text-center md:text-left">
              {aba === 'login' && 'Acesse sua conta no portal do condomínio'}
              {aba === 'cadastro' && 'Junte-se ao portal do Bella Vittà'}
              {aba === 'recuperar' && 'Enviaremos um link para redefinir sua senha'}
            </p>
          </div>

          {/* Abas */}
          {aba !== 'recuperar' && (
            <div className="flex gap-0 mb-6 bg-gray-100 p-[3px] rounded-xl">
              <button
                onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
                className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${
                  aba === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setAba('cadastro'); setError(null); setSucesso(null) }}
                className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${
                  aba === 'cadastro'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {/* Voltar (recuperar) */}
          {aba === 'recuperar' && (
            <button
              onClick={() => { setAba('login'); setError(null); setSucesso(null) }}
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors mb-6 text-[13px] font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Voltar ao login
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-[13px] mb-4 leading-relaxed">
              {error}
            </div>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-[13px] mb-4 leading-relaxed">
              ✅ {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nome */}
            {aba === 'cadastro' && (
              <div>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setError(null) }}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 outline-none"
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
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 outline-none"
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
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 outline-none pr-11"
                  placeholder="Senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  tabIndex={-1}
                >
                  {mostrarSenha ? (
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
              </div>
            )}

            {/* Confirmar senha */}
            {aba === 'cadastro' && (
              <div className="relative">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => { setConfirmarSenha(e.target.value); setError(null) }}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 outline-none pr-11"
                  placeholder="Confirmar senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  tabIndex={-1}
                >
                  {mostrarConfirmar ? (
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
              </div>
            )}

            {/* Esqueci */}
            {aba === 'login' && (
              <div className="text-right -mt-0.5">
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
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[14px] font-semibold hover:bg-[#047857] active:bg-emerald-800 transition-all duration-150 disabled:bg-gray-300 disabled:cursor-not-allowed mt-1 shadow-sm shadow-emerald-600/10"
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

          {/* Link sutil */}
          <div className="mt-6 text-center md:text-left">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors font-medium"
            >
              Explorar sem conta →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage