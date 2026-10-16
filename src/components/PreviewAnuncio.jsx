// ============================================================================
// src/components/PreviewAnuncio.jsx — VERSÃO EVOLUÍDA
// ----------------------------------------------------------------------------
// NOVIDADES:
// 1. Compressão automática de imagens via canvas (máx 1280px, ~80% menor)
// 2. Status travado em "Ativo" na criação (anúncio não nasce morto)
// 3. Contadores de caracteres (título 80 / descrição 600)
// 4. Input de data com min = hoje (bloqueia visualmente data passada)
// 5. Botão Cancelar usando o onClose que já era recebido
// 6. Aviso de sucesso parcial se as fotos falharem após publicar
// ============================================================================

import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const inputClass =
  'w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white'

const MAX_TITULO = 80
const MAX_DESC = 600
const MAX_FOTOS = 6
const MAX_MB_ORIGINAL = 5

// Data de hoje no formato yyyy-mm-dd (para o atributo min do input date)
const hojeISO = () => new Date().toISOString().split('T')[0]

// Comprime a imagem via canvas antes do upload (economiza storage e banda)
const comprimirImagem = (file, maxDim = 1280, quality = 0.82) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff' // fundo branco (evita preto em PNG transparente)
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)
            const nomeBase = file.name.replace(/\.[^.]+$/, '') || 'foto'
            resolve(new File([blob], `${nomeBase}.jpg`, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })

const lerComoDataURL = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })

const PreviewAnuncio = ({ onAnuncioCriado, onClose }) => {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    titulo: '',
    preco: '',
    descricao: '',
    data_expiracao: ''
  })

  const [imagens, setImagens] = useState([])
  const [processandoImagens, setProcessandoImagens] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fileInputRef = useRef(null)

  const resetFormulario = () => {
    setFormData({ titulo: '', preco: '', descricao: '', data_expiracao: '' })
    setImagens([])
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setError(null)
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validas = files.filter((f) => {
      if (!f.type.startsWith('image/')) {
        setError(`${f.name} não é uma imagem válida.`)
        return false
      }
      if (f.size > MAX_MB_ORIGINAL * 1024 * 1024) {
        setError(`${f.name} excede ${MAX_MB_ORIGINAL}MB.`)
        return false
      }
      return true
    })

    if (!validas.length) return

    if (imagens.length + validas.length > MAX_FOTOS) {
      setError(`Máximo ${MAX_FOTOS} fotos. Você já tem ${imagens.length} e selecionou ${validas.length}.`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setError(null)
    setProcessandoImagens(true)

    // Comprime cada imagem antes de guardar no estado
    for (const file of validas) {
      const comprimida = await comprimirImagem(file)
      const preview = await lerComoDataURL(comprimida)
      setImagens((prev) => [...prev, { file: comprimida, preview }])
    }

    setProcessandoImagens(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removerImagem = (index) => {
    setImagens((prev) => prev.filter((_, i) => i !== index))
  }

  const formatarPreco = (valor) => {
    if (!valor) return ''
    const num = parseFloat(valor)
    if (isNaN(num)) return ''
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!user) throw new Error('Faça login para publicar um anúncio.')
      if (formData.titulo.trim().length < 3) throw new Error('Título deve ter pelo menos 3 caracteres.')
      if (!formData.preco || parseFloat(formData.preco) <= 0) throw new Error('Informe um preço válido maior que zero.')
      if (formData.descricao.trim().length < 10) throw new Error('Descreva o produto com pelo menos 10 caracteres.')

      if (formData.data_expiracao) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const dataSelecionada = new Date(formData.data_expiracao)
        dataSelecionada.setHours(0, 0, 0, 0)
        if (dataSelecionada < hoje) throw new Error('Escolha uma data futura para expiração.')
      }

      // ✅ Status fixo em "Ativo" na criação (anúncio não nasce morto)
      const { data: anuncioData, error: insertError } = await supabase
        .from('anuncios_vendas')
        .insert({
          titulo: formData.titulo.trim(),
          preco: parseFloat(formData.preco),
          descricao: formData.descricao.trim(),
          imagem_url: null,
          status: 'Ativo',
          data_expiracao: formData.data_expiracao ? new Date(formData.data_expiracao).toISOString() : null,
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

          const { data: { publicUrl } } = supabase.storage.from('anuncios').getPublicUrl(filePath)
          return publicUrl
        })
        urlsSalvas = await Promise.all(uploads)
      }

      const imagemUrlFinal = urlsSalvas.length > 0 ? JSON.stringify(urlsSalvas) : null

      let avisoFotos = ''
      if (imagemUrlFinal) {
        const { error: updateError } = await supabase
          .from('anuncios_vendas')
          .update({ imagem_url: imagemUrlFinal })
          .eq('id', anuncioData.id)
        if (updateError) avisoFotos = ' (as fotos não foram salvas — edite o anúncio para reenviar)'
      }

      setSuccess(`Anúncio publicado com sucesso!${avisoFotos}`)
      if (onAnuncioCriado) {
        setTimeout(() => onAnuncioCriado({ ...anuncioData, imagem_url: imagemUrlFinal }), 1000)
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
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Novo Anúncio</h2>

      {!user && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl mb-5 text-xs sm:text-sm">
          Faça login para publicar anúncios no marketplace do condomínio.{' '}
          <Link to="/login" className="font-semibold underline text-amber-800">Entrar agora</Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl mb-4 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl mb-4 text-xs sm:text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

        {/* Título */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="titulo" className="block text-xs sm:text-sm font-medium text-gray-700">Título *</label>
            <span className="text-[10px] text-gray-400">{formData.titulo.length}/{MAX_TITULO}</span>
          </div>
          <input
            id="titulo"
            type="text"
            name="titulo"
            value={formData.titulo}
            onChange={handleInputChange}
            disabled={loading}
            required
            maxLength={MAX_TITULO}
            placeholder="Ex: Bicicleta Mountain Bike aro 29"
            className={inputClass}
          />
        </div>

        {/* Preço */}
        <div>
          <label htmlFor="preco" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
          <input
            id="preco"
            type="number"
            name="preco"
            value={formData.preco}
            onChange={handleInputChange}
            disabled={loading}
            required
            min="0.01"
            step="0.01"
            placeholder="1500.00"
            className={inputClass}
          />
          {formData.preco && (
            <p className="text-xs sm:text-sm text-emerald-600 font-medium mt-1">{formatarPreco(formData.preco)}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="descricao" className="block text-xs sm:text-sm font-medium text-gray-700">Descrição *</label>
            <span className="text-[10px] text-gray-400">{formData.descricao.length}/{MAX_DESC}</span>
          </div>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleInputChange}
            rows="4"
            disabled={loading}
            required
            maxLength={MAX_DESC}
            placeholder="Descreva o produto, estado de conservação, tempo de uso..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Fotos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Fotos do produto</label>
            <span className="text-xs text-gray-400">{imagens.length}/{MAX_FOTOS}</span>
          </div>

          <div
            onClick={() => !loading && !processandoImagens && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition ${
              processandoImagens
                ? 'border-emerald-300 bg-emerald-50/50 cursor-wait'
                : 'border-gray-300 cursor-pointer hover:border-emerald-500'
            }`}
          >
            <div className="text-3xl sm:text-4xl mb-2">{processandoImagens ? '⏳' : '📷'}</div>
            <p className="text-gray-500 text-xs sm:text-sm">
              {processandoImagens ? 'Otimizando imagens...' : 'Clique para adicionar fotos'}
            </p>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
              Máximo {MAX_FOTOS} fotos • {MAX_MB_ORIGINAL}MB cada • compressão automática
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={loading || processandoImagens}
            className="hidden"
          />

          {imagens.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {imagens.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-20 sm:h-24 object-cover rounded-lg sm:rounded-xl"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded">CAPA</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removerImagem(index)}
                    disabled={loading}
                    className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 bg-black/60 text-white rounded-full text-[10px] sm:text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {imagens.length === 1 && (
            <p className="text-[10px] sm:text-xs text-amber-600 mt-2">
              ⚠️ Adicione pelo menos mais 1 foto para o anúncio ficar mais atrativo.
            </p>
          )}
        </div>

        {/* Expiração + Status informativo */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="data_expiracao" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Expirar em (opcional)
            </label>
            <input
              id="data_expiracao"
              type="date"
              name="data_expiracao"
              value={formData.data_expiracao}
              onChange={handleInputChange}
              disabled={loading}
              min={hojeISO()}
              className={inputClass}
            />
          </div>

          <div className="flex items-end">
            <div className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-emerald-50 border border-emerald-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              Será publicado como <strong>Ativo</strong>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 sm:py-3 border border-gray-200 rounded-xl sm:rounded-2xl text-gray-600 font-medium hover:bg-gray-50 transition cursor-pointer text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading || processandoImagens}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-white font-semibold transition text-sm ${
              loading || processandoImagens
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 cursor-pointer'
            }`}
          >
            {loading ? 'Publicando...' : processandoImagens ? 'Preparando fotos...' : 'Publicar anúncio'}
          </button>
        </div>
      </form>

      {/* Preview ao vivo */}
      {temConteudo && (
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Preview do anúncio</h3>

          <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
            {imagens.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {imagens.map((img, index) => (
                  <img
                    key={index}
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-24 sm:w-32 h-20 sm:h-24 flex-shrink-0 object-cover rounded-lg sm:rounded-xl"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full h-28 sm:h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-2xl">
                📷
              </div>
            )}

            <h4 className="font-bold text-gray-900 mt-3 text-sm sm:text-base">
              {formData.titulo || 'Título'}
            </h4>

            <p className="text-emerald-600 font-bold mt-1 text-sm sm:text-base">
              {formatarPreco(formData.preco) || 'R$ 0,00'}
            </p>

            <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-3">
              {formData.descricao || 'Descrição do produto'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviewAnuncio