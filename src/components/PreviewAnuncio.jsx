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

  // Mantendo funções existentes - apenas adicionando novas abaixo
  
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
      // Validação básica
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Imagem muito grande. Máximo 5MB.')
        return
      }
      
      setImagemFile(file)
      
      // Criar preview local
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

  // 🔥 NOVA FUNÇÃO: Upload de imagem para Supabase Storage
  const uploadImagemParaSupabase = async (file, anuncioId) => {
    if (!file) return null
    
    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${anuncioId}-${Date.now()}.${fileExt}`
    const filePath = `anuncios/${fileName}`
    
    // Upload para o bucket 'anuncios' (crie este bucket no Supabase Storage)
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('anuncios') // ⚠️ Certifique-se que este bucket existe e é PÚBLICO
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      throw new Error(`Falha ao enviar imagem: ${uploadError.message}`)
    }

    // Obter URL pública [[29]]
    const { data: { publicUrl } } = supabase
      .storage
      .from('anuncios')
      .getPublicUrl(filePath)

    return publicUrl
  }

  // 🔥 NOVA FUNÇÃO PRINCIPAL: handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Validar campos obrigatórios
      if (!formData.titulo.trim()) {
        throw new Error('Título é obrigatório')
      }
      if (!formData.preco || parseFloat(formData.preco) <= 0) {
        throw new Error('Preço válido é obrigatório')
      }
      if (!formData.descricao.trim()) {
        throw new Error('Descrição é obrigatória')
      }

      // 2. Inserir registro na tabela anuncios_vendas PRIMEIRO (para gerar o ID)
      // Schema: id uuid (auto), titulo, preco, descricao, imagem_url, status, data_expiracao
      const { data: anuncioData, error: insertError } = await supabase
        .from('anuncios_vendas')
        .insert({
          titulo: formData.titulo.trim(),
          preco: parseFloat(formData.preco),
          descricao: formData.descricao.trim(),
          imagem_url: null, // Será atualizado após upload
          status: formData.status || 'Ativo',
          data_expiracao: formData.data_expiracao ? new Date(formData.data_expiracao).toISOString() : null
        })
        .select() // Retorna os dados inseridos
        .single()

      if (insertError) {
        console.error('Erro ao inserir anúncio:', insertError)
        throw new Error(`Falha ao salvar anúncio: ${insertError.message}`)
      }

      // 3. Se houver imagem, fazer upload e atualizar o registro
      let imagemUrlFinal = null
      
      if (imagemFile) {
        try {
          imagemUrlFinal = await uploadImagemParaSupabase(imagemFile, anuncioData.id)
          
          // Atualizar o registro com a URL da imagem [[44]]
          const { error: updateError } = await supabase
            .from('anuncios_vendas')
            .update({ imagem_url: imagemUrlFinal })
            .eq('id', anuncioData.id)

          if (updateError) {
            console.warn('Aviso: Anúncio salvo, mas falha ao atualizar URL da imagem:', updateError)
            // Não lança erro para não perder o anúncio já criado
          }
        } catch (uploadErr) {
          console.warn('Aviso: Anúncio salvo, mas falha no upload da imagem:', uploadErr)
          // Continua sem imagem - o anúncio ainda é válido
        }
      }

      // 4. Sucesso!
      setSuccess('Anúncio publicado com sucesso! 🎉')
      
      // Callback opcional para o componente pai
      if (onAnuncioCriado) {
        onAnuncioCriado({
          ...anuncioData,
          imagem_url: imagemUrlFinal || anuncioData.imagem_url
        })
      }

      // 5. Resetar formulário após 2 segundos
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

  // Função auxiliar para formatar preço (mantendo existente se houver)
  const formatarPreco = (valor) => {
    if (!valor) return ''
    const num = parseFloat(valor)
    return isNaN(num) ? '' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // JSX do componente (estrutura base - ajuste conforme seu layout existente)
  return (
    <div className="preview-anuncio-container p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Novo Anúncio</h2>
      
      {/* Mensagens de feedback */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo: Título */}
        <div>
          <label className="block text-sm font-medium mb-1">Título *</label>
          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Bicicleta Mountain Bike"
            disabled={loading}
            required
          />
        </div>

        {/* Campo: Preço */}
        <div>
          <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
          <input
            type="number"
            name="preco"
            value={formData.preco}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 1500.00"
            step="0.01"
            min="0"
            disabled={loading}
            required
          />
          {formData.preco && (
            <p className="text-sm text-gray-500 mt-1">
              {formatarPreco(formData.preco)}
            </p>
          )}
        </div>

        {/* Campo: Descrição */}
        <div>
          <label className="block text-sm font-medium mb-1">Descrição *</label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Descreva seu produto ou serviço..."
            rows="4"
            disabled={loading}
            required
          />
        </div>

        {/* Campo: Imagem */}
        <div>
          <label className="block text-sm font-medium mb-1">Foto do Produto</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="flex-1"
              disabled={loading}
            />
            {imagemPreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-red-500 hover:text-red-700 text-sm"
                disabled={loading}
              >
                Remover
              </button>
            )}
          </div>
          
          {/* Preview da imagem */}
          {imagemPreview && (
            <div className="mt-3">
              <img 
                src={imagemPreview} 
                alt="Preview" 
                className="max-h-48 rounded-lg object-cover border"
              />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Máximo 5MB • Formatos: JPG, PNG, WebP
          </p>
        </div>

        {/* Campo: Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="Ativo">Ativo</option>
            <option value="Vendido">Vendido</option>
            <option value="Expirado">Expirado</option>
          </select>
        </div>

        {/* Campo: Data de Expiração */}
        <div>
          <label className="block text-sm font-medium mb-1">Expirar em (opcional)</label>
          <input
            type="date"
            name="data_expiracao"
            value={formData.data_expiracao}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Botão de Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded font-medium text-white transition-colors
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
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

      {/* Preview do Card (opcional - para visualização em tempo real) */}
      {(formData.titulo || formData.preco || formData.descricao) && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-3">Preview do Anúncio:</h3>
          <div className="bg-white p-4 rounded shadow-sm">
            {imagemPreview && (
              <img 
                src={imagemPreview} 
                alt="Preview do produto" 
                className="w-full h-40 object-cover rounded mb-3"
              />
            )}
            <h4 className="font-bold text-lg">{formData.titulo || 'Título do anúncio'}</h4>
            <p className="text-blue-600 font-semibold my-1">
              {formatarPreco(formData.preco) || 'R$ 0,00'}
            </p>
            <p className="text-gray-600 text-sm">
              {formData.descricao || 'Descrição do produto...'}
            </p>
            <div className="mt-2 flex gap-2">
              <span className={`px-2 py-1 text-xs rounded ${
                formData.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                formData.status === 'Vendido' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {formData.status}
              </span>
              {formData.data_expiracao && (
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
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