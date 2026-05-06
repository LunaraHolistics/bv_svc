import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Link } from 'react-router-dom'

const PreviewAnuncio = ({ onAnuncioCriado, onClose }) => {
  const { user } = useAuth()

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

  const resetFormulario = () => {
    setFormData({
      titulo: '',
      preco: '',
      descricao: '',
      status: 'Ativo',
      data_expiracao: ''
    })

    setImagemPreview(null)
    setImagemFile(null)
    setError(null)
    setSuccess(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    setError(null)

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Selecione apenas arquivos de imagem.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande. Máximo permitido: 5MB.')
      return
    }

    setImagemFile(file)

    const reader = new FileReader()

    reader.onloadend = () => {
      setImagemPreview(reader.result)
    }

    reader.readAsDataURL(file)
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

    const { error: uploadError } = await supabase.storage
      .from('anuncios')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      throw new Error(
        `Falha ao enviar imagem: ${uploadError.message}`
      )
    }

    const {
      data: { publicUrl }
    } = supabase.storage
      .from('anuncios')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const validarFormulario = () => {
    if (!user) {
      throw new Error(
        'Faça login para publicar um anúncio.'
      )
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
        throw new Error(
          'Escolha uma data futura para expiração.'
        )
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      validarFormulario()

      const { data: anuncioData, error: insertError } =
        await supabase
          .from('anuncios_vendas')
          .insert({
            titulo: formData.titulo.trim(),
            preco: parseFloat(formData.preco),
            descricao: formData.descricao.trim(),
            imagem_url: null,
            status: formData.status || 'Ativo',
            data_expiracao: formData.data_expiracao
              ? new Date(
                  formData.data_expiracao
                ).toISOString()
              : null,
            usuario_id: user.id
          })
          .select()
          .single()

      if (insertError) {
        throw new Error(
          `Falha ao salvar anúncio: ${insertError.message}`
        )
      }

      let imagemUrlFinal = null

      if (imagemFile) {
        try {
          imagemUrlFinal =
            await uploadImagemParaSupabase(
              imagemFile,
              anuncioData.id
            )

          const { error: updateError } =
            await supabase
              .from('anuncios_vendas')
              .update({
                imagem_url: imagemUrlFinal
              })
              .eq('id', anuncioData.id)

          if (updateError) {
            console.warn(updateError)
          }
        } catch (uploadErr) {
          console.warn(
            'Anúncio salvo, mas houve falha no upload:',
            uploadErr
          )
        }
      }

      const anuncioFinal = {
        ...anuncioData,
        imagem_url:
          imagemUrlFinal || anuncioData.imagem_url
      }

      setSuccess('Anúncio publicado com sucesso!')

      if (onAnuncioCriado) {
        onAnuncioCriado(anuncioFinal)
      }

      setTimeout(() => {
        resetFormulario()

        if (onClose) {
          onClose()
        }
      }, 1800)
    } catch (err) {
      console.error(err)
      setError(
        err.message ||
          'Ocorreu um erro ao publicar o anúncio.'
      )
    } finally {
      setLoading(false)
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

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Novo Anúncio
      </h2>

      {!user && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-5 text-sm">
          Faça login para publicar anúncios no marketplace do condomínio.
          {' '}
          <Link
            to="/login"
            className="font-semibold underline text-amber-800"
          >
            Entrar agora
          </Link>
        </div>
      )}

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

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>

          <input
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleInputChange}
            disabled={loading}
            required
            placeholder="Ex: Bicicleta Mountain Bike"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* preço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço *
          </label>

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
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />

          {formData.preco && (
            <p className="text-sm text-emerald-600 font-medium mt-1">
              {formatarPreco(formData.preco)}
            </p>
          )}
        </div>

        {/* descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição *
          </label>

          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            rows="4"
            disabled={loading}
            required
            placeholder="Descreva seu produto..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* imagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto do produto
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            className="w-full text-sm"
          />

          {imagemPreview && (
            <div className="mt-3">
              <img
                src={imagemPreview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-xl border"
              />

              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 text-red-500 text-sm font-medium"
              >
                Remover imagem
              </button>
            </div>
          )}
        </div>

        {/* status e expiração */}
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {loading ? 'Publicando...' : 'Publicar anúncio'}
        </button>
      </form>

      {/* preview */}
      {(formData.titulo ||
        formData.preco ||
        formData.descricao) && (
        <div className="mt-8 p-4 bg-gray-50 border rounded-xl">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Preview do anúncio
          </h3>

          <div className="bg-white p-4 rounded-xl border shadow-sm">
            {imagemPreview && (
              <img
                src={imagemPreview}
                alt="Preview anúncio"
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}

            <h4 className="font-bold text-gray-900">
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