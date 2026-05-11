import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

const DetalhesExpandidos = ({ usuarioId }) => {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!usuarioId) {
      setLoading(false)
      setDados({ tipo: 'importado' })
      return
    }

    const buscarDadosMorador = async () => {
      setLoading(true)
      try {
        const { data: perfil } = await supabase
          .from('perfis')
          .select('nome_completo, whatsapp, email, fase, quadra, lote, tipo_pessoa')
          .eq('id', usuarioId)
          .single()

        const [resAnuncios, resServicos, resIndicacoes] = await Promise.all([
          supabase.from('anuncios_vendas').select('*', { count: 'exact', head: true }).or(`usuario_id.eq.${usuarioId},user_id.eq.${usuarioId}`),
          supabase.from('prestadores_servico').select('*', { count: 'exact', head: true }).or(`usuario_id.eq.${usuarioId},user_id.eq.${usuarioId}`),
          supabase.from('indicacoes').select('*', { count: 'exact', head: true }).or(`usuario_id.eq.${usuarioId},user_id.eq.${usuarioId}`)
        ])

        setDados({
          tipo: 'morador',
          perfil: perfil || {},
          anuncios: resAnuncios.count || 0,
          servicos: resServicos.count || 0,
          indicacoes: resIndicacoes.count || 0
        })
      } catch (error) {
        console.error('Erro ao buscar detalhes:', error)
        setDados({ tipo: 'erro' })
      } finally {
        setLoading(false)
      }
    }

    buscarDadosMorador()
  }, [usuarioId])

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 border-t border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    )
  }

  if (dados?.tipo === 'importado') {
    return (
      <div className="p-4 bg-amber-50 border-t border-amber-100 text-sm text-amber-700">
        ⚠️ <strong>Registro importado:</strong> Cadastro feito via formulário externo (JotForm).
      </div>
    )
  }

  if (dados?.tipo === 'erro' || !dados?.perfil) {
    return (
      <div className="p-4 bg-red-50 border-t border-red-100 text-sm text-red-600">
        Erro ao carregar os dados do morador ou perfil não encontrado.
      </div>
    )
  }

  const { perfil, anuncios, servicos, indicacoes } = dados

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-100">
      <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">👤 Dados do Morador no Sistema</h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-gray-500">Nome Completo</p>
          <p className="font-semibold text-gray-900 mt-0.5">{perfil.nome_completo || 'Não informado'}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-gray-500">Contato / WhatsApp</p>
          <p className="font-semibold text-gray-900 mt-0.5">{perfil.whatsapp || perfil.email || 'Não informado'}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-gray-500">Localização</p>
          <p className="font-semibold text-gray-900 mt-0.5">{perfil.fase ? `${perfil.fase}` : ''} {perfil.quadra ? `Qd ${perfil.quadra}` : ''} {perfil.lote ? `Lt ${perfil.lote}` : 'Não informado'}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-gray-500">Tipo de Cadastro</p>
          <p className="font-semibold text-gray-900 mt-0.5 capitalize">{perfil.tipo_pessoa || 'Morador'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-center border border-emerald-100">
          <p className="text-2xl font-bold">{anuncios}</p>
          <p className="text-[10px] font-medium mt-1">Anúncios</p>
        </div>
        <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-center border border-blue-100">
          <p className="text-2xl font-bold">{servicos}</p>
          <p className="text-[10px] font-medium mt-1">Serviços</p>
        </div>
        <div className="bg-purple-50 text-purple-700 p-3 rounded-lg text-center border border-purple-100">
          <p className="text-2xl font-bold">{indicacoes}</p>
          <p className="text-[10px] font-medium mt-1">Indicações</p>
        </div>
      </div>
    </div>
  )
}


const PainelAdminPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('servicos')
  
  const [servicos, setServicos] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [indicacoes, setIndicacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandidoId, setExpandidoId] = useState(null)

  // CORREÇÃO PRINCIPAL: Busca TUDO apenas quando o usuário loga, sem depender da aba
  useEffect(() => {
    if (user?.id !== MASTER_USER_ID) return
    buscarTodosOsDados()
  }, [user?.id])

  // FUNÇÃO ÚNICA: Busca as 3 tabelas em paralelo sempre
  const buscarTodosOsDados = async () => {
    setLoading(true)
    try {
      const [resServicos, resAnuncios, resIndicacoes] = await Promise.all([
        supabase.from('prestadores_servico').select('*').order('nome'),
        supabase.from('anuncios_vendas').select('*').order('created_at', { ascending: false }),
        supabase.from('indicacoes').select('*').order('created_at', { ascending: false })
      ])

      setServicos(resServicos.data || [])
      setAnuncios(resAnuncios.data || [])
      setIndicacoes(resIndicacoes.data || [])
    } catch (error) {
      console.error("Erro ao buscar dados admin:", error)
    } finally {
      setLoading(false)
    }
  }

  const deletarServico = async (id) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este serviço?')) return
    const { error } = await supabase.from('prestadores_servico').delete().eq('id', id)
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      buscarTodosOsDados() // Busca tudo de novo após deletar
    }
  }

  const deletarAnuncio = async (id) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este anúncio?')) return
    const { error } = await supabase.from('anuncios_vendas').delete().eq('id', id)
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      buscarTodosOsDados()
    }
  }

  const deletarIndicacao = async (id) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR esta indicação?')) return
    const { error } = await supabase.from('indicacoes').delete().eq('id', id)
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      buscarTodosOsDados()
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const renderLista = (items, tipo) => {
    if (items.length === 0) return <p className="text-gray-500 py-10 text-center">Nenhum registro encontrado.</p>

    return (
      <div className="space-y-2">
        {items.map((item) => {
          const taExpandido = expandidoId === item.id
          const titulo = item.nome || item.titulo || item.nome_profissional || 'Sem título'
          const subtitulo = item.categoria || item.status || 'Sem categoria'
          const userId = item.usuario_id || item.user_id

          return (
            <div key={item.id} className={`border rounded-xl overflow-hidden transition-all ${taExpandido ? 'border-emerald-300 shadow-md' : 'border-gray-100 hover:bg-gray-50'}`}>
              <div 
                onClick={() => setExpandidoId(taExpandido ? null : item.id)}
                className="flex items-center justify-between p-4 cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${taExpandido ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {taExpandido ? '▲' : '▼'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{titulo}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {subtitulo} • ID: {userId?.substring(0,8) || 'Nulo (Importado)'}...
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation() 
                    if (tipo === 'servico') deletarServico(item.id)
                    if (tipo === 'anuncio') deletarAnuncio(item.id)
                    if (tipo === 'indicacao') deletarIndicacao(item.id)
                  }} 
                  className="ml-4 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition cursor-pointer shrink-0"
                >
                  EXCLUIR
                </button>
              </div>

              {taExpandido && (
                <DetalhesExpandidos usuarioId={userId} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between bg-red-600 text-white p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">🛡️ Painel Master Admin</h1>
            <p className="text-red-100 text-sm mt-1">Clique em qualquer item para expandir. Logado como: {user?.email}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition cursor-pointer">Voltar ao Site</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-white text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition cursor-pointer">Sair</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        <div className="md:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 sticky top-8">
            <button onClick={() => setAbaAtiva('servicos')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${abaAtiva === 'servicos' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-600'}`}>
              🛠️ Serviços ({servicos.length})
            </button>
            <button onClick={() => setAbaAtiva('anuncios')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${abaAtiva === 'anuncios' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-600'}`}>
              📢 Anúncios ({anuncios.length})
            </button>
            <button onClick={() => setAbaAtiva('indicacoes')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${abaAtiva === 'indicacoes' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50 text-gray-600'}`}>
              👥 Indicações ({indicacoes.length})
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 min-h-[500px]">
          {loading ? (
            <p className="text-gray-400 text-center py-20">Carregando dados...</p>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {abaAtiva === 'servicos' && 'Gerenciar Prestadores de Serviço'}
                {abaAtiva === 'anuncios' && 'Gerenciar Anúncios'}
                {abaAtiva === 'indicacoes' && 'Gerenciar Indicações'}
              </h2>
              
              {abaAtiva === 'servicos' && renderLista(servicos, 'servico')}
              {abaAtiva === 'anuncios' && renderLista(anuncios, 'anuncio')}
              {abaAtiva === 'indicacoes' && renderLista(indicacoes, 'indicacao')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PainelAdminPage