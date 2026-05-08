import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const IMAGEM_FAIXADA =
  'https://z-cdn-media.chatglm.cn/files/87ba6203-a570-45ba-acba-2cf86cfb2e0c.png?auth_key=1878080770-c1bb91e3034146819b9b3eb0916e73a3-0-605f00e2b1c8fe66e1d5cf4f69bacfbd'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { cadastrar, login, recuperarSenha, user, loading: authLoading } = useAuth()

  const [aba, setAba] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [pixCopiado, setPixCopiado] = useState(false)

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [nome, setNome] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setPronto(true), 120)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!authLoading && user && location.pathname === '/login') {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate, location.pathname])

  useEffect(() => {
    setError(null)
    setSucesso(null)
  }, [aba])

  const resetCampos = () => {
    setSenha('')
    setConfirmarSenha('')
  }

  // Função para copiar o PIX
  const copiarPix = () => {
    navigator.clipboard.writeText('lunara_terapias@jim.com')
      .then(() => {
        setPixCopiado(true)
        setTimeout(() => setPixCopiado(false), 2500)
      })
      .catch(err => alert('Falha ao copiar. Copie manualmente: lunara_terapias@jim.com'))
  }

  const validar = () => {
    if (!email.includes('@')) {
      return 'Informe um e-mail válido.'
    }

    if (aba === 'cadastro') {
      if (!nome.trim()) {
        return 'Informe seu nome completo.'
      }

      if (senha.length < 6) {
        return 'A senha precisa ter no mínimo 6 caracteres.'
      }

      if (senha !== confirmarSenha) {
        return 'As senhas não coincidem.'
      }
    }

    if (aba === 'login') {
      if (!senha) {
        return 'Informe sua senha.'
      }
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const erroValidacao = validar()

    if (erroValidacao) {
      setError(erroValidacao)
      return
    }

    setLoading(true)
    setError(null)
    setSucesso(null)

    try {
      if (aba === 'login') {
        await login(email, senha)
        navigate('/', { replace: true })
      }

      if (aba === 'cadastro') {
        await cadastrar(email, senha, nome)

        setSucesso(
          'Conta criada com sucesso. Verifique seu e-mail para confirmar o acesso.'
        )

        setAba('login')
        resetCampos()
        setNome('')
      }

      if (aba === 'recuperar') {
        await recuperarSenha(email)

        setSucesso(
          'Enviamos um link de recuperação para seu e-mail.'
        )

        setAba('login')
        resetCampos()
      }
    } catch (err) {
      const msg = err.message || ''

      if (msg.includes('Invalid login')) {
        setError('E-mail ou senha inválidos.')
      } else if (msg.includes('already registered')) {
        setError('Este e-mail já possui cadastro.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirme seu e-mail antes de acessar. Verifique sua caixa de entrada e spam.')
      } else {
        setError(msg || 'Erro ao processar sua solicitação.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-8 transition-all duration-700 ${
        pronto
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 blur-3xl rounded-full" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-300/20 blur-3xl rounded-full" />

      <div className="relative z-10 w-full max-w-6xl bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.08)] flex flex-col lg:flex-row mb-8">

        <div className="hidden lg:block lg:w-[45%] relative min-h-[620px]">
          <img
            src={IMAGEM_FAIXADA}
            alt="Bella Vittà"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="relative z-10 h-full flex flex-col justify-between p-10">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg mb-8">
                BV
              </div>

              <h2 className="text-white text-4xl font-bold leading-tight">
                Sua comunidade em um só lugar
              </h2>

              <p className="text-white/70 text-sm mt-4 leading-relaxed max-w-sm">
                Marketplace, prestadores, indicações e oportunidades
                reais entre moradores.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs">
                anúncios locais
              </span>

              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs">
                serviços confiáveis
              </span>

              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs">
                vizinhos conectados
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {aba === 'login' && 'Bem-vindo de volta'}
              {aba === 'cadastro' && 'Criar conta'}
              {aba === 'recuperar' && 'Recuperar acesso'}
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              {aba === 'login' &&
                'Entre para acessar sua comunidade'}
              {aba === 'cadastro' &&
                'Crie sua conta gratuitamente'}
              {aba === 'recuperar' &&
                'Enviaremos um link para redefinir sua senha'}
            </p>
          </div>

          {aba !== 'recuperar' && (
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setAba('login')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
                  aba === 'login'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                Entrar
              </button>

              <button
                type="button"
                onClick={() => setAba('cadastro')}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition ${
                  aba === 'cadastro'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm">
              {error}
            </div>
          )}

          {sucesso && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-sm">
              {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {aba === 'cadastro' && (
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            )}

            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />

            {aba !== 'recuperar' && (
              <div className="relative">
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete={aba === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {mostrarSenha ? '🙈' : '👁️'}
                </button>
              </div>
            )}

            {aba === 'cadastro' && (
              <div className="relative">
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {mostrarConfirmar ? '🙈' : '👁️'}
                </button>
              </div>
            )}

            {aba === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setAba('recuperar')}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {aba === 'recuperar' && (
              <button
                type="button"
                onClick={() => setAba('login')}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                ← Voltar ao login
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-white font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-[1.01] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex justify-center items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processando...
                </span>
              ) : aba === 'login' ? (
                'Entrar'
              ) : aba === 'cadastro' ? (
                'Criar conta'
              ) : (
                'Enviar link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Explorar sem login →
            </button>
          </div>
        </div>
      </div>

      {/* RODAPÉ DIVERTIDO */}
      <div className="relative z-10 w-full max-w-lg bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 text-center">
        <p className="text-sm font-bold text-gray-700 mb-1">☕ Combustível para o Código</p>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Sabia que o BV Service é movido a café e persistência?<br/>
          Se o app facilitou sua vida, que tal retribuir com um cafezinho?<br/>
          <span className="font-medium text-gray-700">Você ajuda a manter o servidor ligado e o dev acordado! 🚀</span>
        </p>
        <button
          onClick={copiarPix}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-mono font-bold text-gray-700 transition cursor-pointer"
        >
          {pixCopiado ? (
            <>✅ Copiado!</>
          ) : (
            <>📋 PIX: lunara_terapias@jim.com</>
          )}
        </button>
      </div>
    </div>
  )
}

export default LoginPage