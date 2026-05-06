// src/pages/EditarAnuncioPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'

const EditarAnuncioPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    titulo: '',
    preco: '',
    descricao: '',
    status: 'Ativo',
    data_expiracao: '',
  })
  const [imagemPreview, setImagemPreview] = useState(null)
  const [imagemFile, setImagemFile] = useState(null)
  const [imagemExistente, setImagemExistente] = useState(null)
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
      const { data, error: err } = await supabase
        .from('anuncios_vendas')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err
      if (!data) { setError('Anúncio não encontrado.'); return }

      // Verificar se é dono (por usuario_id ou se campo for null — compatibilidade)
      if (data.usuario_id && data.usuario_id !== user.id) {
        setError('Você não pode editar este anúncio.')
        return
      }

      setForm({
        titulo: data.titulo || '',
        preco: data.preco || '',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        data_expiracao: data.data_expiracao ? data.data_expiracao.slice(0, 10) : '',
      })
      setImagemExistente(data.imagem_url)
    } catch {
      setError('Erro ao carregar anúncio.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Apenas imagens.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB.'); return }
    setImagemFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagemPreview(reader.result)
    reader.readAsDataURL(file)
    setError(null)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setError(null)

    try {
      if (!form.titulo.trim()) throw new Error('Título obrigatório.')
      if (!form.preco || parseFloat(form.preco) <= 0) throw new Error('Preço obrigatório.')

      // Atualizar dados
      const { error: updateErr } = await supabase
        .from('anuncios_vendas')
        .update({
          titulo: form.titulo.trim(),
          preco: parseFloat(form.preco),
          descricao: form.descricao.trim(),
          status: form.status,
          data_expiracao: form.data_expiracao ? new Date(form.data_expiracao).toISOString() : null,
          usuario_id: user.id,
        })
        .eq('id', id)

      if (updateErr) throw updateErr

      // Se nova imagem, upload
      if (imagemFile) {
        const ext = imagemFile.name.split('.').pop()
        const path = `anuncios/${id}-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('anuncios').upload(path, imagemFile, { contentType: imagemFile.type })
        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage.from('anuncios').getPublicUrl(path)
        await supabase.from('anuncios_vendas').update({ imagem_url: publicUrl }).eq('id', id)
      }

      setSucesso(true)
      setTimeout(() => navigate('/anuncios'), 1500)
    } catch (err) {
      setError(err.message || 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.')) return
    setSalvando(true)
    try {
      await supabase.from('anuncios_vendas').delete().eq('id', id)
      navigate('/anuncios')
    } catch {
      setError('Erro ao excluir.')
      setSalvando(false)
    }
  }

  const formatarPreco = (v) => {
    if (!v) return ''
    const n = parseFloat(v)
    return isNaN(n) ? '' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  )

  if (error && !form.titulo) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-4">{error}</p>
      <Link to="/anuncios" className="text-sm text-emerald-600 hover:underline no-underline">Voltar aos anúncios</Link>
    </div>
  )

  if (sucesso) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-3">✅</div>
      <h2 className="text-lg font-semibold text-gray-900">Anúncio atualizado!</h2>
      <p className="text-gray-500 text-sm mt-1">Redirecionando...</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/anuncios" className="text-gray-400 hover:text-gray-600 transition-colors no-underline">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Editar Anúncio</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSalvar} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input type="text" name="titulo" value={form.titulo} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={salvando} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
          <input type="number" name="preco" value={form.preco} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" step="0.01" min="0" disabled={salvando} required />
          {form.preco && <p className="text-sm text-emerald-600 font-medium mt-1">{formatarPreco(form.preco)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
          <textarea name="descricao" value={form.descricao} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows={4} disabled={salvando} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
          <div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700" disabled={salvando} />
            {imagemPreview && <button type="button" onClick={() => { setImagemPreview(null); setImagemFile(null); fileInputRef.current.value = '' }} className="text-red-500 text-xs font-medium">Remover</button>}
          </div>
          {(imagemPreview || imagemExistente) && (
            <img src={imagemPreview || imagemExistente} alt="Preview" className="mt-3 max-h-48 rounded-lg object-cover border border-gray-200" />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={salvando}>
              <option value="Ativo">Ativo</option>
              <option value="Vendido">Vendido</option>
              <option value="Expirado">Expirado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expirar em</label>
            <input type="date" name="data_expiracao" value={form.data_expiracao} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={salvando} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={salvando} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-300">
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button type="button" onClick={handleExcluir} disabled={salvando} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
            Excluir
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditarAnuncioPage