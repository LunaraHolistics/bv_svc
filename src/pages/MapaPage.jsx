// ============================================================================
// src/pages/MapaPage.jsx — VERSÃO FINAL ESTÁVEL E OTIMIZADA
// ----------------------------------------------------------------------------
// - Layout do card otimizado: Avatar → Chips → Imagem (fixa) → Texto → Botões
// - Carrossel automático discreto (4s) com aspect-ratio fixo (não estica o card)
// - Contadores corretos (Prestadores únicos vs Total de Serviços)
// - Filtros e busca robustos (sem acentos, inclui serviços oferecidos)
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import useCategorias from "../hooks/useCategorias";
import LegendaCategorias from "../components/LegendaCategorias";

const MASTER_USER_ID = "aaddc383-2f72-45ff-bb01-cec19c695a86";
const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps/d/u/1/embed?mid=1XFELlB7i9JmH3FVd6wR3O8HQ1nAdTSo&ehbc=2E312F";

const formatarWhatsapp = (numero) => {
  if (!numero) return null;
  const limpo = String(numero).replace(/\D/g, "");
  return limpo.length >= 10 ? limpo : null;
};

const normalizeAddr = (addr) => {
  if (!addr) return "";
  return addr
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/(rua|av|avenida|nº|numero|casa|lote|quadra|bloco)\s*/gi, "")
    .replace(/\s+/g, "")
    .trim();
};

const normTexto = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

/* ---------------- CARD INTERNO (Layout Revista - Texto ao Redor da Imagem) ---------------- */

