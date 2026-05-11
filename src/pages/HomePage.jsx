import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Wrench,
  MapPin,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Sparkles
} from 'lucide-react'

const formatarPreco = (valor) => {
  if (!valor) return 'Sob consulta'

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/* ---------------- CARD DESTAQUE ---------------- */

const CardDestaque = ({ anuncio }) => {
  const getImagens = (imagemUrl) => {
    if (!imagemUrl) return []
    try {
      const parsed = JSON.parse(imagemUrl)
      if (Array.isArray(parsed)) return parsed
      return [imagemUrl]
    } catch {
      return [imagemUrl]
    }
  }
  
  const imagens = getImagens(anuncio.imagem_url)
  const imagem = imagens.length > 0 ? imagens[0] : null

  return (
    <Link
      to={`/anuncio/${anuncio.id}`}
      className="group min-w-[320px] max-w-[320px] bg-white rounded-3xl overflow-hidden border border-white/70 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 no-underline"
    >
      <div className="relative h-52 overflow-hidden">
        {imagem ? (
          <img
            src={imagem}
            alt={anuncio.titulo}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-emerald-600" />
          </div>
        )}

        <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white rounded-full text-xs font-medium backdrop-blur-md">
          Destaque
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base line-clamp-2">
          {anuncio.titulo}
        </h3>

        <p className="text-emerald-600 text-xl font-bold mt-2">
          {formatarPreco(anuncio.preco)}
        </p>

        {anuncio.descricao && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {anuncio.descricao}
          </p>
        )}
      </div>
    </Link>
  )
}

/* ---------------- CARD LISTAGEM ---------------- */

