// ============================================================================
// src/pages/IndicacoesPage.jsx — VERSÃO EVOLUÍDA E PADRONIZADA
// ----------------------------------------------------------------------------
// ALTERAÇÕES:
// 1. Busca categorias na tabela nova 'categorias_servico' (os 13 nichos).
// 2. Filtro mostra apenas nichos que possuem pelo menos 1 indicação ativa.
// 3. Busca por texto agora ignora acentos e maiúsculas (normTexto).
// 4. Tratamento seguro para o campo 'servicos' (aceita array ou string).
// 5. Visual do Card alinhado com o padrão 'Mapa' e 'Anúncios'.
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import FormIndicacao from "../components/FormIndicacao";

const MASTER_USER_ID = "aaddc383-2f72-45ff-bb01-cec19c695a86";

// Helper para busca sem acentos
const normTexto = (s) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const formatarWhatsapp = (numero) => {
  if (!numero) return null;
  const limpo = String(numero).replace(/\D/g, "");
  return limpo.length >= 10 ? limpo : null;
};

/* ---------------- CARD INDICAÇÃO ---------------- */

const CardIndicacao = ({ indicacao, podeGerenciar, onDelete }) => {
  const whatsapp = formatarWhatsapp(indicacao.contato_whatsapp);

  // Tratamento seguro para 'servicos' (pode vir como string ou array do banco)
  const listaServicos = useMemo(() => {
    if (!indicacao.servicos) return [];
    if (Array.isArray(indicacao.servicos)) return indicacao.servicos;
    if (typeof indicacao.servicos === "string") {
      return indicacao.servicos.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [indicacao.servicos]);

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja EXCLUIR esta indicação?")) {
      onDelete(indicacao.id);
    }
  };

  return (
    <div className="group bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
              {indicacao.nome_profissional || "Profissional"}
            </h3>
            {indicacao.categoria && (
              <span className="inline-flex mt-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] sm:text-xs font-medium">
                {indicacao.categoria}
              </span>
            )}
          </div>
          {Number(indicacao.avaliacao_media) > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
              <span className="text-xs">⭐</span>
              <span className="text-xs font-semibold text-amber-700">
                {Number(indicacao.avaliacao_media).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {indicacao.descricao && (
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mt-3 line-clamp-3">
            {indicacao.descricao}
          </p>
        )}

        {listaServicos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {listaServicos.slice(0, 3).map((servico, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium"
              >
                {servico}
              </span>
            ))}
            {listaServicos.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[10px]">
                +{listaServicos.length - 3}
              </span>
            )}
          </div>
        )}

        {indicacao.condicoes_moradores && (
          <div className="mt-auto pt-3">
            <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-[10px] sm:text-xs text-amber-700 font-medium line-clamp-2">
                🎁 {indicacao.condicoes_moradores}
              </p>
            </div>
          </div>
        )}

        {indicacao.endereco && (
          <p className="text-[10px] text-gray-400 mt-3 truncate">
            📍 {indicacao.endereco}
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 p-3 sm:p-4 flex flex-wrap gap-2 bg-gray-50/50">
        {whatsapp && (
          <a
            href={`https://wa.me/55${whatsapp}?text=${encodeURIComponent(`Olá! Vi sua indicação no Bella Vittà e gostaria de mais informações.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition no-underline"
          >
            💬 WhatsApp
          </a>
        )}
        
        {(indicacao.instagram_url || indicacao.site_url) && (
          <a
            href={
              indicacao.site_url || 
              (indicacao.instagram_url.startsWith("http") ? indicacao.instagram_url : `https://instagram.com/${indicacao.instagram_url.replace("@", "")}`)
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 text-center px-3 py-2 rounded-lg text-xs font-medium no-underline transition ${
              indicacao.site_url 
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            }`}
          >
            {indicacao.site_url ? "🌐 Site" : "📸 Insta"}
          </a>
        )}

        {podeGerenciar && (
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition cursor-pointer border border-red-100"
            title="Excluir indicação"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------------- PAGE PRINCIPAL ---------------- */

const IndicacoesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMaster = user?.id === MASTER_USER_ID;

  const [indicacoes, setIndicacoes] = useState([]);
  const [categoriasOficiais, setCategoriasOficiais] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    buscarDados();
  }, []);

  const handleDeleteIndicacao = async (id) => {
    const { error } = await supabase.from("indicacoes").delete().eq("id", id);
    if (!error) {
      setIndicacoes((prev) => prev.filter((ind) => ind.id !== id));
    } else {
      alert("Erro ao excluir: " + error.message);
    }
  };

  const buscarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resIndicacoes, resCategorias] = await Promise.all([
        supabase
          .from("indicacoes")
          .select("*")
          .eq("status", "ativo")
          .order("created_at", { ascending: false }), // Ordenar por mais recente é mais natural
        // ✅ CORREÇÃO: Busca os 13 nichos oficiais, não a tabela antiga
        supabase
          .from("categorias_servico")
          .select("id, nome")
          .eq("ativa", true)
          .order("ordem", { ascending: true }),
      ]);
      
      if (resIndicacoes.error) throw resIndicacoes.error;
      if (resCategorias.error) throw resCategorias.error;
      
      setIndicacoes(resIndicacoes.data || []);
      setCategoriasOficiais(resCategorias.data || []);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as indicações.");
    } finally {
      setLoading(false);
    }
  };

  // Filtra apenas as categorias oficiais que possuem pelo menos 1 indicação ativa
  const categoriasFiltro = useMemo(() => {
    const contagem = {};
    indicacoes.forEach((i) => {
      if (i.categoria) {
        contagem[i.categoria] = (contagem[i.categoria] || 0) + 1;
      }
    });

    const usadas = categoriasOficiais
      .filter((c) => contagem[c.nome] > 0)
      .map((c) => c.nome);

    return ["Todas", ...usadas];
  }, [indicacoes, categoriasOficiais]);

  const filtradas = useMemo(() => {
    const termo = normTexto(busca);
    return indicacoes.filter((item) => {
      const matchCategoria = filtroCategoria === "Todas" || item.categoria === filtroCategoria;
      
      const nomeMatch = normTexto(item.nome_profissional).includes(termo);
      const descMatch = normTexto(item.descricao).includes(termo);
      const catMatch = normTexto(item.categoria).includes(termo);
      const servicosMatch = Array.isArray(item.servicos) 
        ? item.servicos.some(s => normTexto(s).includes(termo))
        : normTexto(item.servicos).includes(termo);

      const matchBusca = nomeMatch || descMatch || catMatch || servicosMatch;
      
      return matchCategoria && matchBusca;
    });
  }, [indicacoes, filtroCategoria, busca]);

  const mediaGeral = useMemo(() => {
    const avaliadas = indicacoes.filter((i) => Number(i.avaliacao_media) > 0);
    if (!avaliadas.length) return "--";
    const total = avaliadas.reduce((acc, item) => acc + Number(item.avaliacao_media), 0);
    return (total / avaliadas.length).toFixed(1);
  }, [indicacoes]);

  const abrirForm = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setMostrarForm(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 md:p-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-6 sm:gap-8 md:gap-10">
          <div className="flex-1 min-w-0">
            <span className="inline-flex px-4 py-2 rounded-full bg-white/10 text-xs font-medium backdrop-blur-md mb-4">
              Rede de confiança
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight max-w-2xl">
              Profissionais recomendados por vizinhos reais
            </h1>
            <p className="mt-4 text-blue-100 max-w-xl text-sm sm:text-base">
              Encontre prestadores bem avaliados pela comunidade Bella Vittà.
            </p>
            <button
              onClick={abrirForm}
              className="mt-6 px-6 py-3 bg-white text-blue-700 rounded-2xl font-semibold hover:scale-105 transition text-sm sm:text-base cursor-pointer"
            >
              + Fazer indicação
            </button>
          </div>

          <div className="hidden sm:block shrink-0 w-36 md:w-48 lg:w-60 aspect-square">
            <img
              src="/indicacoes-hero.png"
              alt="Vizinha recomendando profissional"
              className="w-full h-full object-cover rounded-2xl sm:rounded-3xl shadow-xl shadow-black/25 ring-1 ring-white/15"
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 text-center">
          <p className="text-[10px] sm:text-sm text-gray-500">Profissionais</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-gray-900">{indicacoes.length}</h3>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 text-center">
          <p className="text-[10px] sm:text-sm text-gray-500">Categorias</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-gray-900">
            {categoriasFiltro.length - 1}
          </h3>
        </div>
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 text-center">
          <p className="text-[10px] sm:text-sm text-gray-500">Avaliação média</p>
          <h3 className="text-xl sm:text-2xl font-bold mt-1 text-amber-500">{mediaGeral}</h3>
        </div>
      </section>

      {/* FILTROS */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-5 space-y-4">
        <div className="relative">
          <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar profissional, serviço ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriasFiltro.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition cursor-pointer ${
                filtroCategoria === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* LISTAGEM */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-8 sm:p-12 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Nenhuma indicação encontrada
          </h3>
          <p className="text-gray-500 mt-2 text-sm">
            Tente outro filtro ou seja o primeiro a indicar alguém.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filtradas.map((item) => (
            <CardIndicacao
              key={item.id}
              indicacao={item}
              podeGerenciar={user ? item.indicado_por === user.id || isMaster : false}
              onDelete={handleDeleteIndicacao}
            />
          ))}
        </div>
      )}

      {/* CTA FINAL */}
      <section className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">
          Conhece um profissional excelente?
        </h2>
        <p className="text-blue-100 mt-2 text-sm sm:text-base max-w-lg mx-auto">
          Ajude a comunidade compartilhando boas experiências e fortalecendo a rede de confiança.
        </p>
        <button
          onClick={abrirForm}
          className="mt-5 px-6 py-3 bg-white text-blue-700 rounded-2xl font-semibold hover:scale-105 transition cursor-pointer text-sm sm:text-base"
        >
          Indicar agora
        </button>
      </section>

      {/* MODAL FORM */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Nova indicação
              </h2>
              <button
                onClick={() => setMostrarForm(false)}
                className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer p-1 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <FormIndicacao
              onSucesso={() => {
                setMostrarForm(false);
                buscarDados();
              }}
              onFechar={() => setMostrarForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicacoesPage;