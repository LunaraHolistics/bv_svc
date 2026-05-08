// src/pages/PerfilPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const formatarFone = (val) => {
  const d = val.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const PerfilPage = () => {
  const navigate = useNavigate()
  const { user, perfil, loading: authLoading, recarregarPerfil } = useAuth()
  const fileInputRef = useRef(null)

  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [error, setError] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  const [form, setForm] = useState({
    nome_completo: '',
    nome_exibicao: '',
    fase: '',
    quadra: '',
    lote: '',
    tipo_pessoa: 'morador',
    whatsapp: '',
    telefone2: '',
    telefone: '',
    nome_fantasia: '',
    descricao_comercial: '',
    instagram_url: '',
    facebook_url: '',
    site_url: '',
    servicos_oferecidos: ''
  })

  const ehPrestador =
    form.tipo_pessoa === 'prestador' ||
    form.tipo_pessoa === 'ambos'

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (perfil) {
      setForm({
        nome_completo: perfil.nome_completo || '',
        nome_exibicao: perfil.nome_exibicao || '',
        fase: perfil.fase || '',
        quadra: perfil.quadra || '',
        lote: perfil.lote || '',
        tipo_pessoa: perfil.tipo_pessoa || 'morador',
        whatsapp: perfil.whatsapp || '',
        telefone2: perfil.telefone2 || '',
        telefone: perfil.telefone || '',
        nome_fantasia: perfil.nome_fantasia || '',
        descricao_comercial: perfil.descricao_comercial || '',
        instagram_url: perfil.instagram_url || '',
        facebook_url: perfil.facebook_url || '',
        site_url: perfil.site_url || '',
        servicos_oferecidos:
          (perfil.servicos_oferecidos || []).join(', ')
      })

      setAvatarPreview(perfil.avatar_url || null)
    }
  }, [perfil])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'whatsapp' || name === 'telefone2' || name === 'telefone') {
      setForm((prev) => ({
        ...prev,
        [name]: formatarFone(value)
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value
      }))
    }

    setError(null)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Envie apenas imagens.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem deve ter no máximo 2MB.')
      return
    }

    setAvatarFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()

    if (!form.nome_completo.trim()) {
      setError('Nome completo é obrigatório.')
      return
    }

    if (!user?.id) {
      setError('Sessão expirada. Faça login novamente.')
      return
    }

    setSalvando(true)
    setError(null)

    try {
      let avatarUrl = perfil?.avatar_url || null

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const filePath = `avatars/${user.id}.${ext}`

        const { error: uploadError } =
          await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)

        const {
          data: { publicUrl }
        } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      const dados = {
        nome_completo: form.nome_completo.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, '') || '',
        telefone2: form.telefone2.replace(/\D/g, '') || null,
        telefone: ehPrestador ? (form.telefone.replace(/\D/g, '') || null) : null,
        nome_exibicao: form.nome_exibicao.trim() || null,
        fase: form.fase.trim() || '',
        quadra: form.quadra.trim() || null,
        lote: form.lote.trim() || null,
        tipo_pessoa: form.tipo_pessoa || 'morador',
        nome_fantasia: form.nome_fantasia.trim() || null,
        descricao_comercial: form.descricao_comercial.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        site_url: form.site_url.trim() || null,
        servicos_oferecidos: form.servicos_oferecidos
          ? form.servicos_oferecidos
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          : null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }

      let dbError

      if (perfil) {
        const result = await supabase
          .from('perfis')
          .update(dados)
          .eq('id', user.id)
        dbError = result.error
      } else {
        const result = await supabase
          .from('perfis')
          .insert({ ...dados, id: user.id })
        dbError = result.error
      }

      if (dbError) {
        console.error('[Perfil] Erro Supabase:', dbError)
        throw new Error(dbError.message)
      }

      await recarregarPerfil()

      setSucesso(true)
      setAvatarFile(null)

      setTimeout(() => {
        setSucesso(false)
      }, 3000)
    } catch (err) {
      console.error('[Perfil] Erro ao salvar:', err)
      setError(err.message || 'Erro ao salvar perfil.')
    } finally {
      setSalvando(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all'

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-8 md:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
              Área do morador
            </span>

            <h1 className="text-3xl font-bold mt-4">
              Seu perfil no Bella Vittà
            </h1>

            <p className="text-white/80 mt-2 max-w-xl">
              Atualize seus dados pessoais, informações
              comerciais e personalize como você aparece
              para os moradores.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-5 py-3 bg-white text-emerald-700 rounded-2xl font-semibold hover:bg-emerald-50 transition"
          >
            Voltar ao início
          </button>
        </div>
      </div>

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl">
          Perfil salvo com sucesso ✨
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSalvar}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8"
      >
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                className="w-24 h-24 rounded-3xl object-cover shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center text-4xl">
                👤
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />

          <div>
            <h3 className="font-semibold text-gray-900">
              Foto de perfil
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Clique na foto para alterar sua imagem
            </p>
          </div>
        </div>

        {/* Dados pessoais */}
        <div>
          <h2 className="text-xl font-bold mb-5">
            Dados pessoais
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="nome_completo"
              value={form.nome_completo}
              onChange={handleChange}
              placeholder="Nome completo"
              className={inputClass}
            />

            <input
              name="nome_exibicao"
              value={form.nome_exibicao}
              onChange={handleChange}
              placeholder="Nome de exibição"
              className={inputClass}
            />

            <input
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="WhatsApp (00) 00000-0000"
              autoComplete="tel"
              className={inputClass}
            />

            <input
              name="telefone2"
              value={form.telefone2}
              onChange={handleChange}
              placeholder="Telefone adicional (opcional)"
              autoComplete="tel"
              className={inputClass}
            />

            <input
              name="fase"
              value={form.fase}
              onChange={handleChange}
              placeholder="Fase"
              className={inputClass}
            />

            <input
              name="quadra"
              value={form.quadra}
              onChange={handleChange}
              placeholder="Quadra"
              className={inputClass}
            />

            <input
              name="lote"
              value={form.lote}
              onChange={handleChange}
              placeholder="Lote"
              className={inputClass}
            />
          </div>
        </div>

        {/* Perfil comercial */}
        <div>
          <h2 className="text-xl font-bold mb-5">
            Perfil comercial
          </h2>

          <select
            name="tipo_pessoa"
            value={form.tipo_pessoa}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="morador">Morador</option>
            <option value="prestador">Prestador</option>
            <option value="ambos">Ambos</option>
          </select>

          {ehPrestador && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <input
                name="nome_fantasia"
                value={form.nome_fantasia}
                onChange={handleChange}
                placeholder="Nome fantasia"
                className={inputClass}
              />

              <input
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="Telefone comercial (opcional)"
                autoComplete="tel"
                className={inputClass}
              />

              <input
                name="servicos_oferecidos"
                value={form.servicos_oferecidos}
                onChange={handleChange}
                placeholder="Serviços oferecidos"
                className={inputClass}
              />

              <input
                name="instagram_url"
                value={form.instagram_url}
                onChange={handleChange}
                placeholder="Instagram"
                className={inputClass}
              />

              <input
                name="facebook_url"
                value={form.facebook_url}
                onChange={handleChange}
                placeholder="Facebook"
                className={inputClass}
              />

              <input
                name="site_url"
                value={form.site_url}
                onChange={handleChange}
                placeholder="Website"
                className={inputClass}
              />
            </div>
          )}

          {ehPrestador && (
            <textarea
              name="descricao_comercial"
              value={form.descricao_comercial}
              onChange={handleChange}
              placeholder="Descreva seu serviço"
              rows="4"
              className={`${inputClass} mt-4`}
            />
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={salvando}
            className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-70"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PerfilPage