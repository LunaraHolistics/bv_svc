import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const inputClass =
  'w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

const FormIndicacao = ({ onSucesso, onFechar }) => {
  const [categorias, setCategorias] = useState([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  const [form, setForm] = useState({
    categoria: '', nome_profissional: '', descricao: '', contato_whatsapp: '',
    contato_telefone: '', instagram_url: '', site_url: '', endereco: '',
    servicos_texto: '', condicoes_moradores: ''
  })

  // ✅ NOVA VARIÁVEL: O texto exato que a pessoa digitar (para comparar com as categorias)
  const [textoCategoria, setTextoCategoria] = useState('')

  // ✅ NOVO ESTADO: O que foi detectado automaticamente (NULL se não detectou)
  const [categoriaAutoDetectada, setCategoriaAutoDetectada] = useState(null)

  useEffect(() => {
    carregarCategorias()
  }, [])

  // ✅ NOVA LÓGICA: Tenta adivinhar a categoria com base no que a pessoa digitou
  useEffect(() => {
    if (!textoCategoria || !textoCategoria.trim()) {
      setCategoriaAutoDetectada(null)
      return
    }

    const termo = textoCategoria.toLowerCase().trim()

    const encontrada = categorias.find(cat => {
      const catNome = cat.nome.toLowerCase()
      // Verifica se o texto digitado contém a categoria (ex: "pedreiro" bate com "Pedreiro para reparos")
      if (catNome.includes(termo) || termo.includes(catNome)) {
        return cat.nome
      }
    })

    if (encontrada) {
      setCategoriaAutoDetectada(encontrada.nome)
    } else {
      setCategoriaAutoDetectada(null)
    }
  }, [textoCategoria, categorias])

  const carregarCategorias = async () => {
    try {
      setLoadingCategorias(true)
      const { data, error } = await supabase.from('categorias').select('*').in('tipo', ['indicacao', 'ambos']).order('ordem')
      if (error) throw error
      setCategorias(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    } finally {
      setLoadingCategorias(false)
    }
  }

  const resetFormulario = () => {
    setForm({
      categoria: '', nome_profissional: '', descricao: '', contato_whatsapp: '',
      contato_telefone: '', instagram_url: '', site_url: '', endereco: '',
      servicos_texto: '', condicoes_moradores: ''
    })
  }

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))

    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setError(null)

    try {
      if (!form.nome_profissional.trim()) {
        throw new Error('Nome do profissional é obrigatório.')
      }
      if (!form.categoria) {
        throw new Error('Selecione uma categoria.')
      }

      const servicosArray =
        form.servicos_texto
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

      const payload = {
        categoria: form.categoria,
        nome_profissional: form.nome_profissional.trim(),
        descricao: form.descricao.trim() || null,
        contato_whatsapp: form.contato_whatsapp.trim() || null,
        contato_telefone: form.contato_telefone.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        site_url: form.site_url.trim() || null,
        endereco: form.endereco.trim() || null,
        servicos:
          servicosArray.length > 0
            ? servicosArray
            : null,
        condicoes_moradores:
          form.condicoes_moradores.trim() || null
      }

      const { error: insertError } = await supabase
        .from('indicacoes')
        .insert(payload)

      if (insertError) throw new Error(insertError.message)

      setSucesso('Indicação enviada com sucesso! Obrigado por fortalecer a rede do condomínio.')
      resetFormulario()

      setTimeout(() => {
        if (onSucesso) {
          onSucesso()
        }
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
        <div className="text-5xl mb-4">✨</div>

        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
          Indicação enviada com sucesso
        </h3>

        <p className="text-gray-500 mt-2 text-sm">
          Obrigado por fortalecer a rede do condomínio.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-5"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl mb-4 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Categoria com Auto-Detecção */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Categoria *
        </label>

        <select
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          className={inputClass}
          disabled={loading || loadingCategorias}
          required
        >
          <option value="">
            {loadingCategorias
              ? 'Carregando categorias...'
              : !categoriaAutoDetectada
                ? 'Selecione uma categoria...'
                : `✅ "${categoriaAutoDetectada}" (detectado automaticamente)`}
          </option>

          {!loadingCategorias && categorias.length > 0 && (
            categorias.map((cat) => (
              <option key={cat.id} value={cat.nome}>
                {cat.icone ? `${cat.icone} ` : ''}{cat.nome}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Nome */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Nome do profissional *
        </label>

        <input
          type="text"
          name="nome_profissional"
          value={form.nome_profissional}
          onChange={handleChange}
          className={inputClass}
          placeholder="Ex: João Encanamentos"
          disabled={loading}
          required
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Descrição
        </label>

        <textarea
          name="descricao"
          value={form.descricao}
          onChange={handleChange}
          rows="4"
          className={`${inputClass} resize-none`}
          placeholder="Conte por que recomenda este profissional..."
          disabled={loading}
        />
      </div>

      {/* Contatos */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        <input
          type="text"
          name="contato_whatsapp"
          value={form.contato_whatsapp}
          onChange={handleChange}
          className={inputClass}
          placeholder="WhatsApp"
          disabled={loading}
        />

        <input
          type="text"
          name="contato_telefone"
          value={form.contato_telefone}
          onChange={handleChange}
          className={inputClass}
          placeholder="Telefone"
          disabled={loading}
        />
      </div>

      {/* Social */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        <input
          type="text"
          name="instagram_url"
          value={form.instagram_url}
          onChange={handleChange}
          className={inputClass}
          placeholder="Instagram"
          disabled={loading}
        />

        <input
          type="text"
          name="site_url"
          value={form.site_url}
          onChange={handleChange}
          className={inputClass}
          placeholder="Website"
          disabled={loading}
        />
      </div>

      {/* Endereço */}
      <div>
        <input
          type="text"
          name="endereco"
          value={form.endereco}
          onChange={handleChange}
          className={inputClass}
          placeholder="Endereço (opcional)"
          disabled={loading}
        />
      </div>

      {/* Serviços */}
      <div>
        <input
          type="text"
          name="servicos_texto"
          value={form.servicos_texto}
          onChange={handleChange}
          className={inputClass}
          placeholder="Serviços oferecidos (separe por vírgula: Reparo hidráulico, Instalação)"
          disabled={loading}
        />
      </div>

      {/* Benefício */}
      <div>
        <input
          type="text"
          name="condicoes_moradores"
          value={form.condicoes_moradores}
          onChange={handleChange}
          className={inputClass}
          placeholder="Benefício para moradores"
          disabled={loading}
        />

        <p className="text-[10px] sm:text-xs text-amber-600 mt-1.5 sm:mt-2">
          ⭐ Esse benefício aparece em destaque no card da listagem
        </p>
      </div>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            disabled={loading}
            className="px-5 py-2.5 sm:py-3 border border border-gray-200 rounded-xl sm:rounded-2xl text-gray-700 hover:bg-gray-50 transition text-sm cursor-pointer"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-white transition text-sm ${
            loading
              ? 'Enviando...'
              : 'Enviar indicação'
          }`}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            'Enviar indicação'
          )}
        </button>
      </div>
    </form>
  )
}

export default FormIndicacao