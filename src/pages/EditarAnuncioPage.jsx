// ============================================================================
// src/pages/EditarAnuncioPage.jsx — VERSÃO CORRIGIDA E EVOLUÍDA
// ----------------------------------------------------------------------------
// CORREÇÕES CRÍTICAS:
// 1. Trata imagem_url como ARRAY (JSON) — galeria múltipla funciona na edição
// 2. Editar não apaga mais as outras fotos ao enviar uma nova
// 3. Compressão automática de imagens (mesmo helper da criação)
// 4. Validação de data de expiração passada (com guia de reativação)
// 5. Botão "Renovar +30 dias" para reativar anúncio expirado
// 6. Contadores de caracteres + botão "Tornar capa"
// 7. Limpeza das fotos removidas no storage após salvar
// ============================================================================

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const MAX_TITULO = 80
const MAX_DESC = 600
const MAX_FOTOS = 6
const MAX_MB_ORIGINAL = 5

const formatarPreco = (valor) => {
  if (!valor) return ''
  const numero = parseFloat(valor)
  if (isNaN(numero)) return ''
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const extrairPathStorage = (url) => {
  if (!url) return null
  try {
    const partes = url.split('/storage/v1/object/public/anuncios/')
    return partes[1] || null
  } catch { return null }
}

// Converte imagem_url (JSON array, URL única ou null) em lista de URLs
const parseImagens = (imagemUrl) => {
  if (!imagemUrl) return []
  try {
    const parsed = JSON.parse(imagemUrl)
    if (Array.isArray(parsed)) return parsed
    return [imagemUrl]
  } catch {
    return [imagemUrl]
  }
}

const hojeISO = () => new Date().toISOString().split('T')[0]

// Compressão via canvas (idêntica à do PreviewAnuncio)
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
        ctx.fillStyle = '#ffffff'
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

const EditarAnuncioPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ titulo: '', preco: '', descricao: '', status: 'Ativo', data_expiracao: '' })
  // Galeria unificada: { id, tipo: 'existente'|'nova', url?, path?, file?, preview? }
  const [imagens, setImagens] = useState([])
  const [removidasPaths, setRemovidasPaths] = useState([])
  const [processandoImagens, setProcessandoImagens] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState(null)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    buscarAnuncio()
  }, [id, user])

  const buscarAnuncio = async () => {
    try {
      setLoading(true); setError(null)
      const { data, error } = await supabase.from('anuncios_vendas').select('*').eq('id', id).single()
      if (error) throw error
      if (!data) { setError('Anúncio não encontrado.'); return }
      if (data.usuario_id && data.usuario_id !== user.id) { setError('Você não tem permissão para editar este anúncio.'); return }

      setForm({
        titulo: data.titulo || '',
        preco: data.preco || '',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        data_expiracao: data.data_expiracao ? data.data_expiracao.slice(0, 10) : ''
      })

      // ✅ Carrega a galeria completa (array JSON ou URL única)
      const lista = parseImagens(data.imagem_url)
      setImagens(lista.map((url, i) => ({
        id: `e${i}-${Date.now()}`,
        tipo: 'existente',
        url,
        path: extrairPathStorage(url)
      })))
    } catch (err) {
      console.error(err); setError('Erro ao carregar anúncio.')
    } finally { setLoading(false) }
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError(null)
  }

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validas = files.filter((f) => {
      if (!f.type.startsWith('image/')) { setError(`${f.name} não é uma imagem válida.`); return false }
      if (f.size > MAX_MB_ORIGINAL * 1024 * 1024) { setError(`${f.name} excede ${MAX_MB_ORIGINAL}MB.`); return false }
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

    for (let i = 0; i < validas.length; i++) {
      const comprimida = await comprimirImagem(validas[i])
      const preview = await lerComoDataURL(comprimida)
      setImagens((prev) => [...prev, {
        id: `n${Date.now()}-${i}`,
        tipo: 'nova',
        file: comprimida,
        preview
      }])
    }

    setProcessandoImagens(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removerImagem = (index) => {
    const img = imagens[index]
    if (img.tipo === 'existente' && img.path) {
      setRemovidasPaths((prev) => [...prev, img.path])
    }
    setImagens((prev) => prev.filter((_, i) => i !== index))
  }

  const tornarCapa = (index) => {
    setImagens((prev) => {
      const copia = [...prev]
      const [item] = copia.splice(index, 1)
      return [item, ...copia]
    })
  }

  const renovar30Dias = () => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    setForm((prev) => ({ ...prev, data_expiracao: d.toISOString().split('T')[0], status: 'Ativo' }))
    setError(null)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (salvando || processandoImagens) return

    setSalvando(true); setError(null)
    try {
      if (form.titulo.trim().length < 3) throw new Error('Título deve ter pelo menos 3 caracteres.')
      if (!form.preco || parseFloat(form.preco) <= 0) throw new Error('Informe um preço válido maior que zero.')
      if (form.descricao.trim().length < 10) throw new Error('Descreva o produto com pelo menos 10 caracteres.')

      if (form.data_expiracao) {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
        const sel = new Date(form.data_expiracao); sel.setHours(0, 0, 0, 0)
        if (sel < hoje) throw new Error('A data de expiração já passou. Atualize para uma data futura (ou use "Renovar +30 dias") para o anúncio voltar a aparecer.')
      }

      // Sobe as fotos novas NA ORDEM da galeria e monta o array final
      const urlsFinais = []
      for (const img of imagens) {
        if (img.tipo === 'existente') { urlsFinais.push(img.url); continue }
        const ext = img.file.name.split('.').pop()
        const filePath = `anuncios/${id}-${img.id}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('anuncios')
          .upload(filePath, img.file, { cacheControl: '3600', upsert: false, contentType: img.file.type })
        if (upErr) throw new Error(`Falha no upload de uma foto: ${upErr.message}`)
        const { data: { publicUrl } } = supabase.storage.from('anuncios').getPublicUrl(filePath)
        urlsFinais.push(publicUrl)
      }

      const imagemUrlFinal = urlsFinais.length > 0 ? JSON.stringify(urlsFinais) : null

      const { error } = await supabase.from('anuncios_vendas').update({
        titulo: form.titulo.trim(),
        preco: parseFloat(form.preco),
        descricao: form.descricao.trim(),
        status: form.status,
        imagem_url: imagemUrlFinal,
        data_expiracao: form.data_expiracao ? new Date(form.data_expiracao).toISOString() : null
      }).eq('id', id)

      if (error) throw error

      // Limpa do storage as fotos que foram removidas na edição
      if (removidasPaths.length) {
        await supabase.storage.from('anuncios').remove(removidasPaths)
      }

      setSucesso(true)
      setTimeout(() => navigate('/anuncios'), 1800)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Erro ao salvar anúncio.')
      setSalvando(false)
    }
  }

  const handleExcluir = async () => {
    if (!window.confirm('Deseja realmente excluir este anúncio?')) return
    try {
      setSalvando(true); setError(null)
      const paths = imagens.filter((i) => i.tipo === 'existente' && i.path).map((i) => i.path)
      if (paths.length) await supabase.storage.from('anuncios').remove(paths)
      const { error } = await supabase.from('anuncios_vendas').delete().eq('id', id)
      if (error) throw error
      navigate('/anuncios')
    } catch (err) {
      console.error(err); setError('Erro ao excluir anúncio.'); setSalvando(false)
    }
  }

  const inputClass = 'w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm sm:text-base'

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
    </div>
  )

  if (sucesso) return (
    <div className="text-center py-16 sm:py-24 px-4">
      <div className="text-5xl sm:text-6xl mb-4">🎉</div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Anúncio atualizado com sucesso</h2>
      <p className="text-gray-500 mt-2 text-sm">Redirecionando...</p>
    </div>
  )

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <section className="rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-800 text-white p-6 sm:p-8">
        <Link to="/anuncios" className="text-xs sm:text-sm text-emerald-200 no-underline">← Voltar para anúncios</Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-4">Editar anúncio</h1>
        <p className="text-slate-200 mt-2 max-w-xl text-sm sm:text-base">Atualize seu anúncio e mantenha ele competitivo.</p>
      </section>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
        <form onSubmit={handleSalvar} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* ===== GALERIA MÚLTIPLA ===== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Fotos do produto</label>
              <span className="text-xs text-gray-400">{imagens.length}/{MAX_FOTOS}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {imagens.map((img, i) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.tipo === 'nova' ? img.preview : img.url}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-20 sm:h-24 object-cover rounded-lg sm:rounded-xl border border-gray-100"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded">CAPA</span>
                  )}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() => tornarCapa(i)}
                        title="Tornar capa"
                        className="w-5 h-5 sm:w-6 sm:h-6 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-black/80 cursor-pointer"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removerImagem(i)}
                      title="Remover foto"
                      className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500/90 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {imagens.length < MAX_FOTOS && (
                <button
                  type="button"
                  onClick={() => !processandoImagens && fileInputRef.current?.click()}
                  className="h-20 sm:h-24 border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-emerald-500 hover:text-emerald-600 transition cursor-pointer"
                >
                  <span className="text-xl sm:text-2xl">{processandoImagens ? '⏳' : '+'}</span>
                  <span className="text-[9px] sm:text-[10px] mt-1">{processandoImagens ? 'Otimizando...' : 'Add foto'}</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={processandoImagens || salvando}
              className="hidden"
            />

            <p className="text-[10px] sm:text-xs text-gray-400 mt-2">
              A primeira foto é a capa do anúncio. Toque em ⭐ para trocar • Máx {MAX_FOTOS} fotos • compressão automática
            </p>
          </div>

          {/* Título */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Título *</label>
              <span className="text-[10px] text-gray-400">{form.titulo.length}/{MAX_TITULO}</span>
            </div>
            <input type="text" name="titulo" value={form.titulo} onChange={handleChange} maxLength={MAX_TITULO} placeholder="Ex: Bicicleta Mountain Bike" className={inputClass} />
          </div>

          {/* Preço */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
            <input type="number" name="preco" value={form.preco} onChange={handleChange} min="0.01" step="0.01" placeholder="1500.00" className={inputClass} />
            {form.preco && (
              <p className="text-emerald-600 text-xs sm:text-sm font-medium mt-1">{formatarPreco(form.preco)}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Descrição *</label>
              <span className="text-[10px] text-gray-400">{form.descricao.length}/{MAX_DESC}</span>
            </div>
            <textarea name="descricao" rows="5" value={form.descricao} onChange={handleChange} maxLength={MAX_DESC} placeholder="Descreva o produto, estado de conservação..." className={`${inputClass} resize-none`} />
          </div>

          {/* Status + Expiração */}
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                <option value="Ativo">Ativo</option>
                <option value="Vendido">Vendido</option>
                <option value="Expirado">Expirado</option>
              </select>
              {form.status !== 'Ativo' && (
                <p className="text-[10px] sm:text-xs text-amber-600 mt-1">
                  Status "{form.status}": o anúncio não aparece nas listagens públicas.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expirar em</label>
              <input type="date" name="data_expiracao" value={form.data_expiracao} onChange={handleChange} className={inputClass} />
              <button
                type="button"
                onClick={renovar30Dias}
                className="mt-2 text-[10px] sm:text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition cursor-pointer"
              >
                🔄 Renovar +30 dias e reativar
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={salvando || processandoImagens} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-sm disabled:opacity-50 cursor-pointer">
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
            <button type="button" onClick={handleExcluir} disabled={salvando} className="px-5 py-2.5 sm:py-3 border border-red-200 text-red-600 rounded-xl sm:rounded-2xl hover:bg-red-50 text-sm disabled:opacity-50 cursor-pointer">
              Excluir anúncio
            </button>
          </div>
        </form>

        {/* Card de Dicas */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 h-fit">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg">Dicas rápidas</h3>
          <ul className="mt-4 space-y-3 text-xs sm:text-sm text-gray-500">
            <li>✓ Use boas fotos — a primeira vira a capa</li>
            <li>✓ Seja honesto na descrição</li>
            <li>✓ Preço justo vende mais rápido</li>
            <li>✓ Responda rápido os interessados</li>
            <li>✓ Anúncio expirado? Use "Renovar +30 dias"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EditarAnuncioPage