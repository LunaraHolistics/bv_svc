// src/components/PreviewAnuncio.jsx
import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white'

const PreviewAnuncio = ({ onAnuncioCriado, onClose }) => {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    titulo: '',
    preco: '',
    descricao: '',
    status: 'Ativo',
    data_expiracao: ''
  })

  const [imagens, setImagens] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fileInputRef = useRef(null)

  const resetFormulario = () => {
    setFormData({
      titulo: '',
      preco: '',
      descricao: '',
      status: 'Ativo',
      data_expiracao: ''
    })
    setImagens([])
    setError(null)
    setSuccess(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setError(null)
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])

    if (!files.length) return

    const novas = files.filter((f) => {
      if (!f.type.startsWith('image/')) {
        setError(`${f.name} não é uma imagem válida.`)
        return false
      }
      if (f.size > 5 * 1024 * 1024) {
        setError(`${f.name} excede 5MB.`)
        return false
      }
      return true
    })

    if (!novas.length) return

    setError(null)

    const total = imagens.length + novas.length

    if (total > 6) {
      setError(`Máximo 6 fotos. Você já tem ${imagens.length} e selecionou ${novas.length}.`)
      return
    }

    novas.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagens((prev) => [...prev, { file, preview: reader.result }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removerImagem = (index) => {
    setImagens((prev) => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatarPreco = (valor) => {
    if (!valor) return ''
    const num = parseFloat(valor)
    if (isNaN(num)) return ''
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!user) {
        throw new Error('Faça login para publicar um anúncio.')
      }

      if (!formData.titulo.trim()) {
        throw new Error('Título é obrigatório.')
      }

      if (!formData.preco || parseFloat(formData.preco) <= 0) {
        throw new Error('Informe um preço válido.')
      }

      if (!formData.descricao.trim()) {
        throw new Error('Descrição é obrigatória.')
      }

      if (formData.data_expiracao) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataSelecionada = new Date(formData.data_expiracao)
        dataSelecionada.setHours(0, 0, 0, 0)
        if (dataSelecionada < hoje) {
          throw new Error('Escolha uma data futura para expiração.')
        }
      }

      const { data: anuncioData, error: insertError } = await supabase
        .from('anuncios_vendas')
        .insert({
          titulo: formData.titulo.trim(),
          preco: parseFloat(formData.preco),
          descricao: formData.descricao.trim(),
          imagem_url: null,
          status: formData.status || 'Ativo',
          data_expiracao: formData.data_expiracao
            ? new Date(formData.data_expiracao).toISOString()
            : null,
          usuario_id: user.id
        })
        .select()
        .single()

      if (insertError) throw new Error(insertError.message)

      let urlsSalvas = []

      if (imagens.length > 0) {
        const uploads = imagens.map(async (img, index) => {
          const ext = img.file.name.split('.').pop()
          const filePath = `anuncios/${anuncioData.id}-${index}-${Date.now()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('anuncios')
            .upload(filePath, img.file, {
              cacheControl: '3600',
              upsert: false,
              contentType: img.file.type
            })

          if (uploadError) throw new Error(`Falha no upload de ${img.file.name}: ${uploadError.message}`)

          const {
            data: { publicUrl }
          } = supabase.storage
            .from('anuncios')
            .getPublicUrl(filePath)

          return publicUrl
        })

        urlsSalvas = await Promise.all(uploads)
      }

      const imagemUrlFinal = urlsSalvas.length > 0
        ? JSON.stringify(urlsSalvas)
        : null

      const { error: updateError } = await supabase
        .from('anuncios_vendas')
        .update({ imagem_url: imagemUrlFinal })
        .eq('id', anuncioData.id)

      if (updateError) console.warn('[Anuncio] Aviso avatar:', updateError.message)

      setSuccess('Anúncio publicado com sucesso!')

      if (onAnuncioCriado) {
        setTimeout(() => {
          onAnuncioCriado({ ...anuncioData, imagem_url: imagemUrlFinal })
        }, 1000)
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao publicar o anúncio.')
    } finally {
      setLoading(false)
    }
  }

  const temConteudo = formData.titulo || formData.preco || formData.descricao

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Novo Anúncio
      </h2>

      {!user && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl mb-5 text-sm">
          Faça login para publicar anúncios no marketplace do condomínio.{' '}
          <Link to="/login" className="font-semibold underline text-amber-800">
            Entrar agora
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <input
          type="text"
          name="titulo"
          value={formData.titulo}
          onChange={handleInputChange}
          disabled={loading}
          required
          placeholder="Ex: Bicicleta Mountain Bike"
          className={inputClass}
        />

        <div>
          <input
            type="number"
            name="preco"
            value={formData.preco}
            onChange={handleInputChange}
            disabled={loading}
            required
            min="0"
            step="0.01"
            placeholder="1500.00"
            className={inputClass}
          />

          {formData.preco && (
            <p className="text-sm text-emerald-600 font-medium mt-1">
              {formatarPreco(formData.preco)}
            </p>
          )}
        </div>

        <textarea
          name="descricao"
          value={formData.descricao}
          onChange={handleInputChange}
          rows="4"
          disabled={loading}
          required
          placeholder="Descreva seu produto..."
          className={inputClass}
        />

        {/* Fotos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Fotos do produto
            </label>

            <span className="text-xs text-gray-400">
              {imagens.length}/6
            </span>
          </div>

          <div
            onClick={() => !loading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-500 transition"
          >
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-500 text-sm">
              Clique para adicionar fotos
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Máximo 6 fotos • 5MB cada
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={loading}
            className="hidden"
          />

          {imagens.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {imagens.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-24 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => removerImagem(index)}
                    disabled={loading}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {imagens.length === 1 && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ Adicione pelo menos mais 1 foto para o anúncio ficar mais atrativo.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={loading}
              className={inputClass}
            >
              <option value="Ativo">Ativo</option>
              <option value="Vendido">Vendido</option>
              <option value="Expirado">Expirado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expirar em
            </label>

            <input
              type="date"
              name="data_expiracao"
              value={formData.data_expiracao}
              onChange={handleInputChange}
              disabled={loading}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-2xl text-white font-semibold transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
          }`}
        >
          {loading ? 'Publicando...' : 'Publicar anúncio'}
        </button>
      </form>

      {/* Preview */}
      {temConteudo && (
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Preview do anúncio
          </h3>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            {imagens.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {imagens.map((img, index) => (
                  <img
                    key={index}
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-32 h-24 flex-shrink-0 object-cover rounded-xl"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-2xl">
                📷
              </div>
            )}

            <h4 className="font-bold text-gray-900 mt-3">
              {formData.titulo || 'Título'}
            </h4>

            <p className="text-emerald-600 font-bold mt-1">
              {formatarPreco(formData.preco) || 'R$ 0,00'}
            </p>

            <p className="text-sm text-gray-500 mt-2">
              {formData.descricao || 'Descrição do produto'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviewAnuncio