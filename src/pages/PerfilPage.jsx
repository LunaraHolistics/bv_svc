// src/pages/PerfilPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const PerfilPage = () => {
  const navigate = useNavigate()
  const { user, perfil, loading: authLoading, recarregarPerfil } = useAuth()
  const fileInputRef = useRef(null)

  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    nome_completo: '',
    nome_exibicao: '',
    fase: '',
    quadra: '',
    lote: '',
    tipo_pessoa: 'morador',
    nome_fantasia: '',
    descricao_comercial: '',
    whatsapp: '',
    endereco_comercial: '',
    instagram_url: '',
    facebook_url: '',
    site_url: '',
    servicos_oferecidos: '',
    condicoes_moradores: '',
    horario_funcionamento: '',
  })

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/login')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (perfil) {
      setForm({
        nome_completo: perfil.nome_completo || '',
        nome_exibicao: perfil.nome_exibicao || '',
        fase: perfil.fase || '',
        quadra: perfil.quadra || '',
        lote: perfil.lote || '',
        tipo_pessoa: perfil.tipo_pessoa || 'morador',
        nome_fantasia: perfil.nome_fantasia || '',
        descricao_comercial: perfil.descricao_comercial || '',
        whatsapp: perfil.whatsapp || '',
        endereco_comercial: perfil.endereco_comercial || '',
        instagram_url: perfil.instagram_url || '',
        facebook_url: perfil.facebook_url || '',
        site_url: perfil.site_url || '',
        servicos_oferecidos: (perfil.servicos_oferecidos || []).join(', '),
        condicoes_moradores: perfil.condicoes_moradores || '',
        horario_funcionamento: perfil.horario_funcionamento || '',
      })
      setAvatarPreview(perfil.avatar_url)
    }
  }, [perfil])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Apenas imagens.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Máximo 2MB para avatar.'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!form.nome_completo.trim()) { setError('Nome completo é obrigatório.'); return }
    setSalvando(true)
    setError(null)

    try {
      let avatarUrl = perfil?.avatar_url || null

      // Upload avatar
      if (avatarFile && user) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('anuncios').upload(path, avatarFile, { contentType: avatarFile.type, upsert: true })
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('anuncios').getPublicUrl(path)
        avatarUrl = publicUrl
      }

      const dados = {
        nome_completo: form.nome_completo.trim(),
        nome_exibicao: form.nome_exibicao.trim() || null,
        fase: form.fase || null,
        quadra: form.quadra.trim() || null,
        lote: form.lote.trim() || null,
        tipo_pessoa: form.tipo_pessoa,
        nome_fantasia: form.nome_fantasia.trim() || null,
        descricao_comercial: form.descricao_comercial.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        endereco_comercial: form.endereco_comercial.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        site_url: form.site_url.trim() || null,
        servicos_oferecidos: form.servicos_oferecidos ? form.servicos_oferecidos.split(',').map(s => s.trim()).filter(Boolean) : null,
        condicoes_moradores: form.condicoes_moradores.trim() || null,
        horario_funcionamento: form.horario_funcionamento.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }

      if (perfil) {
        const { error: updateErr } = await supabase.from('perfis').update(dados).eq('id', user.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase.from('perfis').insert({ ...dados, id: user.id })
        if (insertErr) throw insertErr
      }

      await recarregarPerfil()
      setSucesso(true)
      setEditando(false)
      setAvatarFile(null)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setError(err.message || 'Erro ao salvar perfil.')
    } finally {
      setSalvando(false)
    }
  }

  if (authLoading || !user) return null

  const primeiroAcesso = !perfil?.nome_completo
  const ehPrestador = form.tipo_pessoa === 'prestador' || form.tipo_pessoa === 'ambos'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {primeiroAcesso ? 'Complete seu Perfil' : 'Meu Perfil'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {primeiroAcesso
              ? 'Preencha seus dados para usar o BV Service'
              : 'Gerencie suas informações pessoais'}
          </p>
        </div>
        {perfil?.nome_completo && !editando && (
          <button
            onClick={() => setEditando(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          ✅ Perfil salvo com sucesso!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Modo visual (não editando) */}
      {!editando && perfil?.nome_completo && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Banner + Avatar */}
          <div className="h-28 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
            <div className="absolute -bottom-10 left-5">
              {perfil.avatar_url ? (
                <img src={perfil.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">
                    {perfil.nome_exibicao?.charAt(0) || perfil.nome_completo.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-14 px-5 pb-5">
            <h2 className="text-lg font-bold text-gray-900">{perfil.nome_exibicao || perfil.nome_completo}</h2>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
              {perfil.fase && <span className="px-2 py-0.5 bg-gray-100 rounded-full">{perfil.fase}</span>}
              {perfil.quadra && <span className="px-2 py-0.5 bg-gray-100 rounded-full">Quadra {perfil.quadra}</span>}
              {perfil.lote && <span className="px-2 py-0.5 bg-gray-100 rounded-full">Lote {perfil.lote}</span>}
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full capitalize">{perfil.tipo_pessoa}</span>
            </div>

            {perfil.nome_fantasia && (
              <p className="text-emerald-600 font-medium text-sm mt-3">{perfil.nome_fantasia}</p>
            )}

            {perfil.descricao_comercial && (
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{perfil.descricao_comercial}</p>
            )}

            {perfil.condicoes_moradores && (
              <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-amber-700 text-xs font-medium">⭐ {perfil.condicoes_moradores}</p>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2 mt-4">
              {perfil.whatsapp && (
                <a href={`https://wa.me/55${perfil.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 no-underline">WhatsApp</a>
              )}
              {perfil.instagram_url && (
                <a href={perfil.instagram_url.startsWith('http') ? perfil.instagram_url : `https://instagram.com/${perfil.instagram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-xs font-medium no-underline">Instagram</a>
              )}
              {perfil.site_url && (
                <a href={perfil.site_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium no-underline">Site</a>
              )}
            </div>

            {perfil.servicos_oferecidos?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-1.5 font-medium">SERVIÇOS</p>
                <div className="flex flex-wrap gap-1">
                  {perfil.servicos_oferecidos.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Meus anúncios */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <Link to="/anuncios" className="text-sm text-emerald-600 font-medium hover:underline no-underline">
                Ver meus anúncios →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modo edição */}
      {editando && (
        <form onSubmit={handleSalvar} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-300">?</span>
                </div>
              )}
            </div>
            <div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="text-sm" />
              <p className="text-[11px] text-gray-400 mt-0.5">Máximo 2MB</p>
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Dados Pessoais</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                <input type="text" name="nome_completo" value={form.nome_completo} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome de exibição</label>
                <input type="text" name="nome_exibicao" value={form.nome_exibicao} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Como quer ser chamado" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
                <select name="fase" value={form.fase} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="">Selecione</option>
                  <option value="Fase 1">Fase 1</option>
                  <option value="Fase 2">Fase 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quadra</label>
                <input type="text" name="quadra" value={form.quadra} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                <input type="text" name="lote" value={form.lote} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Você é</label>
              <select name="tipo_pessoa" value={form.tipo_pessoa} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option value="morador">Morador</option>
                <option value="prestador">Prestador de serviço</option>
                <option value="ambos">Morador e prestador</option>
              </select>
            </div>
          </div>

          {/* Dados comerciais (condicional) */}
          {ehPrestador && (
            <div className="space-y-4 pt-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Dados Comerciais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome fantasia</label>
                  <input type="text" name="nome_fantasia" value={form.nome_fantasia} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Ex: João Encanamentos" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp comercial</label>
                  <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="(16) 99999-9999" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea name="descricao_comercial" value={form.descricao_comercial} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" rows={3} placeholder="Sobre seu negócio..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serviços oferecidos</label>
                <input type="text" name="servicos_oferecidos" value={form.servicos_oferecidos} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Separe por vírgula" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condições para moradores</label>
                <input type="text" name="condicoes_moradores" value={form.condicoes_moradores} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="10% desconto | Orçamento grátis" />
                <p className="text-[11px] text-amber-600 mt-0.5">⭐ Aparece em destaque no card</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário de funcionamento</label>
                <input type="text" name="horario_funcionamento" value={form.horario_funcionamento} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Seg-Sex 8h-17h" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço comercial</label>
                <input type="text" name="endereco_comercial" value={form.endereco_comercial} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input type="text" name="instagram_url" value={form.instagram_url} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="@usuario" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input type="text" name="facebook_url" value={form.facebook_url} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                  <input type="text" name="site_url" value={form.site_url} onChange={handleChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            {!primeiroAcesso && (
              <button type="button" onClick={() => { setEditando(false); setAvatarFile(null); setError(null) }} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            )}
            <button type="submit" disabled={salvando} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-300">
              {salvando ? 'Salvando...' : primeiroAcesso ? 'Criar Perfil' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PerfilPage