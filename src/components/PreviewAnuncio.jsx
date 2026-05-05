// src/components/PreviewAnuncio.jsx
import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const PreviewAnuncio = ({ onAnuncioCriado, onClose }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    preco: '',
    descricao: '',
    status: 'Ativo',
    data_expiracao: ''
  })
  const [imagemPreview, setImagemPreview] = useState(null)
  const [imagemFile, setImagemFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo 5MB.')
        return
      }
      
      setImagemFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagemPreview(reader.result)
      }
      reader.readAsDataURL(file)
      
      setError(null)
    }
  }

  const handleRemoveImage = () => {
    setImagemPreview(null)
    setImagemFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImagemParaSupabase = async (file, anuncioId) => {
    if (!file) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${anuncioId}-${Date.now()}.${fileExt}`
    const filePath = `anuncios/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('anuncios')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      throw new Error(`Falha ao enviar imagem: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('anuncios')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.titulo.trim()) {
        throw new Error('Título é obrigatório')
      }
      if (!formData.preco || parseFloat(formData.preco) <= 0) {
        throw new Error('Preço válido é obrigatório')
      }
      if (!formData.descricao.trim()) {
        throw new Error('Descrição é obrigatória')
      }

      const { data: anuncioData, error: insertError } = await supabase
        .from('anuncios_vendas')
        .insert({
          titulo: formData.titulo.trim(),
          preco: parseFloat(formData.preco),
          descricao: formData.descricao.trim(),
          imagem_url: null,
          status: formData.status || 'Ativo',
          data_expiracao: formData.data_expiracao ? new Date(formData.data_expiracao).toISOString() : null
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erro ao inserir anúncio:', insertError)
        throw new Error(`Falha ao salvar anúncio: ${insertError.message}`)
      }

      let imagemUrlFinal = null
      
      if (imagemFile) {
        try {
          imagemUrlFinal = await uploadImagemParaSupabase(imagemFile, anuncioData.id)
          
          const { error: updateError } = await supabase
            .from('anuncios_vendas')
            .update({ imagem_url: imagemUrlFinal })
            .eq('id', anuncioData.id)

          if (updateError) {
            console.warn('Aviso: Anúncio salvo, mas falha ao atualizar URL da imagem:', updateError)
          }
        } catch (uploadErr) {
          console.warn('Aviso: Anúncio salvo, mas falha no upload da imagem:', uploadErr)
        }
      }

      setSuccess('Anúncio publicado com sucesso!')
      
      if (onAnuncioCriado) {
        onAnuncioCriado({
          ...anuncioData,
          imagem_url: imagemUrlFinal || anuncioData.imagem_url
        })
      }

      setTimeout(() => {
        setFormData({
          titulo: '',
          preco: '',
          descricao: '',
          status: 'Ativo',
          data_expiracao: ''
        })
        setImagemPreview(null)
        setImagemFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setSuccess(null)
        if (onClose) onClose()
      }, 2000)

    } catch (err) {
      console.error('Erro no handleSubmit:', err)
      setError(err.message || 'Ocorreu um erro ao publicar seu anúncio')
    } finally {
      setLoading(false)
    }
  }

  const formatarPreco = (valor) => {
    if (!valor) return ''
    const num = parseFloat(valor)
    return isNaN(num) ? '' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Novo Anúncio</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleInputChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            placeholder="Ex: Bicicleta Mountain Bike"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
          <input
            type="number"
            name="preco"
            value={formData.preco}
            onChange={handleInputChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            placeholder="Ex: 1500.00"
            step="0.01"
            min="0"
            disabled={loading}
            required
          />
          {formData.preco && (
            <p className="text-sm text-emerald-600 font-medium mt-1">
              {formatarPreco(formData.preco)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            placeholder="Descreva seu produto ou serviço..."
            rows="4"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Produto</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              disabled={loading}
            />
            {imagemPreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
                disabled={loading}
              >
                Remover
              </button>
            )}
          </div>
          
          {imagemPreview && (
            <div className="mt-3">
              <img 
                src={imagemPreview} 
                alt="Preview" 
                className="max-h-48 rounded-lg object-cover border border-gray-200"
              />
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Máximo 5MB · Formatos: JPG, PNG, WebP
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              disabled={loading}
            >
              <option value="Ativo">Ativo</option>
              <option value="Vendido">Vendido</option>
              <option value="Expirado">Expirado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expirar em (opcional)</label>
            <input
              type="date"
              name="data_expiracao"
              value={formData.data_expiracao}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors text-sm ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Publicando...
            </span>
          ) : 'Publicar Anúncio'}
        </button>
      </form>

      {/* Preview do Card */}
      {(formData.titulo || formData.preco || formData.descricao) && (
        <div className="mt-8 p-4 border border-gray-200 rounded-xl bg-gray-50">
          <h3 className="font-medium text-sm text-gray-700 mb-3">Preview do Anúncio</h3>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            {imagemPreview && (
              <img 
                src={imagemPreview} 
                alt="Preview do produto" 
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}
            <h4 className="font-bold text-gray-900">{formData.titulo || 'Título do anúncio'}</h4>
            <p className="text-emerald-600 font-bold mt-1">
              {formatarPreco(formData.preco) || 'R$ 0,00'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {formData.descricao || 'Descrição do produto...'}
            </p>
            <div className="mt-2 flex gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                formData.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' :
                formData.status === 'Vendido' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {formData.status}
              </span>
              {formData.data_expiracao && (
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">
                  Expira: {new Date(formData.data_expiracao).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviewAnuncio