// ============================================================================
// src/components/GerenciadorCategorias.jsx
// Seção do Painel ADM: criar nichos, ativar/desativar e aprovar/recusar
// solicitações enviadas pelos moradores.
// ============================================================================
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GerenciadorCategorias = () => {
  const [categorias, setCategorias] = useState([])
  const [solicitacoes, setSolicitacoes] = useState([])
  const [loading, setLoading] = useState(true)

  const [novoNome, setNovoNome] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novosExemplos, setNovosExemplos] = useState('')
  const [criando, setCriando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const [{ data: cats }, { data: sols }] = await Promise.all([
      supabase.from('categorias_servico').select('*').order('ordem', { ascending: true }),
      supabase
        .from('solicitacoes_categoria')
        .select('*, solicitante:perfis(nome_completo)')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
    ])
    setCategorias(cats || [])
    setSolicitacoes(sols || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const criarCategoria = async (e) => {
    e.preventDefault()
    if (!novoNome.trim()) return alert('Informe o nome do nicho.')
    setCriando(true)
    const slug = novoNome.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const maxOrdem = categorias.reduce((m, c) => Math.max(m, c.ordem || 0), 0)
    const { error } = await supabase
      .from('categorias_servico')
      .insert({ nome: novoNome.trim(), slug, descricao: novaDescricao.trim() || '', exemplos: novosExemplos.trim() || '', ordem: maxOrdem + 1 })
    setCriando(false)
    if (error) return alert('Erro ao criar: ' + error.message)
    setNovoNome(''); setNovaDescricao(''); setNovosExemplos('')
    carregar()
  }

  const toggleAtiva = async (cat) => {
    await supabase.from('categorias_servico').update({ ativa: !cat.ativa }).eq('id', cat.id)
    carregar()
  }

  const resolverSolicitacao = async (sol, aprovar) => {
    if (aprovar) {
      const slug = sol.nome_sugerido.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const maxOrdem = categorias.reduce((m, c) => Math.max(m, c.ordem || 0), 0)
      const { error } = await supabase
        .from('categorias_servico')
        .insert({ nome: sol.nome_sugerido.trim(), slug, descricao: sol.descricao || '', exemplos: '', ordem: maxOrdem + 1 })
      if (error) return alert('Erro ao criar categoria: ' + error.message)
    }
    await supabase
      .from('solicitacoes_categoria')
      .update({ status: aprovar ? 'aprovada' : 'recusada', resolvida_em: new Date().toISOString() })
      .eq('id', sol.id)
    carregar()
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 grid md:grid-cols-2 gap-6">
      {/* CRIAR / LISTAR NICHOS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🗂️ Nichos de serviço</h2>

        <form onSubmit={criarCategoria} className="space-y-3 mb-6">
          <input type="text" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do novo nicho" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" required />
          <input type="text" value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} placeholder="Descrição curta (o que entra aqui)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
          <input type="text" value={novosExemplos} onChange={(e) => setNovosExemplos(e.target.value)} placeholder="Exemplos (ex.: jardineiro, paisagista)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-400" />
          <button type="submit" disabled={criando} className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition disabled:opacity-50 cursor-pointer">
            {criando ? 'Criando...' : '+ Criar nicho'}
          </button>
        </form>

        {loading ? <p className="text-gray-400 text-sm">Carregando...</p> : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {categorias.map((c, i) => (
              <div key={c.id} className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${c.ativa ? 'bg-gray-50 border-gray-100' : 'bg-red-50 border-red-100 opacity-70'}`}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{i + 1}. {c.nome}</p>
                  <p className="text-[11px] text-gray-500 truncate">{c.descricao}</p>
                </div>
                <button onClick={() => toggleAtiva(c)} className={`shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${c.ativa ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
                  {c.ativa ? 'Ativa' : 'Inativa'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOLICITAÇÕES DE MORADORES */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📥 Solicitações de novo nicho ({solicitacoes.length})</h2>
        {loading ? <p className="text-gray-400 text-sm">Carregando...</p> :
          solicitacoes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma solicitação pendente.</p>
          ) : (
            <div className="space-y-3">
              {solicitacoes.map((s) => (
                <div key={s.id} className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm font-semibold text-gray-800">{s.nome_sugerido}</p>
                  {s.descricao && <p className="text-xs text-gray-600 mt-1">{s.descricao}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">
                    Por: {s.solicitante?.nome_completo || 'Morador'} • {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => resolverSolicitacao(s, true)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-[11px] font-bold hover:bg-green-700 cursor-pointer">✅ Aprovar (cria o nicho)</button>
                    <button onClick={() => resolverSolicitacao(s, false)} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-200 cursor-pointer">Recusar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

export default GerenciadorCategorias