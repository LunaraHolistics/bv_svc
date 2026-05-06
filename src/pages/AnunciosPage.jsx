// src/pages/AnunciosPage.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import ListagemAnuncios from '../components/ListagemAnuncios'

const BenefitCard = ({ title, description, icon, color }) => {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 ${color}`}>
        {icon}
      </div>

      <h3 className="text-lg font-bold text-gray-900">
        {title}
      </h3>

      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

const CTASection = () => {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white p-8 md:p-10">
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-xl">
          <span className="inline-flex px-4 py-2 bg-white/10 rounded-full text-xs font-medium backdrop-blur-md mb-4">
            Tem algo parado em casa?
          </span>

          <h2 className="text-2xl md:text-4xl font-bold leading-tight">
            Transforme itens esquecidos em oportunidades
          </h2>

          <p className="mt-3 text-emerald-50 text-sm md:text-base">
            Venda móveis, eletrônicos, objetos e muito mais para pessoas próximas,
            com mais praticidade e segurança.
          </p>
        </div>

        <Link
          to="/novo-anuncio"
          className="inline-flex items-center justify-center px-7 py-4 bg-white text-emerald-700 rounded-2xl font-bold no-underline hover:scale-105 transition"
        >
          Publicar agora
        </Link>
      </div>
    </section>
  )
}

const AnunciosPage = () => {
  return (
    <div className="space-y-10">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium mb-5 text-white">
            Marketplace Bella Vittà
          </span>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
            Compre e venda entre vizinhos com muito mais confiança
          </h1>

          <p className="mt-5 text-emerald-100 text-base md:text-lg max-w-2xl leading-relaxed">
            Um marketplace privado para moradores anunciarem produtos,
            encontrarem oportunidades e negociarem com pessoas da própria comunidade.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/novo-anuncio"
              className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-semibold no-underline hover:scale-105 transition"
            >
              Criar anúncio
            </Link>

            <Link
              to="/servicos"
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-white no-underline hover:bg-white/20 transition"
            >
              Explorar serviços
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BenefitCard
          icon="🛡️"
          title="Mais segurança"
          description="Negocie com pessoas próximas dentro da própria comunidade."
          color="bg-emerald-50"
        />

        <BenefitCard
          icon="⚡"
          title="Mais rapidez"
          description="Venda produtos sem depender de marketplaces externos."
          color="bg-blue-50"
        />

        <BenefitCard
          icon="🤝"
          title="Comunidade forte"
          description="Fortaleça relações locais e valorize a rede de vizinhos."
          color="bg-purple-50"
        />
      </section>

      {/* LISTAGEM */}
      <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Últimos anúncios publicados
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Veja os produtos disponíveis dentro da comunidade.
            </p>
          </div>

          <Link
            to="/novo-anuncio"
            className="inline-flex items-center justify-center px-5 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition no-underline"
          >
            + Novo anúncio
          </Link>
        </div>

        <ListagemAnuncios />
      </section>

      {/* CTA FINAL */}
      <CTASection />

    </div>
  )
}

export default AnunciosPage