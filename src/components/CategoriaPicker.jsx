// ============================================================================
// src/components/CategoriaPicker.jsx
// Dropdown de nicho (1 serviço = 1 nicho) com descrição do nicho selecionado
// + modal "Solicitar nova categoria" (morador pede, admin aprova).
// ============================================================================
import React, { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const CategoriaPicker = ({ value, onChange, categorias = [], label = 'Categoria (nicho) do serviço' }) => {
  const { user } = useAuth()
  const [solicitando, setSolicitando] = useState(false)
  const [nomeSugerido, setNomeSugerido] = useState('')
  const [descricaoSugestao, setDescricaoSugestao] = useState('')
  const [enviandoSugestao, setEnviandoSugestao] = useState(false)
  const [feedback, setFeedback] = useState('')

  const selecionada = categorias.find(c => c.id === value) || null

  const enviarSolicitacao = async (e) => {
    e.preventDefault()
    if (!user) return alert('Faça login para solicitar uma categoria.')
    if (!nomeSugerido.trim()) return alert('Informe o nome sugerido.')

    setEnviandoSugestao(true)
    const { error } = await supabase
      .from('solicitacoes_categoria')
      .insert({
        solicitante_id: user.id,
        nome_sugerido: nomeSugerido.trim(),
        descricao: descricaoSugestao.trim() || null
      })

    setEnviandoSugestao(false)
    if (error) return alert('Erro ao enviar solicitação: ' + error.message)

    setSolicitando(false)
    setNomeSugerido('')
    setDescricaoSugestao('')
    setFeedback('✅ Solicitação enviada! A administração vai avaliar.')
    setTimeout(() => setFeedback(''), 4000)
  }

  return (
    <div>
      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">{label} *</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
        required
      >
        <option value="">Selecione o nicho do serviço…</option>
        {categorias.map((c, i) => (
          <option key={c.id} value={c.id}>{i + 1}. {c.nome}</option>
        ))}
      </select>

      {selecionada && (
        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
          <p className="text-xs text-emerald-800">{selecionada.descricao}</p>
          {selecionada.exemplos && (
            <p className="text-[11px] text-emerald-600 mt-1">Ex.: {selecionada.exemplos}</p>
          )}
        </div>
      )}

      {feedback && <p className="text-xs text-emerald-600 mt-2">{feedback}</p>}

      <button
        type="button"
        onClick={() => setSolicitando(true)}
        className="text-[11px] text-emerald-600 hover:underline mt-2 cursor-pointer"
      >
        Não encontrou seu nicho? Solicitar nova categoria
      </button>

      {solicitando && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Solicitar nova categoria</h2>
              <button onClick={() => setSolicitando(false)} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer" aria-label="Fechar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={enviarSolicitacao} className="p-5 space-y-3">
              <input
                type="text"
                value={nomeSugerido}
                onChange={(e) => setNomeSugerido(e.target.value)}
                placeholder="Nome do nicho (ex.: Jardinagem e Paisagismo)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
              <textarea
                value={descricaoSugestao}
                onChange={(e) => setDescricaoSugestao(e.target.value)}
                placeholder="Descreva o que entraria nesse nicho (opcional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
              <button
                type="submit"
                disabled={enviandoSugestao}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
              >
                {enviandoSugestao ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriaPicker