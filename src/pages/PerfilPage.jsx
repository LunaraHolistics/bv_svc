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
  const [editando, setEditando] = useState(false)

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

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
    horario_funcionamento: ''
  })

  const primeiroAcesso = !perfil?.nome_completo
  const ehPrestador =
    form.tipo_pessoa === 'prestador' ||
    form.tipo_pessoa === 'ambos'

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
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
        servicos_oferecidos: (
          perfil.servicos_oferecidos || []
        ).join(', '),
        condicoes_moradores:
          perfil.condicoes_moradores || '',
        horario_funcionamento:
          perfil.horario_funcionamento || ''
      })

      setAvatarPreview(perfil.avatar_url)
      setSalvo(true)
    }
  }, [perfil])

  useEffect(() => {
    if (!authLoading && primeiroAcesso) {
      setEditando(true)
    } else if (!authLoading && perfil?.nome_completo) {
      setEditando(false)
    }
  }, [authLoading, primeiroAcesso, perfil])

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas.')
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

    setSalvando(true)
    setError(null)

    try {
      let avatarUrl = perfil?.avatar_url || null

      if (avatarFile && user) {
        const ext =
          avatarFile.name?.split('.').pop() || 'jpg'

        const filePath = `avatars/${user.id}.${ext}`

        const { error: uploadError } =
          await supabase.storage
            .from('anuncios')
            .upload(filePath, avatarFile, {
              contentType: avatarFile.type,
              upsert: true
            })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl }
        } = supabase.storage
          .from('anuncios')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      const dados = {
        nome_completo: form.nome_completo.trim(),
        nome_exibicao:
          form.nome_exibicao.trim() || null,
        fase: form.fase || null,
        quadra: form.quadra.trim() || null,
        lote: form.lote.trim() || null,
        tipo_pessoa: form.tipo_pessoa,
        telefone: form.telefone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        nome_fantasia:
          form.nome_fantasia.trim() || null,
        descricao_comercial:
          form.descricao_comercial.trim() || null,
        endereco_comercial:
          form.endereco_comercial.trim() || null,
        instagram_url:
          form.instagram_url.trim() || null,
        facebook_url:
          form.facebook_url.trim() || null,
        site_url:
          form.site_url.trim() || null,
        servicos_oferecidos:
          form.servicos_oferecidos
            ? form.servicos_oferecidos
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : null,
        condicoes_moradores:
          form.condicoes_moradores.trim() || null,
        horario_funcionamento:
          form.horario_funcionamento.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }

      if (perfil) {
        const { error } = await supabase
          .from('perfis')
          .update(dados)
          .eq('id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('perfis')
          .insert({
            ...dados,
            id: user.id
          })

        if (error) throw error
      }

      await recarregarPerfil()

      setSucesso(true)
      setSalvo(true)
      setEditando(false)
      setAvatarFile(null)

      setTimeout(() => {
        setSucesso(false)
      }, 3000)
    } catch (err) {
      setError(err.message || 'Erro ao salvar perfil.')
    } finally {
      setSalvando(false)
    }
  }

  const Field = ({
    label,
    name,
    placeholder,
    type = 'text',
    required = false,
    children
  }) => (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      {children || (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={salvando}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      )}
    </div>
  )

  const SelectField = ({
    label,
    name,
    options,
    placeholder
  }) => (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          name={name}
          value={form[name]}
          onChange={handleChange}
          disabled={salvando}
          className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          ▼
        </div>
      </div>
    </div>
  )

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-20">
        Carregando...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl">
          Perfil salvo com sucesso!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSalvar}
        className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6"
      >
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="cursor-pointer"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div>
            <p className="font-medium">
              Foto de perfil
            </p>
            <p className="text-sm text-gray-500">
              Clique para alterar
            </p>
          </div>
        </div>

        {/* Dados pessoais */}
        <Field
          label="Nome completo"
          name="nome_completo"
          required
          placeholder="Digite seu nome"
        />

        <Field
          label="Nome de exibição"
          name="nome_exibicao"
          placeholder="Como deseja aparecer"
        />

        <div className="grid grid-cols-3 gap-4">
          <Field
            label="Quadra"
            name="quadra"
          />

          <Field
            label="Lote"
            name="lote"
          />

          <SelectField
            label="Fase"
            name="fase"
            options={[
              {
                value: 'Fase 1',
                label: 'Fase 1'
              },
              {
                value: 'Fase 2',
                label: 'Fase 2'
              }
            ]}
          />
        </div>

        <SelectField
          label="Tipo de perfil"
          name="tipo_pessoa"
          options={[
            {
              value: 'morador',
              label: 'Morador'
            },
            {
              value: 'prestador',
              label: 'Prestador'
            },
            {
              value: 'ambos',
              label: 'Ambos'
            }
          ]}
        />

        <Field
          label="Telefone"
          name="telefone"
        />

        <Field
          label="WhatsApp"
          name="whatsapp"
        />

        {ehPrestador && (
          <>
            <Field
              label="Nome fantasia"
              name="nome_fantasia"
            />

            <Field
              label="Descrição comercial"
              name="descricao_comercial"
            >
              <textarea
                name="descricao_comercial"
                value={form.descricao_comercial}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </Field>

            <Field
              label="Serviços oferecidos"
              name="servicos_oferecidos"
              placeholder="Ex: Pintura, Jardinagem"
            />

            <Field
              label="Instagram"
              name="instagram_url"
            />

            <Field
              label="Facebook"
              name="facebook_url"
            />

            <Field
              label="Site"
              name="site_url"
            />
          </>
        )}

        <div className="flex gap-3">
          {!primeiroAcesso && (
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="px-5 py-3 border border-gray-200 rounded-xl"
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium"
          >
            {salvando
              ? 'Salvando...'
              : 'Salvar Perfil'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PerfilPage