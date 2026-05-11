import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

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
      setLoading(false)
      // Preenche com dados do perfil se disponível
      carregarDadosPerfil()
    } else {
      buscarServico()
    }
  }, [id])

  const carregarDadosPerfil = async () => {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setForm({
        nome: data.nome_completo || '',
        casa_numero: '',
        categoria: '',
        whatsapp: data.whatsapp || '',
        descricao_comercial: data.descricao_comercial || '',
        nome_fantasia: data.nome_fantasia || '',
        servicos_oferecidos: Array.isArray(data.servicos_oferecidos) ? data.servicos_oferecidos.join(', ') : '',
        condicoes_moradores: '',
        instagram_url: data.instagram_url || '',
        site_url: data.site_url || '',
        opt_in: true
      })
    }
  }

  const buscarServico = async () => {
    const { data, error } = await supabase.from('prestadores_servico').select('*').eq('id', id).single()
    if (error) { setError('Erro ao carregar serviço.'); setLoading(false); return }
    
    // SEGURANÇA: Só deixa editar se for DONO ou MASTER
    const isMaster = user?.id === MASTER_USER_ID
    const isOwner = user?.id === data.usuario_id
    if (!isMaster && !isOwner) { navigate('/mapa', { replace: true }); return }

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
    } catch { setImagensExistentes([]) }

    setLoading(false)
  }

  const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
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
  }

  const removeImagemExistente = (index) => {
    setImagensExistentes(prev => prev.filter((_, i) => i !== index))
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
      nome: form.nome,
      casa_numero: form.casa_numero,
      categoria: form.categoria,
      whatsapp: form.whatsapp,
      descricao_comercial: form.descricao_comercial,
      nome_fantasia: form.nome_fantasia,
      servicos_oferecidos: servicosArray,
      condicoes_moradores: form.condicoes_moradores,
      instagram_url: form.instagram_url,
      site_url: form.site_url,
      opt_in: form.opt_in,
      imagens_url: JSON.stringify(todasImagens),
      usuario_id: user.id
    }

    let error
    if (ehNovo || id === 'novo') {
      // CRIAÇÃO
      const result = await supabase.from('prestadores_servico').insert(dadosServico).select('id').single()
      error = result.error
      if (!error) {
        navigate(`/editar-servico/${result.data.id}`)
        return
      }
    } else {
      // ATUALIZAÇÃO
      const result = await supabase.from('prestadores_servico').update(dadosServico).eq('id', id)
      error = result.error
    }

    if (error) alert('Erro ao salvar: ' + error.message)
    else navigate('/perfil')
    setSalvando(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando dados do serviço...</div>
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {ehNovo ? 'Cadastrar Meu Serviço' : 'Editar Meu Serviço'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {ehNovo ? 'Preencha todas as informações para aparecer no mapa' : 'Atualize as informações do seu serviço'}
          </p>
        </div>
        {!ehNovo && (
          <button onClick={handleDelete} className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition cursor-pointer font-medium">
            🗑️ Excluir Serviço
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
          <input name="nome" value={form.nome} onChange={handleForm} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia (Opcional)</label>
            <input name="nome_fantasia" value={form.nome_fantasia} onChange={handleForm} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua/Av + Número da Casa *</label>
            <input name="casa_numero" value={form.casa_numero} onChange={handleForm} required placeholder="Ex: Rua das Palmeiras, Casa 15" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <input name="categoria" value={form.categoria} onChange={handleForm} required placeholder="Ex: Encanador, Eletricista" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleForm} placeholder="11999999999" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Comercial</label>
          <textarea name="descricao_comercial" value={form.descricao_comercial} onChange={handleForm} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Serviços Oferecidos (separe por vírgula)</label>
          <input name="servicos_oferecidos" value={form.servicos_oferecidos} onChange={handleForm} placeholder="Ex: Reparo hidráulico, Instalação" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Benefícios para moradores</label>
          <input name="condicoes_moradores" value={form.condicoes_moradores} onChange={handleForm} placeholder="Ex: 10% de desconto" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            <input name="instagram_url" value={form.instagram_url} onChange={handleForm} placeholder="@seuperfil" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <input name="site_url" value={form.site_url} onChange={handleForm} placeholder="https://seusite.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>

        {/* UPLOAD DE IMAGENS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fotos / Divulgação</label>
          {imagensExistentes.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {imagensExistentes.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                  <img src={img} alt="" className="w-full h-full object-cover"/>
                  <button type="button" onClick={() => removeImagemExistente(i)} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs cursor-pointer">X</button>
                </div>
              ))}
            </div>
          )}
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="opt_in" checked={form.opt_in} onChange={(e) => setForm({...form, opt_in: e.target.checked})} className="w-4 h-4 accent-emerald-600" />
          <label htmlFor="opt_in" className="text-sm text-gray-700">Visível para os moradores</label>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate('/perfil')} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition cursor-pointer">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer">
            {salvando ? 'Salvando...' : (ehNovo ? 'Cadastrar Serviço' : 'Salvar Alterações')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditarServicoPage