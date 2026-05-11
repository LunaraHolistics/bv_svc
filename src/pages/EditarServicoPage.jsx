import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

const MAX_IMAGENS = 5
const TAMANHO_MAX_MB = 3

const EditarServicoPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState(null)
  const [ehNovo, setEhNovo] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    casa_numero: '',
    categoria: '',
    whatsapp: '',
    descricao_comercial: '',
    nome_fantasia: '',
    servicos_oferecidos: '',
    condicoes_moradores: '',
    instagram_url: '',
    site_url: '',
    opt_in: true
  })

  const [imagensExistentes, setImagensExistentes] = useState([])
  const [novasImagens, setNovasImagens] = useState([])

  useEffect(() => {
    if (id === 'novo') {
      setEhNovo(true)
      carregarDadosPerfil()
    } else {
      buscarServico()
    }
  }, [id])

  const carregarDadosPerfil = async () => {
    const { data: servico } = await supabase
      .from('prestadores_servico')
      .select('id')
      .eq('usuario_id', user.id)
      .maybeSingle()
    
    if (servico) {
      navigate(`/editar-servico/${servico.id}`, { replace: true })
      return
    }

    const { data } = await supabase
      .from('perfis')
      .select('nome_completo, whatsapp')
      .eq('id', user.id)
      .single()

    if (data) {
      setForm(prev => ({
        ...prev,
        nome: data.nome_completo || '',
        whatsapp: data.whatsapp || ''
      }))
    }

    setLoading(false)
  }

  const buscarServico = async () => {
    const { data, error } = await supabase
      .from('prestadores_servico')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      setError('Erro ao carregar serviço.')
      setLoading(false)
      return
    }

    const isMaster = user?.id === MASTER_USER_ID
    const isOwner = user?.id === data.usuario_id
    if (!isMaster && !isOwner) {
      navigate('/perfil', { replace: true })
      return
    }

    setForm({
      nome: data.nome || '',
      casa_numero: data.casa_numero || '',
      categoria: data.categoria || '',
      whatsapp: data.whatsapp || '',
      descricao_comercial: data.descricao_comercial || data.descricao || '',
      nome_fantasia: data.nome_fantasia || '',
      servicos_oferecidos: Array.isArray(data.servicos_oferecidos) ? data.servicos_oferecidos.join(', ') : '',
      condicoes_moradores: data.condicoes_moradores || '',
      instagram_url: data.instagram_url || '',
      site_url: data.site_url || '',
      opt_in: data.opt_in !== false
    })

    try {
      const imgs = JSON.parse(data.imagens_url || '[]')
      setImagensExistentes(imgs)
    } catch {
      setImagensExistentes([])
    }

    setLoading(false)
  }

  const handleForm = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    // ✅ NOVO: Validação de quantidade total
    const totalAtual = imagensExistentes.length + novasImagens.length
    if (totalAtual + files.length > MAX_IMAGENS) {
      alert(`Você atingiu o limite de ${MAX_IMAGENS} imagens. Pode ter até ${MAX_IMAGENS} no total.`)
      e.target.value = '' // Limpa o input
      return
    }

    // ✅ NOVO: Validação de tamanho individual
    for (const file of files) {
      const tamanhoMb = file.size / (1024 * 1024)
      if (tamanhoMb > TAMANHO_MAX_MB) {
        alert(`A imagem "${file.name}" tem ${tamanhoMb.toFixed(1)}MB e excede o limite de ${TAMANHO_MAX_MB}MB.\n\nDica: Tire um novo print ou use um app de celular para reduzir a qualidade antes de enviar.`)
        e.target.value = '' // Limpa o input
        return
      }
    }

    setSalvando(true)
    
    const novas = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('imagens-servicos').upload(fileName, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('imagens-servicos').getPublicUrl(fileName)
        novas.push(publicUrl)
      } else {
        alert('Erro ao subir imagem: ' + error.message)
      }
    }
    setNovasImagens(prev => [...prev, ...novas])
    setSalvando(false)
    e.target.value = '' // Limpa o input para permitir selecionar o mesmo arquivo de novo
  }

  const removeImagemExistente = (index) => {
    setImagensExistentes(prev => prev.filter((_, i) => i !== index))
  }

  const removeImagemNova = (index) => {
    setNovasImagens(prev => prev.filter((_, i) => i !== index))
  }

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja EXCLUIR este serviço permanentemente?')) {
      await supabase.from('prestadores_servico').delete().eq('id', id)
      navigate('/perfil', { replace: true })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)

    const todasImagens = [...imagensExistentes, ...novasImagens]
    const servicosArray = form.servicos_oferecidos.split(',').map(s => s.trim()).filter(Boolean)

    const dadosServico = {
      nome: form.nome.trim(),
      casa_numero: form.casa_numero.trim(),
      categoria: form.categoria.trim(),
      whatsapp: form.whatsapp.replace(/\D/g, ''),
      descricao_comercial: form.descricao_comercial.trim() || null,
      nome_fantasia: form.nome_fantasia.trim() || null,
      servicos_oferecidos: servicosArray.length > 0 ? servicosArray : null,
      condicoes_moradores: form.condicoes_moradores.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      site_url: form.site_url.trim() || null,
      opt_in: form.opt_in,
      imagens_url: todasImagens.length > 0 ? JSON.stringify(todasImagens) : null,
      usuario_id: user.id
    }

    let error
    if (ehNovo) {
      const result = await supabase.from('prestadores_servico').insert(dadosServico).select('id').single()
      error = result.error
      if (!error) {
        navigate(`/editar-servico/${result.data.id}`, { replace: true })
        setSalvando(false)
        return
      }
    } else {
      const result = await supabase.from('prestadores_servico').update(dadosServico).eq('id', id)
      error = result.error
    }

    if (error) alert('Erro ao salvar: ' + error.message)
    else navigate('/perfil')
    setSalvando(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500 gap-3">
        <div className="w-7 h-7 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        Carregando dados do serviço...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-gray-900">{error}</h2>
        <button onClick={() => navigate('/perfil')} className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition cursor-pointer">
          Voltar ao perfil
        </button>
      </div>
    )
  }

  const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none'
  const totalImagens = imagensExistentes.length + novasImagens.length

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {ehNovo ? 'Cadastrar Meu Serviço' : 'Editar Meu Serviço'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {ehNovo ? 'Preencha as informações para aparecer no mapa' : 'Atualize as informações do seu serviço'}
          </p>
        </div>
        {!ehNovo && (
          <button onClick={handleDelete} className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition cursor-pointer font-medium">
            🗑️ Excluir Serviço
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
          <input name="nome" value={form.nome} onChange={handleForm} required className={inputClass} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
            <input name="nome_fantasia" value={form.nome_fantasia} onChange={handleForm} placeholder="Opcional" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <input name="categoria" value={form.categoria} onChange={handleForm} required placeholder="Ex: Encanador, Eletricista" className={inputClass} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleForm} required placeholder="11999999999" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua/Av + Número da Casa *</label>
            <input name="casa_numero" value={form.casa_numero} onChange={handleForm} required placeholder="Ex: Rua das Palmeiras, Casa 15" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Comercial</label>
          <textarea name="descricao_comercial" value={form.descricao_comercial} onChange={handleForm} rows={3} placeholder="Descreva seu serviço em detalhes..." className={`${inputClass} resize-none`} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serviços Oferecidos</label>
          <input name="servicos_oferecidos" value={form.servicos_oferecidos} onChange={handleForm} placeholder="Separe por vírgula: Reparo hidráulico, Instalação" className={inputClass} />
        </div>

        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <label className="block text-sm font-semibold text-amber-800 mb-1">⭐ Benefícios para moradores</label>
          <input name="condicoes_moradores" value={form.condicoes_moradores} onChange={handleForm} placeholder="Ex: 10% de desconto" className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none" />
          <p className="text-xs text-amber-600 mt-1">Destaque condições especiais para atrair mais clientes</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input name="instagram_url" value={form.instagram_url} onChange={handleForm} placeholder="@seuperfil" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <input name="site_url" value={form.site_url} onChange={handleForm} placeholder="https://seusite.com" className={inputClass} />
          </div>
        </div>

        {/* UPLOAD DE IMAGENS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Fotos / Divulgação</label>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${totalImagens >= MAX_IMAGENS ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
              {totalImagens} / {MAX_IMAGENS} fotos
            </span>
          </div>
          
          {/* Aviso de regras */}
          <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            📌 <strong>Regras de envio:</strong> Máximo de <strong>{MAX_IMAGENS} fotos</strong>. Cada imagem deve ter até <strong>{TAMANHO_MAX_MB}MB</strong>. Se a foto estiver pesada, reduza a qualidade no celular antes de enviar.
          </div>

          {/* Imagens já existentes */}
          {imagensExistentes.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {imagensExistentes.map((img, i) => (
                <div key={`exist-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImagemExistente(i)}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Novas imagens (ainda não salvas) */}
          {novasImagens.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {novasImagens.map((img, i) => (
                <div key={`nova-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-300 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImagemNova(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[9px] text-center py-0.5">nova</span>
                </div>
              ))}
            </div>
          )}

          {/* Input bloqueado se atingiu o limite */}
          {totalImagens < MAX_IMAGENS ? (
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          ) : (
            <div className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm text-gray-400 font-medium">
              Você atingiu o limite de {MAX_IMAGENS} fotos. Remova alguma para enviar uma nova.
            </div>
          )}
        </div>

        {/* VISIBILIDADE */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="opt_in"
            name="opt_in"
            checked={form.opt_in}
            onChange={handleForm}
            className="w-4 h-4 accent-emerald-600"
          />
          <label htmlFor="opt_in" className="text-sm text-gray-700">
            Visível para os moradores no mapa de serviços
          </label>
        </div>

        {/* BOTÕES */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
          >
            {salvando
              ? 'Salvando...'
              : ehNovo
                ? 'Cadastrar Serviço'
                : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditarServicoPage