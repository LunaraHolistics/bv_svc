import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import PreviewAnuncio from '../components/PreviewAnuncio'

const BeneficioCard = ({ icon, title, description }) => (
  // ✅ CORREÇÃO: Padding e ícones menores no mobile
  <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 flex items-center justify-center text-lg sm:text-xl mb-3 sm:mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{title}</h3>
    <p className="text-xs sm:text-sm text-gray-500 mt-1.5 sm:mt-2 leading-relaxed">{description}</p>
  </div>
)

const NovoAnuncioPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white p-6 sm:p-8 md:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs sm:text-sm text-white/80 hover:text-white transition mb-4 sm:mb-6 cursor-pointer">
            ← Voltar
          </button>

          <span className="inline-flex px-4 py-2 rounded-full bg-white/10 text-xs sm:text-sm backdrop-blur-md mb-5">
            Marketplace Bella Vittà
          </span>

          {/* ✅ CORREÇÃO: Texto menor no mobile */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight">
            Publique algo para sua comunidade
          </h1>

          <p className="mt-4 text-emerald-50 text-sm sm:text-lg max-w-2xl">
            Venda produtos, anuncie oportunidades e alcance moradores próximos de forma rápida e segura.
          </p>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <BeneficioCard icon="⚡" title="Publicação rápida" description="Cadastre seu anúncio em poucos minutos." />
        <BeneficioCard icon="🏡" title="Público local" description="Seus anúncios aparecem apenas para moradores." />
        <BeneficioCard icon="🔒" title="Mais segurança" description="Negocie com pessoas próximas e confiáveis." />
      </section>

      {/* NÃO LOGADO */}
      {!user && (
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center text-xl sm:text-2xl mb-5">
                  🛒
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Faça login para publicar</h2>
                <p className="text-white/70 text-xs sm:text-sm mt-3 leading-relaxed">
                  Crie anúncios, acompanhe negociações e gerencie seus produtos com facilidade.
                </p>
              </div>
              <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest mt-8">
                Bella Vittà Marketplace
              </p>
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Entre na sua conta</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                Você precisa estar autenticado para publicar novos anúncios na plataforma.
              </p>
              <Link to="/login" className="mt-6 inline-flex justify-center items-center px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition no-underline text-sm">
                Entrar agora
              </Link>
              <button onClick={() => navigate('/anuncios')} className="mt-4 text-xs sm:text-sm text-gray-500 hover:text-gray-800 cursor-pointer">
                Ver anúncios disponíveis →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* LOGADO */}
      {user && (
        <section className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Criar novo anúncio</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Preencha os dados abaixo para publicar seu item.</p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-medium w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Publicação disponível
              </div>
            </div>
          </div>

          {/* ✅ CORREÇÃO: Container do formulário com padding externo no mobile */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6">
            <PreviewAnuncio
              onAnuncioCriado={() => navigate('/anuncios')}
              onClose={() => navigate(-1)}
            />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl sm:rounded-2xl p-4 sm:p-5">
            <h3 className="font-semibold text-amber-900 text-sm sm:text-base">Dica para vender mais rápido</h3>
            <p className="text-xs sm:text-sm text-amber-700 mt-2 leading-relaxed">
              Use fotos claras, descreva bem o produto e informe um preço justo. Parece conselho de avó... porque funciona desde antes da internet existir.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

export default NovoAnuncioPage