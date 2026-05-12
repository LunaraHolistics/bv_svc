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
  const [servicosDoUsuario, setServicosDoUsuario] = useState([])
  const [excluindoId, setExcluindoId] = useState(null)

  const [form, setForm] = useState({
    nome_completo: '', nome_exibicao: '', fase: '', quadra: '', lote: '',
    endereco_rua: '', endereco_numero: '', tipo_pessoa: 'morador', whatsapp: '', telefone2: ''
  })

  const ehPrestador = form.tipo_pessoa === 'prestador' || form.tipo_pessoa === 'ambos'

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true })
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (user) buscarEstatisticas()
  }, [user])

  const buscarServicosDoUsuario = async () => {
    if (!user) { setServicosDoUsuario([]); return }
    const { data, error } = await supabase.from('prestadores_servico').select('id, categoria, opt_in, casa_numero').eq('usuario_id', user.id).order('created_at', { ascending: false })
    if (!error) setServicosDoUsuario(data || [])
  }

  useEffect(() => { buscarServicosDoUsuario() }, [user])

  const buscarEstatisticas = async () => {
    const fetchCount = async (tabela) => {
      try {
        const res1 = await supabase.from(tabela).select('*', { count: 'exact', head: true }).eq('usuario_id', user.id)
        if (!res1.error) return res1.count || 0
        const res2 = await supabase.from(tabela).select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        if (!res2.error) return res2.count || 0
      } catch (err) { }
      return 0
    }
    const fetchAnunciosAtivos = async () => {
      try {
        const res = await supabase.from('anuncios_vendas').select('*', { count: 'exact', head: true }).eq('usuario_id', user.id).eq('status', 'Ativo')
        return res.error ? 0 : (res.count || 0)
      } catch (err) { return 0 }
    }
    const [anuncios, servicos, indicacoes] = await Promise.all([fetchAnunciosAtivos(), fetchCount('prestadores_servico'), fetchCount('indicacoes')])
    setStats({ anuncios, servicos, indicacoes })
  }

  useEffect(() => {
    if (perfil) {
      setForm({
        nome_completo: perfil.nome_completo || '', nome_exibicao: perfil.nome_exibicao || '', fase: perfil.fase || '', quadra: perfil.quadra || '',
        lote: perfil.lote || '', endereco_rua: perfil.endereco_rua || '', endereco_numero: perfil.endereco_numero || '',
        tipo_pessoa: perfil.tipo_pessoa || 'morador', whatsapp: perfil.whatsapp || '', telefone2: perfil.telefone2 || ''
      })
      setAvatarPreview(perfil.avatar_url || null)
    }
  }, [perfil])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (['whatsapp', 'telefone2'].includes(name)) setForm((prev) => ({ ...prev, [name]: formatarFone(value) }))
    else setForm((prev) => ({ ...prev, [name]: value }))
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

  const handleAdicionarServico = () => {
    const enderecoCompleto = [form.endereco_rua.trim(), form.endereco_numero.trim()].filter(Boolean).join(', ')
    navigate(`/editar-servico/novo?endereco=${encodeURIComponent(enderecoCompleto)}`)
  }

  const handleExcluirServico = async (id) => {
    if (!window.confirm('Excluir este serviço permanentemente?')) return
    setExcluindoId(id)
    const { error } = await supabase.from('prestadores_servico').delete().eq('id', id)
    if (error) { alert('❌ Erro ao excluir: ' + error.message); setExcluindoId(null); return }
    setServicosDoUsuario(prev => prev.filter(s => s.id !== id))
    setStats(prev => ({ ...prev, servicos: Math.max(0, prev.servicos - 1) }))
    setExcluindoId(null)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!form.nome_completo.trim()) { setError('Nome completo é obrigatório.'); return }
    if (!form.fase) { setError('Informe sua fase.'); return }
    if (ehPrestador && (!form.endereco_rua.trim() || !form.endereco_numero.trim())) { setError('Para prestadores, o nome da rua e número do imóvel são obrigatórios.'); return }
    if (!user?.id) { setError('Sessão expirada.'); return }

    setSalvando(true); setError(null)
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
        nome_completo: form.nome_completo.trim(), whatsapp: form.whatsapp.replace(/\D/g, '') || '', telefone2: form.telefone2.replace(/\D/g, '') || null,
        nome_exibicao: form.nome_exibicao.trim() || null, fase: form.fase, quadra: form.quadra.trim() || null, lote: form.lote.trim() || null,
        endereco_rua: form.endereco_rua.trim() || null, endereco_numero: form.endereco_numero.trim() || null,
        tipo_pessoa: form.tipo_pessoa || 'morador', avatar_url: avatarUrl, updated_at: new Date().toISOString()
      }

      let dbError
      if (perfil) { const result = await supabase.from('perfis').update(dados).eq('id', user.id); dbError = result.error }
      else { const result = await supabase.from('perfis').insert({ ...dados, id: user.id }); dbError = result.error }

      if (dbError) { console.error('[Perfil] Erro Supabase:', dbError); throw new Error(dbError.message) }

      if (ehPrestador && (form.endereco_rua || form.endereco_numero)) {
        const novoEnderecoFormatado = [form.endereco_rua.trim(), form.endereco_numero.trim()].filter(Boolean).join(', ')
        const idsParaAtualizar = (servicosDoUsuario || []).map(s => s.id)
        if (idsParaAtualizar.length > 0) await supabase.from('prestadores_servico').update({ casa_numero: novoEnderecoFormatado }).in('id', idsParaAtualizar)
      }

      await recarregarPerfil(); buscarEstatisticas(); buscarServicosDoUsuario()
      setSucesso(true); setAvatarFile(null)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err) {
      console.error('[Perfil] Erro ao salvar:', err); setError(err.message || 'Erro ao salvar perfil.')
    } finally { setSalvando(false) }
  }

  // ✅ CORREÇÃO: Inputs menores no mobile (py-2.5) e arredondamento mais leve
  const inputClass = 'w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm sm:text-base'

  if (authLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  )

  if (!user) return null

  const mostrarCardServicos = ehPrestador || servicosDoUsuario.length > 0

  return (
    // ✅ CORREÇÃO: Gap vertical menor no mobile
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-6 sm:p-8 md:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Área do morador</span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-4">Seu perfil no Bella Vittà</h1>
            <p className="text-white/80 mt-2 max-w-xl text-sm sm:text-base">Atualize seus dados pessoais e personalize como você aparece.</p>
          </div>
          <button onClick={() => navigate('/')} className="px-5 py-3 bg-white text-emerald-700 rounded-2xl font-semibold hover:bg-emerald-50 transition cursor-pointer text-sm sm:text-base">
            Voltar ao início
          </button>
        </div>
      </div>

      {/* ✅ CORREÇÃO: Grid de estatísticas compacto no mobile para não estourar a largura */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <button type="button" onClick={() => navigate('/anuncios')} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition cursor-pointer">
          <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">📢</span>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.anuncios}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Meus Anúncios</p>
        </button>
        <button type="button" onClick={() => navigate('/mapa')} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition cursor-pointer">
          <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">🛠️</span>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.servicos}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Meus Serviços</p>
        </button>
        <button type="button" onClick={() => navigate('/indicacoes')} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-5 flex flex-col items-center justify-center text-center hover:shadow-md transition cursor-pointer">
          <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">🤝</span>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.indicacoes}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Minhas Indicações</p>
        </button>
      </div>

      {sucesso && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-sm sm:text-base">Perfil salvo com sucesso ✨</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm sm:text-base">{error}</div>}

      {/* FORMULÁRIO */}
      <form onSubmit={handleSalvar} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">

        {/* Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 pb-6 border-b border-gray-100">
          <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
            {avatarPreview ? (
              // ✅ CORREÇÃO: Avatar menor no mobile (80px)
              <img src={avatarPreview} alt="avatar" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover shadow-md" />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-emerald-50 flex items-center justify-center text-3xl sm:text-4xl">👤</div>
            )}
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Foto de perfil</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Clique na foto para alterar</p>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5">Dados pessoais</h2>
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            <input name="nome_completo" value={form.nome_completo} onChange={handleChange} placeholder="Nome completo *" className={inputClass} required />
            <input name="nome_exibicao" value={form.nome_exibicao} onChange={handleChange} placeholder="Nome de exibição (apelido)" className={inputClass} />
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

        {/* Localização */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 gap-2">
            <h2 className="text-lg sm:text-xl font-bold">Localização do imóvel</h2>
            {ehPrestador && (
              <span className="text-[10px] sm:text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium text-center sm:text-left">
                Obrigatório para prestadores
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            <input name="endereco_rua" value={form.endereco_rua} onChange={handleChange} placeholder="Nome da rua / avenida" required={ehPrestador} className={`${inputClass} ${ehPrestador && !form.endereco_rua.trim() ? 'border-red-300 focus:ring-red-400' : ''}`} />
            <input name="endereco_numero" value={form.endereco_numero} onChange={handleChange} placeholder="Número do lote / casa" required={ehPrestador} className={`${inputClass} ${ehPrestador && !form.endereco_numero.trim() ? 'border-red-300 focus:ring-red-400' : ''}`} />
          </div>
          {!ehPrestador && <p className="text-xs text-gray-400 mt-2">Opcional para proprietários que ainda não construíram.</p>}
        </div>

        {/* Tipo de Pessoa */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5">Tipo de perfil</h2>
          <select name="tipo_pessoa" value={form.tipo_pessoa} onChange={handleChange} className={inputClass}>
            <option value="morador">Morador / Proprietário</option>
            <option value="prestador">Morador / Prestador de Serviços</option>
          </select>
        </div>

        {/* CARD DE SERVIÇOS */}
        {mostrarCardServicos && (
          <div className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0">🛠️</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                  {servicosDoUsuario.length > 0 ? `Você tem ${servicosDoUsuario.length} serviço${servicosDoUsuario.length > 1 ? 's cadastrados' : ' cadastrado'}` : 'Cadastre seu primeiro serviço'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {servicosDoUsuario.length > 0 ? 'Gerencie seus serviços abaixo.' : 'Preencha as informações para aparecer no mapa.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
                  <button type="button" onClick={handleAdicionarServico} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 cursor-pointer text-sm sm:text-base">
                    ➕ Adicionar novo
                  </button>
                  {servicosDoUsuario.length > 0 && (
                    <button type="button" onClick={() => navigate('/mapa')} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-emerald-700 border-2 border-emerald-200 rounded-xl font-semibold hover:bg-emerald-50 transition cursor-pointer text-sm sm:text-base">
                      👁️ Ver no Mapa
                    </button>
                  )}
                </div>

                {servicosDoUsuario.length > 0 && (
                  <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
                    {servicosDoUsuario.map((servico) => {
                      const estaExcluindo = excluindoId === servico.id
                      return (
                        <div key={servico.id} className={`p-2.5 sm:p-3 bg-white rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 transition ${estaExcluindo ? 'border-red-300 opacity-60' : 'border-gray-100 hover:shadow-sm'}`}>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate text-sm">{estaExcluindo ? 'Excluindo...' : (servico.categoria || 'Sem categoria')}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{servico.casa_numero || 'Sem endereço'}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => navigate(`/editar-servico/${servico.id}`)} disabled={estaExcluindo} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                              ✏️ Editar
                            </button>
                            <button type="button" onClick={() => handleExcluirServico(servico.id)} disabled={estaExcluindo} className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                              {estaExcluindo ? (
                                <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />Aguarde</span>
                              ) : '🗑️ Excluir'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="pt-4 border-t border-gray-100">
          <button type="submit" disabled={salvando} className="w-full md:w-auto px-6 sm:px-8 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 disabled:opacity-70 cursor-pointer text-sm sm:text-base">
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PerfilPage