// src/pages/PerfilPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const PerfilPage = () => {
  const navigate = useNavigate()
  const { user, perfil, loading: authLoading, recarregarPerfil } = useAuth()
  const fileInputRef = useRef(null)

  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [error, setError] = useState(null)
  const [salvo, setSalvo] = useState(false)

  const [form, setForm] = useState({
    nome_completo: '',
    nome_exibicao: '',
    fase: '',
    quadra: '',
    lote: '',
    tipo_pessoa: 'morador',
    telefone: '',
    whatsapp: '',
    nome_fantasia: '',
    descricao_comercial: '',
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

  const primeiroAcesso = !perfil?.nome_completo
  const ehPrestador = form.tipo_pessoa === 'prestador' || form.tipo_pessoa === 'ambos'

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
        telefone: perfil.telefone || '',
        whatsapp: perfil.whatsapp || '',
        nome_fantasia: perfil.nome_fantasia || '',
        descricao_comercial: perfil.descricao_comercial || '',
        endereco_comercial: perfil.endereco_comercial || '',
        instagram_url: perfil.instagram_url || '',
        facebook_url: perfil.facebook_url || '',
        site_url: perfil.site_url || '',
        servicos_oferecidos: (perfil.servicos_oferecidos || []).join(', '),
        condicoes_moradores: perfil.condicoes_moradores || '',
        horario_funcionamento: perfil.horario_funcionamento || '',
      })
      setAvatarPreview(perfil.avatar_url)
      setSalvo(true)
    }
  }, [perfil])

  // Se tem perfil, começa no modo visual. Se não tem, começa editando.
  const [editando, setEditando] = useState(false)
  useEffect(() => {
    if (!authLoading && !primeiroAcesso && perfil?.nome_completo) setEditando(false)
    else if (!authLoading && primeiroAcesso) setEditando(true)
  }, [authLoading, primeiroAcesso, perfil])

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
        telefone: form.telefone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        nome_fantasia: form.nome_fantasia.trim() || null,
        descricao_comercial: form.descricao_comercial.trim() || null,
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
      setSalvo(true)
      setAvatarFile(null)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      setError(err.message || 'Erro ao salvar perfil.')
    } finally {
      setSalvando(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-emerald-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  const Field = ({ label, name, placeholder, type = 'text', required, className = '', children }) => (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>}
      {children || (
        <input
          type={type}
          name={name}
          value={form[name] || ''}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 outline-none placeholder:text-gray-300"
          placeholder={placeholder}
          disabled={salvando}
        />
      )}
    </div>
  )

  const SelectField = ({ label, name, options, placeholder, className = '' }) => (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>}
      <select
        name={name}
        value={form[name] || ''}
        onChange={handleChange}
        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'12'%20height%3D'12'%3E%3Cpath%20fill%3D'none'%20stroke%3D'%239CA3AF'%20stroke-width%3D'2'%2F%3E%3Cpath%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%20d%3D'M2 4h6M6 12l4-4m0%200l-4 4m4-4H6'/%3E%3C%2Fsvg%3E')] no-repeat bg-[length:20px_20px] bg-[right_8px_center]"
        disabled={salvando}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {primeiroAcesso ? 'Complete seu Perfil' : 'Meu Perfil'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {primeiroAcesso ? 'Preencha seus dados para usar o BV Service' : 'Gerencie suas informações'}
          </p>
        </div>
        {salvo && !editando && (
          <button
            onClick={() => setEditando(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          ✅ Perfil salvo com sucesso!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ============ MODO VISUAL (perfil salvo) ============ */}
      {!editando && salvo && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 relative">
            <div className="absolute -bottom-10 left-6">
              {perfil.avatar_url ? (
                <img src={perfil.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-[3px] border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white border-[3px] border-white shadow-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-600">{perfil.nome_exibicao?.charAt(0) || perfil.nome_completo.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-14 px-6 pb-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{perfil.nome_exibicao || perfil.nome_completo}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {perfil.fase && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">{perfil.fase}</span>}
                {perfil.quadra && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Quadra {perfil.quadra}</span>}
                {perfil.lote && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">Lote {perfil.lote}</span>}
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium capitalize">{perfil.tipo_pessoa}</span>
              </div>
            </div>

            {perfil.telefone && (
              <p className="text-sm text-gray-500">📞 {perfil.telefone}</p>
            )}
            {perfil.whatsapp && (
              <p className="text-sm text-gray-500">📱 {perfil.whatsapp}</p>
            )}

            {perfil.nome_fantasia && (
              <p className="text-emerald-600 font-medium text-sm">{perfil.nome_fantasia}</p>
            )}

            {perfil.descricao_comercial && (
              <p className="text-gray-600 text-sm leading-relaxed">{perfil.descricao_comercial}</p>
            )}

            {perfil.condicoes_moradores && (
              <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-amber-700 text-xs font-medium">⭐ Condição especial: {perfil.condicoes_moradores}</p>
              </div>
            )}

            {perfil.horario_funcionamento && (
              <p className="text-xs text-gray-400">🕐 {perfil.horario_funcionamento}</p>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2 mt-1">
              {perfil.whatsapp && (
                <a href={`https://wa.me/55${perfil.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 no-underline">📱 WhatsApp</a>
              )}
              {perfil.instagram_url && (
                <a href={perfil.instagram_url.startsWith('http') ? perfil.instagram_url : `https://instagram.com/${perfil.instagram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-xs font-medium no-underline">📷 Instagram</a>
              )}
              {perfil.facebook_url && (
                <a href={perfil.facebook_url.startsWith('http') ? perfil.facebook_url : `https://facebook.com/${perfil.facebook_url}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium no-underline">📘 Facebook</a>
              )}
              {perfil.site_url && (
                <a href={perfil.site_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-800 text-white rounded-xl text-xs font-medium no-underline">🌐 Site</a>
              )}
            </div>

            {/* Serviços */}
            {perfil.servicos_oferecidos?.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Serviços oferecidos</p>
                <div className="flex flex-wrap gap-1.5">
                  {perfil.servicos_oferecidos.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
              <Link to="/novo-anuncio" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 no-underline transition-colors">
                ➕ Criar Anúncio
              </Link>
              <Link to="/anuncios" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 no-underline transition-colors">
                🏷️ Meus Anúncios
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODO EDIÇÃO ============ */}
      {editando && (
        <form onSubmit={handleSalvar} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-5">

          {/* Avatar */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-300">?</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Foto de perfil</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Clique na foto para trocar · Máximo 2MB</p>
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-emerald-500 rounded-full" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dados Pessoais</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome completo *" name="nome_completo" placeholder="Seu nome" required />
              <Field label="Nome de exibição" name="nome_exibicao" placeholder="Como quer ser chamado (apelido)" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <SelectField
                label="Fase"
                name="fase"
                placeholder="Selecione"
                options={[
                  { value: '', label: 'Selecione' },
                  { value: 'Fase 1', label: 'Fase 1' },
                  { value: 'Fase 2', label: 'Fase 2' },
                ]}
              />
              <Field label="Quadra" name="quadra" placeholder="Ex: A" />
              <Field label="Lote" name="lote" placeholder="Ex: 12" />
            </div>

            <SelectField
              label="Você é"
              name="tipo_pessoa"
              options={[
                { value: 'morador', label: 'Morador' },
                { value: 'prestador', label: 'Prestador de serviço' },
                { value: 'ambos', label: 'Morador e prestador' },
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefone" name="telefone" placeholder="(16) 99999-9999" />
              <Field label="WhatsApp (comercial)" name="whatsapp" placeholder="(16) 99999-9999" />
            </div>
          </div>

          {/* Dados comerciais */}
          {ehPrestador && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-2">
                <div className="w-1 h-5 bg-blue-500 rounded-full" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dados Comerciais</h3>
              </div>

              <Field label="Nome fantasia" name="nome_fantasia" placeholder="Ex: João Encanamentos" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Endereço comercial" name="endereco_comercial" placeholder="Rua, número, bairro" />
                <Field label="Horário" name="horario_funcionamento" placeholder="Seg-Sex 8h às 17h" />
              </div>

              <Field
                label="Descrição do negócio"
                name="descricao_comercial"
                placeholder="Fale sobre seu negócio, experiência, diferenciais..."
              >
                <textarea
                  name="descricao_comercial"
                  value={form.descricao_comercial}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 outline-none resize-none"
                  rows={3}
                  disabled={salvando}
                />
              </Field>

              <Field
                label="Serviços oferecidos"
                name="servicos_oferecidos"
                placeholder="Separe por vírgula: Encanamento, Reparo, Instalação"
              />

              <Field
                label="Condições especiais para moradores"
                name="condicoes_moradores"
                placeholder="Ex: 10% de desconto · Orçamento grátis"
              >
                <div className="relative">
                  <input
                    type="text"
                    name="condicoes_moradores"
                    value={form.condicoes_moradores}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-150 outline-none placeholder:text-amber-300"
                    disabled={salvando}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 text-lg pointer-events-none">⭐</span>
                </div>
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Instagram" name="instagram_url" placeholder="@usuario" />
                <Field label="Facebook" name="facebook_url" placeholder="facebook.com/pagina" />
                <Field label="Site" name="site_url" placeholder="www.seusite.com" />
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            {!primeiroAcesso && (
              <button
                type="button"
                onClick={() => { setEditando(false); setAvatarFile(null); setError(null) }}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 transition-all duration-150 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {salvando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </span>
              ) : primeiroAcesso ? 'Salvar e Continuar' : 'Salvar Alterações'}
            </button>
          </div>

          {primeiroAcesso && (
            <p className="text-[11px] text-gray-400 text-center">
              Ao salvar, você poderá editar a qualquer momento pelo menu "Perfil"
            </p>
          )}
        </form>
      )}
    </div>
  )
}

export default PerfilPage