const CardConteudo = ({ prestador, onDelete, isFront, onBringToFront }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const whatsapp = formatarWhatsapp(prestador.whatsapp)
  const nomeInicial = prestador.nome?.charAt(0)?.toUpperCase() || '🏡'

  const isMaster = user?.id === MASTER_USER_ID
  const isOwner = user?.id === prestador.usuario_id
  const canManage = isMaster || isOwner

  const [expanded, setExpanded] = useState(false)

  const whatsappLink = useMemo(() => {
    if (!whatsapp) return null
    const servico = prestador.categoria_nome || prestador.categoria || 'serviço disponível'
    return `https://wa.me/55${whatsapp}?text=${encodeURIComponent(`Olá, também sou morador do Bella Vittà e quero conversar sobre seu serviço de ${servico}`)}`
  }, [whatsapp, prestador])

  const imagens = useMemo(() => {
    if (!prestador.imagens_url) return []
    try {
      const parsed = JSON.parse(prestador.imagens_url)
      return Array.isArray(parsed) ? parsed : [prestador.imagens_url]
    } catch {
      return [prestador.imagens_url]
    }
  }, [prestador.imagens_url])

  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    if (imagens.length <= 1) return
    const timer = setInterval(() => setImgIndex((prev) => (prev + 1) % imagens.length), 4000)
    return () => clearInterval(timer)
  }, [imagens.length])

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm(`Deseja realmente excluir o serviço de ${prestador.nome}?`)) {
      await onDelete(prestador.id)
    }
  }

  const handleCardClick = () => {
    if (isFront) navigate(`/servico/${prestador.id}`)
    else onBringToFront()
  }

  const handleVerMais = (e) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  return (
    <div onClick={handleCardClick} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      
      {/* ===== CABEÇALHO: Avatar + Nome + Chips ===== */}
      <div className="p-3 sm:p-4 pb-2">
        <div className="flex items-start gap-2">
          <div className="relative shrink-0">
            {prestador.avatar_do_perfil ? (
              <img src={prestador.avatar_do_perfil} alt={prestador.nome} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover border-2 border-white shadow-sm" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex' }} />
            ) : null}
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center border-2 border-white shadow-sm ${prestador.avatar_do_perfil ? 'hidden' : 'flex'}`}>
              <span className="text-emerald-700 font-bold text-xs sm:text-sm">{nomeInicial}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 truncate text-xs sm:text-sm">{prestador.nome || 'Prestador'}</h3>
            {prestador.nome_fantasia && <p className="text-[10px] sm:text-xs text-emerald-600 truncate">{prestador.nome_fantasia}</p>}
            {prestador.casa_numero && <p className="text-[9px] sm:text-[10px] text-gray-500 truncate"> {prestador.casa_numero}</p>}
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {prestador.destaque && <span className="inline-flex px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[8px] sm:text-[10px] font-medium">⭐ Destaque</span>}
          {(prestador.categoria_nome || prestador.categoria) && <span className="inline-flex px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] sm:text-[10px] font-medium">{prestador.categoria_nome || prestador.categoria}</span>}
          {imagens.length > 0 && <span className="inline-flex px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[8px] sm:text-[10px] font-medium">📸 {imagens.length}</span>}
        </div>
      </div>

      {/* ===== CONTEÚDO: Imagem + Texto no MESMO bloco ===== */}
      <div className="px-3 sm:px-4 pb-3 flex-1 flex flex-col">
        
        {/* Bloco único com imagem flutuante + texto fluindo ao redor */}
        <div className="mb-2">
          {imagens.length > 0 && (
            <div className="float-left mr-3 mb-1 w-[35%] sm:w-[40%] relative">
              <div className="w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={imagens[imgIndex]} alt={prestador.nome_fantasia || prestador.nome} className="w-full h-full object-cover transition-opacity duration-500" />
              </div>
              {/* ✅ Dots do carrossel: SÓ aparecem quando NÃO é o dono (para não atrapalhar os botões) */}
              {imagens.length > 1 && !canManage && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                  {imagens.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setImgIndex(i) }} className={`h-1 rounded-full transition-all ${i === imgIndex ? 'bg-white w-2' : 'bg-white/60 w-1'}`} aria-label={`Ver imagem ${i + 1}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Texto flui ao redor da imagem flutuante */}
          {(prestador.descricao_comercial || prestador.descricao) && (
            <p className={`text-[10px] sm:text-xs text-gray-600 leading-snug ${expanded ? '' : 'line-clamp-5'}`}>
              {prestador.descricao_comercial || prestador.descricao}
            </p>
          )}

          {/* Limpa o float */}
          <div className="clear-both"></div>

          {/* Link "leia mais" / "ver menos" */}
          {(prestador.descricao_comercial || prestador.descricao)?.length > 100 && (
            <button onClick={handleVerMais} className="text-blue-600 hover:text-blue-700 font-medium text-[10px] sm:text-xs mt-1">
              {expanded ? 'ver menos' : 'leia mais'}
            </button>
          )}
        </div>

        {/* Benefício */}
        {prestador.condicoes_moradores && (
          <div className="mt-2 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
            <p className="text-[9px] sm:text-[10px] text-amber-700 font-medium line-clamp-1">⭐ {prestador.condicoes_moradores}</p>
          </div>
        )}

        {/* ===== BOTÕES DE AÇÃO ===== */}
        {isFront && (
          <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-2">
            {canManage ? (
              /* ✅ DONO/MASTER: 4 botões na mesma linha (WhatsApp, Insta, Site, Editar) + Lixeira separada */
              <div className="flex gap-1.5 items-center">
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 text-white rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-green-600 transition flex-1">
                    💬
                  </a>
                )}
                {prestador.instagram_url && (
                  <a href={prestador.instagram_url.startsWith('http') ? prestador.instagram_url : `https://instagram.com/${prestador.instagram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-2 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md text-[10px] sm:text-xs font-medium no-underline">
                    📸
                  </a>
                )}
                {prestador.site_url && (
                  <a href={prestador.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-2 py-1.5 bg-gray-100 text-gray-700 rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-gray-200 transition">
                    🌐
                  </a>
                )}
                <button onClick={(e) => { e.stopPropagation(); navigate(`/editar-servico/${prestador.id}`) }} className="flex items-center justify-center px-2 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] sm:text-xs font-medium hover:bg-emerald-100 transition cursor-pointer flex-1">
                  ✏️
                </button>
                <button onClick={handleDelete} className="flex items-center justify-center px-2 py-1.5 bg-red-50 text-red-600 rounded-md text-[10px] sm:text-xs font-medium hover:bg-red-100 transition cursor-pointer">
                  🗑️
                </button>
              </div>
            ) : (
              /* ✅ VISITANTE: Só 2 botões (WhatsApp + Site) com ícones */
              <div className="flex gap-1.5">
                {whatsappLink ? (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-green-600 transition flex-1">
                    💬 WhatsApp
                  </a>
                ) : (
                  <div className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-md text-[10px] text-center flex-1">Sem contato</div>
                )}
                {prestador.site_url && (
                  <a href={prestador.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-[10px] sm:text-xs font-medium no-underline hover:bg-gray-200 transition">
                    🌐 Site
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- CARD AGRUPADO (PILHA) ---------------- */

const CardAgrupado = ({ grupo, onDelete }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (activeIdx >= grupo.length) setActiveIdx(0);
  }, [grupo.length, activeIdx]);

  return (
    <div className="relative h-[360px] sm:h-[420px] w-full">
      {grupo.map((prestador, i) => {
        const diff = activeIdx - i;
        const isFront = diff === 0;
        const translateX =
          diff > 0 ? (window.innerWidth < 640 ? diff * 6 : diff * 12) : 0;
        const translateY =
          diff > 0 ? (window.innerWidth < 640 ? diff * 4 : diff * 8) : 0;
        const scale = 1 - Math.abs(diff) * 0.03;
        const opacity = isFront ? 1 : Math.max(0.2, 1 - Math.abs(diff) * 0.25);
        const zIndex = 20 - Math.abs(diff);
        const blur = Math.abs(diff) > 2 ? "blur(2px)" : "none";

        return (
          <div
            key={prestador.id}
            className="absolute inset-0 transition-all duration-300 ease-out overflow-hidden rounded-2xl"
            style={{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              opacity,
              zIndex,
              filter: blur,
            }}
          >
            <CardConteudo
              prestador={prestador}
              onDelete={onDelete}
              isFront={isFront}
              onBringToFront={() => setActiveIdx(i)}
            />
          </div>
        );
      })}

      {grupo.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-1.5 z-50">
          {grupo.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${i === activeIdx ? "bg-emerald-500 scale-125" : "bg-white/90 shadow-sm"}`}
            />
          ))}
        </div>
      )}

      {grupo.length > 1 && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setActiveIdx((prev) => (prev + 1) % grupo.length);
          }}
          className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full bg-emerald-600 text-white text-xs font-bold px-2 py-4 rounded-r-xl shadow-lg cursor-pointer hover:bg-emerald-700 transition z-40 hidden md:flex flex-col items-center justify-center h-24"
        >
          <span className="rotate-90 whitespace-nowrap mb-6">
            +{grupo.length - 1} serviço{grupo.length - 1 > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
};

/* ---------------- PAGE PRINCIPAL ---------------- */

const MapaPage = () => {
  const { user, perfil } = useAuth();
  const [prestadores, setPrestadores] = useState([]);
  const { categorias, loading: loadingCats } = useCategorias({
    comContagem: false,
  });
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [legendaAberta, setLegendaAberta] = useState(false);

  const isMaster = user?.id === MASTER_USER_ID;
  const isAdmin =
    isMaster ||
    perfil?.is_admin_condominio === true ||
    user?.is_admin_condominio === true;

  useEffect(() => {
    buscarDados();
  }, []);

  const buscarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: listaPrestadores, error: resPrestadores } = await supabase
        .from("prestadores_servico")
        .select("*")
        .eq("opt_in", true)
        .order("nome");
      if (resPrestadores) throw resPrestadores;
      const lista = listaPrestadores || [];

      const listaIdsUnicos = [
        ...new Set(lista.map((p) => p.usuario_id).filter(Boolean)),
      ];
      let mapaAvatares = {};
      if (listaIdsUnicos.length > 0) {
        const { data: perfis } = await supabase
          .from("perfis")
          .select("id, avatar_url")
          .in("id", listaIdsUnicos);
        if (perfis)
          perfis.forEach((p) => {
            if (p.avatar_url) mapaAvatares[p.id] = p.avatar_url;
          });
      }

      setPrestadores(
        lista.map((p) => ({
          ...p,
          avatar_do_perfil: p.avatar_url || mapaAvatares[p.usuario_id] || null,
        })),
      );
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os serviços.");
    } finally {
      setLoading(false);
    }
  };

  const prestadoresEnriquecidos = useMemo(() => {
    const mapaCats = new Map(categorias.map((c) => [c.id, c]));
    const mapaPorNome = new Map(categorias.map((c) => [normTexto(c.nome), c]));
    return prestadores.map((p) => {
      let catId = p.categoria_id || null;
      let catNome = catId ? mapaCats.get(catId)?.nome || null : null;
      if (!catId && p.categoria) {
        const hit = mapaPorNome.get(normTexto(p.categoria));
        if (hit) {
          catId = hit.id;
          catNome = hit.nome;
        }
      }
      return { ...p, categoria_id: catId, categoria_nome: catNome };
    });
  }, [prestadores, categorias]);

  const contagensLocais = useMemo(() => {
    const cont = {};
    prestadoresEnriquecidos.forEach((p) => {
      if (p.categoria_id)
        cont[p.categoria_id] = (cont[p.categoria_id] || 0) + 1;
    });
    return cont;
  }, [prestadoresEnriquecidos]);

  const semNicho = useMemo(
    () => prestadoresEnriquecidos.filter((p) => !p.categoria_id),
    [prestadoresEnriquecidos],
  );

  const handleDeleteServico = async (id) => {
    const prestadorBackup = prestadores.find((p) => p.id === id);
    setPrestadores((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase
      .from("prestadores_servico")
      .delete()
      .eq("id", id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
      if (prestadorBackup) setPrestadores((prev) => [...prev, prestadorBackup]);
    }
  };

  const agrupados = useMemo(() => {
    const grupos = new Map();
    const soltos = [];
    prestadoresEnriquecidos.forEach((p) => {
      const key = normalizeAddr(p.casa_numero);
      if (!key) {
        soltos.push([p]);
        return;
      }
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key).push(p);
    });
    return [...soltos, ...Array.from(grupos.values())].map((g) =>
      [...g].sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0)),
    );
  }, [prestadoresEnriquecidos]);

  const gruposFiltrados = useMemo(() => {
    const termo = normTexto(busca);
    const matchServico = (p) => {
      const servicosTexto = Array.isArray(p.servicos_oferecidos)
        ? p.servicos_oferecidos.join(" ")
        : "";
      return [
        p.categoria_nome,
        p.categoria,
        p.descricao_comercial,
        p.descricao,
        servicosTexto,
      ]
        .filter(Boolean)
        .some((item) => normTexto(item).includes(termo));
    };
    const matchPrestador = (p) =>
      [p.nome, p.nome_fantasia, String(p.casa_numero || "")]
        .filter(Boolean)
        .some((item) => normTexto(item).includes(termo));
    const matches = (p) => {
      let ok = true;
      if (filtroCategoria === "sem") ok = ok && !p.categoria_id;
      else if (filtroCategoria !== "todas")
        ok = ok && p.categoria_id === filtroCategoria;
      if (termo) ok = ok && (matchServico(p) || matchPrestador(p));
      return ok;
    };
    return agrupados
      .map((grupo) => grupo.filter(matches))
      .filter((grupo) => grupo.length > 0);
  }, [agrupados, filtroCategoria, busca]);

  const chipsFiltro = useMemo(
    () => categorias.filter((c) => (contagensLocais[c.id] || 0) > 0),
    [categorias, contagensLocais],
  );

  const totalPrestadores = useMemo(
    () => new Set(prestadores.map((p) => p.usuario_id || p.id)).size,
    [prestadores],
  );
  const totalServicos = prestadores.length;
  const totalCasas = useMemo(
    () => new Set(prestadores.map((p) => p.casa_numero).filter(Boolean)).size,
    [prestadores],
  );
  const totalServicosVisiveis = useMemo(
    () => gruposFiltrados.reduce((n, g) => n + g.length, 0),
    [gruposFiltrados],
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ===== HERO ===== */}
      <section className="rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-emerald-700 to-teal-700 text-white p-6 sm:p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-center gap-6 sm:gap-8 md:gap-10">
          <div className="flex-1 min-w-0">
            <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-4">
              🛠️ Serviços e Mapa
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold">
              Serviços da comunidade
            </h1>
            <p className="mt-2 sm:mt-3 text-emerald-100 max-w-2xl text-sm sm:text-base">
              Encontre profissionais que moram ou atuam dentro do Bella Vittà.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-5 sm:mt-6">
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold">
                  {totalPrestadores}
                </p>
                <p className="text-[10px] sm:text-sm text-emerald-100">
                  {totalPrestadores === 1 ? "Prestador" : "Prestadores"}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold">{totalServicos}</p>
                <p className="text-[10px] sm:text-sm text-emerald-100">
                  {totalServicos === 1 ? "Serviço" : "Serviços"}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold">
                  {chipsFiltro.length}
                </p>
                <p className="text-[10px] sm:text-sm text-emerald-100">
                  Categorias
                </p>
              </div>
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <p className="text-xl sm:text-2xl font-bold">{totalCasas}</p>
                <p className="text-[10px] sm:text-sm text-emerald-100">
                  Casas ativas
                </p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block shrink-0 w-36 md:w-48 lg:w-60 aspect-square">
            <img
              src="/servicos-hero.png"
              alt="Ícones de serviços"
              className="w-full h-full object-cover rounded-2xl sm:rounded-3xl shadow-xl shadow-black/25 ring-1 ring-white/15"
            />
          </div>
        </div>
      </section>

      {/* ===== MAPA SATÉLITE ===== */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-emerald-400 overflow-hidden shadow-xl relative">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 z-10 flex items-center gap-2 sm:gap-3 shadow-md">
          <span className="text-xl sm:text-2xl">🛰️</span>
          <div className="min-w-0">
            <h2 className="font-bold text-sm sm:text-base leading-tight truncate">
              Visão por Satélite do Condomínio
            </h2>
            <p className="text-emerald-100 text-[10px] sm:text-xs hidden sm:block">
              Explore as ruas e a região de cima
            </p>
          </div>
        </div>
        <div className="pt-12 sm:pt-14">
          <iframe
            src={GOOGLE_MAPS_EMBED_URL}
            width="100%"
            height="250"
            className="w-full h-[250px] sm:h-[450px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            title="Mapa Satélite"
          />
        </div>
      </div>

      {/* ===== AVISO ADMIN ===== */}
      {isAdmin && semNicho.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ {semNicho.length} serviço(s) visível(is) ainda sem nicho
            classificado:
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {semNicho.map((p) => p.nome).join(" • ")} — edite cada serviço e
            escolha a categoria.
          </p>
        </div>
      )}

      {/* ===== FILTROS ===== */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-5 space-y-4">
        <div className="relative">
          <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, serviço ou casa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base"
          />
        </div>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none items-center">
          <button
            onClick={() => setFiltroCategoria("todas")}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${filtroCategoria === "todas" ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Todas
          </button>
          {chipsFiltro.map((c) => (
            <button
              key={c.id}
              title={c.descricao}
              onClick={() => setFiltroCategoria(c.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${filtroCategoria === c.id ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c.nome} ({contagensLocais[c.id] || 0})
            </button>
          ))}
          {isAdmin && semNicho.length > 0 && (
            <button
              onClick={() => setFiltroCategoria("sem")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${filtroCategoria === "sem" ? "bg-amber-500 text-white shadow-sm" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
            >
              ⚠️ Sem nicho ({semNicho.length})
            </button>
          )}
          <button
            onClick={() => setLegendaAberta(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer whitespace-nowrap"
          >
            📚 Legenda
          </button>
          {(filtroCategoria !== "todas" || busca) && (
            <button
              onClick={() => {
                setFiltroCategoria("todas");
                setBusca("");
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </section>

      {/* ===== LISTAGEM ===== */}
      {loading || loadingCats ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[360px] sm:h-[420px] bg-white rounded-2xl sm:rounded-3xl border border-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
          <p className="text-red-600 text-sm sm:text-base">{error}</p>
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-8 sm:p-12 text-center">
          <div className="text-4xl sm:text-5xl mb-4">🔍</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Nenhum serviço encontrado
          </h3>
          <p className="text-gray-500 mt-2 text-sm">
            Tente ajustar sua busca ou filtros.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Prestadores disponíveis
            </h2>
            <span className="text-xs sm:text-sm text-gray-500">
              {gruposFiltrados.length} endereço(s) • {totalServicosVisiveis}{" "}
              serviço(s)
            </span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-x-6 sm:gap-y-10">
            {gruposFiltrados.map((grupo, index) => (
              <CardAgrupado
                key={`${normalizeAddr(grupo[0]?.casa_numero)}-${index}`}
                grupo={grupo}
                onDelete={handleDeleteServico}
              />
            ))}
          </div>
        </div>
      )}

      <LegendaCategorias
        aberto={legendaAberta}
        onFechar={() => setLegendaAberta(false)}
        categorias={categorias}
      />
    </div>
  );
};

export default MapaPage;