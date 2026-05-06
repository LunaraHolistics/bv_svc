import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import PreviewAnuncio from '../components/PreviewAnuncio'

const BeneficioCard = ({ icon, title, description }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl mb-4">
      {icon}
    </div>

    <h3 className="font-semibold text-gray-900">
      {title}
    </h3>

    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
      {description}
    </p>
  </div>
)

const LoadingState = () => (
  <div className="min-h-[65vh] flex flex-col items-center justify-center">
    <div className="w-20 h-20 rounded-3xl bg-white shadow-lg border border-gray-100 flex items-center justify-center mb-5">
      <svg
        className="animate-spin h-7 w-7 text-emerald-600"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          className="opacity-20"
        />
        <path
          d="M22 12a10 10 0 00-10-10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="opacity-90"
        />
      </svg>
    </div>

    <h2 className="text-lg font-semibold text-gray-900">
      Preparando seu anúncio
    </h2>

    <p className="text-sm text-gray-500 mt-2">
      Só um instante...
    </p>
  </div>
)

const NovoAnuncioPage = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-8">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition mb-6"
          >
            ← Voltar
          </button>

          <span className="inline-flex px-4 py-2 rounded-full bg-white/10 text-sm backdrop-blur-md mb-5">
            Marketplace Bella Vittà
          </span>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Publique algo para sua comunidade
          </h1>

          <p className="mt-4 text-emerald-50 text-lg max-w-2xl">
            Venda produtos, anuncie oportunidades e alcance moradores
            próximos de forma rápida e segura.
          </p>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BeneficioCard
          icon="⚡"
          title="Publicação rápida"
          description="Cadastre seu anúncio em poucos minutos."
        />

        <BeneficioCard
          icon="🏡"
          title="Público local"
          description="Seus anúncios aparecem apenas para moradores."
        />

        <BeneficioCard
          icon="🔒"
          title="Mais segurança"
          description="Negocie com pessoas próximas e confiáveis."
        />
      </section>

      {/* NÃO LOGADO */}
      {!user && (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-2">

            {/* visual */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white p-8 flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mb-5">
                  🛒
                </div>

                <h2 className="text-2xl font-bold">
                  Faça login para publicar
                </h2>

                <p className="text-white/70 text-sm mt-3 leading-relaxed">
                  Crie anúncios, acompanhe negociações
                  e gerencie seus produtos com facilidade.
                </p>
              </div>

              <p className="text-xs text-white/40 uppercase tracking-widest mt-8">
                Bella Vittà Marketplace
              </p>
            </div>

            {/* CTA */}
            <div className="p-8 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-gray-900">
                Entre na sua conta
              </h3>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Você precisa estar autenticado para publicar
                novos anúncios na plataforma.
              </p>

              <Link
                to="/login"
                className="mt-6 inline-flex justify-center items-center px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition no-underline"
              >
                Entrar agora
              </Link>

              <button
                onClick={() => navigate('/anuncios')}
                className="mt-4 text-sm text-gray-500 hover:text-gray-800"
              >
                Ver anúncios disponíveis →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* LOGADO */}
      {user && (
        <section className="space-y-6">

          {/* topo formulário */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Criar novo anúncio
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Preencha os dados abaixo para publicar seu item.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Publicação disponível
              </div>
            </div>
          </div>

          {/* formulário */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
            <PreviewAnuncio
              onAnuncioCriado={() => navigate('/anuncios')}
              onClose={() => navigate(-1)}
            />
          </div>

          {/* rodapé informativo */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h3 className="font-semibold text-amber-900">
              Dica para vender mais rápido
            </h3>

            <p className="text-sm text-amber-700 mt-2 leading-relaxed">
              Use fotos claras, descreva bem o produto e informe
              um preço justo. Parece conselho de avó... porque funciona
              desde antes da internet existir.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

export default NovoAnuncioPage