const CardUltimo = ({ anuncio }) => {
  const getImagens = (imagemUrl) => {
    if (!imagemUrl) return []
    try {
      const parsed = JSON.parse(imagemUrl)
      if (Array.isArray(parsed)) return parsed
      return [imagemUrl]
    } catch {
      return [imagemUrl]
    }
  }
  
  const imagens = getImagens(anuncio.imagem_url)
  const imagem = imagens.length > 0 ? imagens[0] : null

  return (
    <Link
      to={`/anuncio/${anuncio.id}`}
      className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-1 transition-all no-underline"
    >
      <div className="flex gap-4">
        {imagem ? (
          <img
            src={imagem}
            alt={anuncio.titulo}
            className="w-20 h-20 rounded-xl object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-gray-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {anuncio.titulo}
          </h4>

          <p className="text-emerald-600 font-bold mt-1">
            {formatarPreco(anuncio.preco)}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Publicado em {new Date(anuncio.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </Link>
  )
}

/* ---------------- QUICK CARD ---------------- */

const QuickCard = ({ to, title, subtitle, icon }) => (
  <Link
    to={to}
    className="group bg-white/90 backdrop-blur-xl border border-white rounded-3xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all no-underline"
  >
    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
      {icon}
    </div>

    <h3 className="font-semibold text-gray-900">
      {title}
    </h3>

    <p className="text-sm text-gray-500 mt-1">
      {subtitle}
    </p>
  </Link>
)

/* ---------------- CAROUSEL ---------------- */

const Carousel = ({ title, items, children }) => {
  const scrollRef = useRef(null)

  const move = (direction) => {
    if (!scrollRef.current) return

    scrollRef.current.scrollBy({
      left: direction * 350,
      behavior: 'smooth'
    })
  }

  if (!items?.length) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {title}
        </h2>

        <div className="hidden md:flex gap-2">
          <button
            onClick={() => move(-1)}
            className="w-10 h-10 rounded-xl bg-white shadow-sm border flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => move(1)}
            className="w-10 h-10 rounded-xl bg-white shadow-sm border flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>
    </section>
  )
}

/* ---------------- PAGE ---------------- */

const HomePage = () => {
  const [destaques, setDestaques] = useState([])
  const [ultimos, setUltimos] = useState([])
  const [stats, setStats] = useState({
    anuncios: 0,
    servicos: 0,
    indicacoes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarDados()
  }, [])

  const buscarDados = async () => {
    try {
      const agora = new Date().toISOString()

      const [
        destaqueRes,
        ultimosRes,
        anunciosCount,
        servicosCount,
        indicacoesCount
      ] = await Promise.all([
        supabase
          .from('anuncios_vendas')
          .select('*')
          .eq('destaque', true)
          .ilike('status', 'ativo')
          .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('anuncios_vendas')
          .select('*')
          .ilike('status', 'ativo')
          .or(`data_expiracao.is.null,data_expiracao.gt.${agora}`)
          .order('created_at', { ascending: false })
          .limit(6),

        supabase
          .from('anuncios_vendas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Ativo'),

        supabase
          .from('prestadores_servico')
          .select('*', { count: 'exact', head: true })
          .eq('opt_in', true),

        // Tenta buscar indicações silenciosamente (pode não existir)
        supabase
          .from('indicacoes')
          .select('*', { count: 'exact', head: true })
          .then(res => res.error ? { count: 0 } : res)
      ])

      setDestaques(destaqueRes.data || [])
      setUltimos(ultimosRes.data || [])

      setStats({
        anuncios: anunciosCount.count || 0,
        servicos: servicosCount.count || 0,
        indicacoes: indicacoesCount.count || 0
      })
    } catch (error) {
      console.error('Erro HomePage:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white p-8 md:p-12">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex px-4 py-2 bg-white/10 rounded-full text-sm backdrop-blur-md mb-5">
            Bella Vittà Community Hub
          </span>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Tudo que seu condomínio precisa,
            <span className="block text-emerald-100">
              em um só lugar.
            </span>
          </h1>

          <p className="mt-5 text-emerald-50 text-lg max-w-2xl leading-relaxed">
            Encontre prestadores recomendados, anuncie produtos,
            visualize o mapa do residencial e conecte-se com moradores.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/novo-anuncio"
              className="px-6 py-3 bg-white text-emerald-700 rounded-2xl font-semibold no-underline hover:scale-105 transition"
            >
              Criar anúncio
            </Link>

            <Link
              to="/mapa"
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl no-underline"
            >
              Explorar serviços
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg">
            <div>
              <h3 className="text-2xl font-bold">{stats.anuncios}+</h3>
              <p className="text-sm text-emerald-100">Anúncios</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold">{stats.servicos}+</h3>
              <p className="text-sm text-emerald-100">Prestadores</p>
            </div>

            <div>
              <h3 className="text-2xl font-bold">{stats.indicacoes}+</h3>
              <p className="text-sm text-emerald-100">Indicações</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <QuickCard
          to="/mapa"
          title="Prestadores"
          subtitle="Profissionais próximos"
          icon={<Wrench size={22} />}
        />

        <QuickCard
          to="/indicacoes"
          title="Indicações"
          subtitle="Recomendações reais"
          icon={<Star size={22} />}
        />

        <QuickCard
          to="/mapa"
          title="Mapa Satélite"
          subtitle="Encontre rapidamente"
          icon={<MapPin size={22} />}
        />

        <QuickCard
          to="/anuncios"
          title="Marketplace"
          subtitle="Produtos disponíveis"
          icon={<ShoppingBag size={22} />}
        />
      </section>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-white rounded-3xl animate-pulse border"
            />
          ))}
        </div>
      ) : (
        <>
          {destaques.length > 0 && (
            <Carousel title="Destaques da semana" items={destaques}>
              {destaques.map((item) => (
                <CardDestaque key={item.id} anuncio={item} />
              ))}
            </Carousel>
          )}

          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold">
                Últimos anúncios
              </h2>

              <Link
                to="/anuncios"
                className="text-emerald-600 font-medium no-underline"
              >
                Ver todos
              </Link>
            </div>

            {ultimos.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ultimos.map((item) => (
                  <CardUltimo key={item.id} anuncio={item} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border">
                <h3 className="text-xl font-semibold text-gray-900">
                  Nenhum anúncio disponível
                </h3>

                <p className="text-gray-500 mt-2">
                  Seja o primeiro morador a publicar algo.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {/* BLOCO DE CONFIANÇA */}
      <section className="bg-white rounded-3xl p-8 border border-gray-100">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <Shield className="mx-auto text-emerald-600 mb-3" />
            <h3 className="text-xl font-bold">Segurança</h3>
            <p className="text-gray-500 mt-2">Exclusivo para moradores</p>
          </div>

          <div>
            <Users className="mx-auto text-emerald-600 mb-3" />
            <h3 className="text-xl font-bold">Comunidade</h3>
            <p className="text-gray-500 mt-2">Fortaleça conexões locais</p>
          </div>

          <div>
            <Sparkles className="mx-auto text-emerald-600 mb-3" />
            <h3 className="text-xl font-bold">Praticidade</h3>
            <p className="text-gray-500 mt-2">Tudo centralizado</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="rounded-3xl bg-gray-900 text-white p-10 text-center">
        <h2 className="text-3xl font-bold">
          Tem algo parado em casa?
        </h2>

        <p className="text-gray-300 mt-3 max-w-xl mx-auto">
          Venda para quem mora perto com mais praticidade,
          confiança e sem aquela novela de marketplace externo.
        </p>

        <Link
          to="/novo-anuncio"
          className="inline-flex mt-6 px-6 py-3 bg-emerald-500 rounded-2xl font-semibold text-white no-underline hover:bg-emerald-600"
        >
          Criar anúncio agora
        </Link>
      </section>

    </div>
  )
}

export default HomePage