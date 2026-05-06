// src/components/FormIndicacao.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FormIndicacao = ({ onSucesso, onFechar }) => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const [form, setForm] = useState({
    categoria: '',
    nome_profissional: '',
    descricao: '',
    contato_whatsapp: '',
    contato_telefone: '',
    instagram_url: '',
    site_url: '',
    endereco: '',
    servicos_texto: '',
    condicoes_moradores: '',
  })

  useEffect(() => {
    supabase
      .from('categorias')
      .select('*')
      .in('tipo', ['indicacao', 'ambos'])
      .order('ordem')
      .then(({ data }) => setCategorias(data || []))
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.nome_profissional.trim()) {
      setError('Nome do profissional é obrigatório.')
      setLoading(false)
      return
    }
    if (!form.categoria) {
      setError('Selecione uma categoria.')
      setLoading(false)
      return
    }

    try {
      const servicosArray = form.servicos_texto
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      const { error: err } = await supabase.from('indicacoes').insert({
        categoria: form.categoria,
        nome_profissional: form.nome_profissional.trim(),
        descricao: form.descricao.trim() || null,
        contato_whatsapp: form.contato_whatsapp.trim() || null,
        contato_telefone: form.contato_telefone.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        site_url: form.site_url.trim() || null,
        endereco: form.endereco.trim() || null,
        servicos: servicosArray.length > 0 ? servicosArray : null,
        condicoes_moradores: form.condicoes_moradores.trim() || null,
      })

      if (err) throw err

      setSucesso(true)
      setTimeout(() => {
        if (onSucesso) onSucesso()
      }, 1500)
    } catch (err) {
      console.error('Erro ao salvar indicação:', err)
      setError(err.message || 'Falha ao salvar indicação.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-gray-900">Indicação enviada!</h3>
        <p className="text-gray-500 text-sm mt-1">Obrigado por contribuir com a comunidade.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
          required
        >
          <option value="">Selecione...</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.nome}>
              {cat.icone ? `${cat.icone} ` : ''}{cat.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do profissional ou empresa *</label>
        <input
          type="text"
          name="nome_profissional"
          value={form.nome_profissional}
          onChange={handleChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ex: João Encanamentos"
          disabled={loading}
          required
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          name="descricao"
          value={form.descricao}
          onChange={handleChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Por que recomenda? Qual a qualidade?"
          rows={3}
          disabled={loading}
        />
      </div>

      {/* WhatsApp + Telefone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            type="text"
            name="contato_whatsapp"
            value={form.contato_whatsapp}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(16) 99999-9999"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone fixo</label>
          <input
            type="text"
            name="contato_telefone"
            value={form.contato_telefone}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(16) 3456-7890"
            disabled={loading}
          />
        </div>
      </div>

      {/* Instagram + Site */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
          <input
            type="text"
            name="instagram_url"
            value={form.instagram_url}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="@usuario ou link completo"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
          <input
            type="text"
            name="site_url"
            value={form.site_url}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="www.site.com.br"
            disabled={loading}
          />
        </div>
      </div>

      {/* Endereço */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (fora do condomínio)</label>
        <input
          type="text"
          name="endereco"
          value={form.endereco}
          onChange={handleChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Rua, número, bairro, cidade"
          disabled={loading}
        />
      </div>

      {/* Serviços oferecidos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Serviços oferecidos</label>
        <input
          type="text"
          name="servicos_texto"
          value={form.servicos_texto}
          onChange={handleChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Separe por vírgula: Reparo, Instalação, Manutenção"
          disabled={loading}
        />
        <p className="text-[11px] text-gray-400 mt-1">Separe cada serviço por vírgula</p>
      </div>

      {/* Condições para moradores */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condições especiais para moradores</label>
        <input
          type="text"
          name="condicoes_moradores"
          value={form.condicoes_moradores}
          onChange={handleChange}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ex: 10% de desconto | Sem taxa de visita | Orçamento grátis"
          disabled={loading}
        />
        <p className="text-[11px] text-amber-600 mt-1">⭐ Esse campo aparece em destaque no card da indicação</p>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white text-sm transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Enviando...' : 'Enviar Indicação'}
        </button>
      </div>
    </form>
  )
}

export default FormIndicacao