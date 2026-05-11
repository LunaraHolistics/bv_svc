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
  
  const [stats, setStats] = useState({ anuncios: 0, servicos: 0, indicacoes: 0 })
  const [servicoExistente, setServicoExistente] = useState(null)

  const [form, setForm] = useState({
    nome_completo: '',
    nome_exibicao: '',
    fase: '',
    quadra: '',
    lote: '',
    tipo_pessoa: 'morador',
    whatsapp: '',
    telefone2: ''
  })

  // ✅ ATUALIZADO: Agora só verifica se é prestador
  const ehPrestador = form.tipo_pessoa === 'prestador'

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (user) buscarEstatisticas()
  }, [user])

  useEffect(() => {
    if (ehPrestador && user) {
      buscarServicoExistente()
    } else {
      setServicoExistente(null)
    }
  }, [ehPrestador, user])

  const buscarEstatisticas = async () => {
    try {
      const fetchCount = async (tabela) => {
        let count = 0
        const res1 = await supabase.from(tabela).select('*', { count: 'exact', head: true }).eq('usuario_id', user.id)
        if (!res1.error) {
          count = res1.count
        } else {
          const res2 = await supabase.from(tabela).select('*', { count: 'exact', head: true }).eq('user_id', user.id)
          if (!res2.error) count = res2.count
        }
        return count || 0
      }
      const [anuncios, servicos, indicacoes] = await Promise.all([
        fetchCount('anuncios_vendas'),
        fetchCount('prestadores_servico'),
        fetchCount('indicacoes')
      ])
      setStats({ anuncios, servicos, indicacoes })
    } catch (error) {
      console.error('Erro ao buscar stats:', error)
    }
  }

  const buscarServicoExistente = async () => {
    const { data } = await supabase
      .from('prestadores_servico')
      .select('id, categoria, opt_in')
      .eq('usuario_id', user.id)
      .single()
    
    setServicoExistente(data || null)
  }

  useEffect(() => {
    if (perfil) {
      // ✅ ATUALIZADO: Normaliza o valor antigo "ambos" para "prestador"
      let tipoPerfil = perfil.tipo_pessoa || 'morador'
      if (tipoPerfil === 'ambos') tipoPerfil = 'prestador'

      setForm({
        nome_completo: perfil.nome_completo || '',
        nome_exibicao: perfil.nome_exibicao || '',
        fase: perfil.fase || '',
        quadra: perfil.quadra || '',
        lote: perfil.lote || '',
        tipo_pessoa: tipoPerfil,
        whatsapp: perfil.whatsapp || '',
        telefone2: perfil.telefone2 || ''
      })
      setAvatarPreview(perfil.avatar_url || null)
    }
  }, [perfil])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (['whatsapp', 'telefone2'].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: formatarFone(value) }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    setError(null)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Envie apenas imagens.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Imagem deve ter no máximo 2MB.'); return }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleGerenciarServico = async () => {
    if (!servicoExistente) {
      const novoServico = {
        usuario_id: user.id,
        nome: form.nome_completo,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        opt_in: true
      }

      const { data, error } = await supabase
        .from('prestadores_servico')
        .insert(novoServico)
        .select('id')
        .single()

      if (error) {
        setError('Erro ao criar serviço: ' + error.message)
        return
      }

      navigate(`/editar-servico/${data.id}`)
    } else {
      navigate(`/editar-servico/${servicoExistente.id}`)
    }
  }

  const handleSalvar = async (e) => {
    e.preventDefault()

    if (!form.nome_completo.trim()) { setError('Nome completo é obrigatório.'); return }
    if (!form.fase) { setError('Informe sua fase.'); return }
    if (!user?.id) { setError('Sessão expirada.'); return }

    setSalvando(true)
    setError(null)

    try {
      let avatarUrl = perfil?.avatar_url || null

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const filePath = `avatars/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true })
        if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = publicUrl
      }

      const dados = {
        nome_completo: form.nome_completo.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, '') || '',
        telefone2: form.telefone2.replace(/\D/g, '') || null,
        nome_exibicao: form.nome_exibicao.trim() || null,
        fase: form.fase,
        quadra: form.quadra.trim() || null,
        lote: form.lote.trim() || null,
        tipo_pessoa: form.tipo_pessoa || 'morador',
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }

      let dbError
      if (perfil) {
        const result = await supabase.from('perfis').update(dados).eq('id', user.id)
        dbError = result.error
      } else {
        const result = await supabase.from('perfis').insert({ ...dados, id: user.id })
        dbError = result.error
      }

      if (dbError) {
        console.error('[Perfil] Erro Supabase:', dbError)
        throw new Error(dbError.message)
      }

      await recarregarPerfil()
      buscarEstatisticas()
      if (ehPrestador) buscarServicoExistente()

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

  const inputClass = 'w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all'

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

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-8 md:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Área do morador</span>
            <h1 className="text-3xl font-bold mt-4">Seu perfil no Bella Vittà</h1>
            <p className="text-white/80 mt-2 max-w-xl">Atualize seus dados pessoais e personalize como você aparece.</p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-5 py-3 bg-white text-emerald-700 rounded-2xl font-semibold hover:bg-emerald-50 transition"
          >
            Voltar ao início
          </button>
        </div>
      </div>

      {/* CARD DE ESTATÍSTICAS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition">
          <span className="text-3xl mb-2">📢</span>
          <p className="text-2xl font-bold text-gray-900">{stats.anuncios}</p>
          <p className="text-xs text-gray-500 mt-1">Meus Anúncios</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition">
          <span className="text-3xl mb-2">🛠️</span>
          <p className="text-2xl font-bold text-gray-900">{stats.servicos}</p>
          <p className="text-xs text-gray-500 mt-1">Meus Serviços</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition">
          <span className="text-3xl mb-2">🤝</span>
          <p className="text-2xl font-bold text-gray-900">{stats.indicacoes}</p>
          <p className="text-xs text-gray-500 mt-1">Minhas Indicações</p>
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

      {/* FORMULÁRIO */}
      <form onSubmit={handleSalvar} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
        
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-gray-100">
          <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-3xl object-cover shadow-md" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center text-4xl">👤</div>
            )}
          </div>

          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />

          <div>
            <h3 className="font-semibold text-gray-900">Foto de perfil</h3>
            <p className="text-sm text-gray-500 mt-1">Clique na foto para alterar sua imagem</p>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div>
          <h2 className="text-xl font-bold mb-5">Dados pessoais</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input name="nome_completo" value={form.nome_completo} onChange={handleChange} placeholder="Nome completo" className={inputClass} required />
            <input name="nome_exibicao" value={form.nome_exibicao} onChange={handleChange} placeholder="Nome de exibição" className={inputClass} />

            <select name="fase" value={form.fase} onChange={handleChange} required className={inputClass}>
              <option value="">Selecione sua fase *</option>
              <option value="Fase 1">Fase 1</option>
              <option value="Fase 2">Fase 2</option>
            </select>

            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp (00) 00000-0000" autoComplete="tel" className={inputClass} />
            <input name="telefone2" value={form.telefone2} onChange={handleChange} placeholder="Telefone adicional (opcional)" autoComplete="tel" className={inputClass} />
            <input name="quadra" value={form.quadra} onChange={handleChange} placeholder="Quadra" className={inputClass} />
            <input name="lote" value={form.lote} onChange={handleChange} placeholder="Lote" className={inputClass} />
          </div>
        </div>

        {/* Tipo de Pessoa */}
        <div>
          <h2 className="text-xl font-bold mb-5">Tipo de perfil</h2>

          {/* ✅ ATUALIZADO: Opções simplificadas */}
          <select name="tipo_pessoa" value={form.tipo_pessoa} onChange={handleChange} className={inputClass}>
            <option value="morador">Morador / Proprietário</option>
            <option value="prestador">Morador / Prestador de Serviços</option>
          </select>

          {/* CARD DE GERENCIAMENTO DO SERVIÇO */}
          {ehPrestador && (
            <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  🛠️
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {servicoExistente ? 'Seu Serviço está cadastrado!' : 'Cadastre seu Serviço'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {servicoExistente 
                      ? `Categoria: ${servicoExistente.categoria || 'Não definida'} • Status: ${servicoExistente.opt_in ? '✅ Visível' : '⏸️ Oculto'}`
                      : 'Preencha todas as informações do seu serviço para aparecer no Mapa de Serviços do condomínio.'}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleGerenciarServico}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      {servicoExistente ? '✏️ Editar Serviço Completo' : '📝 Cadastrar Serviço'}
                    </button>
                    
                    {servicoExistente && stats.servicos > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate('/mapa')}
                        className="px-6 py-3 bg-white text-emerald-700 border-2 border-emerald-200 rounded-xl font-semibold hover:bg-emerald-50 transition cursor-pointer"
                      >
                        👁️ Ver no Mapa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão Salvar */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={salvando}
            className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-70 cursor-pointer"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PerfilPage