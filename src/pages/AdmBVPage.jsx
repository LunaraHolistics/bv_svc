import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

// Função auxiliar para checar se está no período válido
const estaNoPeriodo = (inicio, fim) => {
  const agora = new Date()
  const depoisDoInicio = inicio ? new Date(inicio) <= agora : true
  const antesDoFim = fim ? new Date(fim) >= agora : true
  return depoisDoInicio && antesDoFim
}

const formatarData = (dataStr) => {
  if (!dataStr) return 'Indefinido'
  return new Date(dataStr).toLocaleString('pt-BR', { 
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  })
}

const AdmBVPage = () => {
  const { user, perfil, logout } = useAuth()
  const navigate = useNavigate()
  
  const isMasterDev = user?.id === MASTER_USER_ID
  
  const [avisos, setAvisos] = useState([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('ativos') // 'ativos' ou 'historico'
  
  // Formulário
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [enviando, setEnviando] = useState(false)
  
  // Modal de reativação
  const [reativandoId, setReativandoId] = useState(null)
  const [novaDataFim, setNovaDataFim] = useState('')

  useEffect(() => { buscarAvisos() }, [])

  const buscarAvisos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('avisos_admin')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error) setAvisos(data || [])
    setLoading(false)
  }

  const handlePublicar = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !mensagem.trim()) return alert('Preencha título e mensagem.')
    
    setEnviando(true)
    
    const dadosAviso = {
      titulo,
      mensagem,
      criado_por: user.id,
      data_inicio: dataInicio ? new Date(dataInicio).toISOString() : new Date().toISOString(),
      data_fim: dataFim ? new Date(dataFim).toISOString() : null, // null = não expira
      ativo: true
    }

    const { error } = await supabase.from('avisos_admin').insert(dadosAviso)
    
    if (error) alert('Erro: ' + error.message)
    else { 
      setTitulo(''); 
      setMensagem(''); 
      setDataInicio(''); 
      setDataFim(''); 
      buscarAvisos() 
    }
    setEnviando(false)
  }

  const handleReativar = async () => {
    if (!novaDataFim) return alert('Informe a nova data de fim.')
    
    const { error } = await supabase
      .from('avisos_admin')
      .update({
        data_inicio: new Date().toISOString(),
        data_fim: new Date(novaDataFim).toISOString(),
        ativo: true
      })
      .eq('id', reativandoId)

    if (error) alert('Erro ao reativar: ' + error.message)
    else {
      setReativandoId(null)
      setNovaDataFim('')
      buscarAvisos()
    }
  }

  const toggleForcarInativo = async (aviso) => {
    // Permite o admin forçar a desativação manual, mesmo com data válida
    await supabase.from('avisos_admin').update({ ativo: !aviso.ativo }).eq('id', aviso.id)
    buscarAvisos()
  }

  const deletarAviso = async (id) => {
    if (!window.confirm('Excluir permanentemente? Isso tirará do histórico.')) return
    await supabase.from('avisos_admin').delete().eq('id', id)
    buscarAvisos()
  }

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }) }

  // Divide os avisos entre os que estão no período válido e os expirados
  const avisosAtivos = avisos.filter(a => a.ativo !== false && estaNoPeriodo(a.data_inicio, a.data_fim))
  const avisosHistorico = avisos.filter(a => a.ativo === false || !estaNoPeriodo(a.data_inicio, a.data_fim))

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">🏢 Painel Adm. do Condomínio</h1>
            <p className="text-amber-100 text-sm mt-1">Logado como: {user?.email} {isMasterDev ? '(Acesso Master Dev)' : '(Admin Condomínio)'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition cursor-pointer">Voltar</button>
            <button onClick={handleLogout} className="px-4 py-2 bg-white text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-50 transition cursor-pointer">Sair</button>
          </div>
        </div>
        
        {isMasterDev && (
          <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm">
            ⚠️ <strong>Modo Desenvolvedor:</strong> Você está acessando como Master. Em produção, apenas o perfil de Administração do Condomínio terá acesso a este local.
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-6">
        
        {/* FORMULÁRIO */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 h-fit sticky top-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Publicar Novo Aviso</h2>
          <form onSubmit={handlePublicar} className="space-y-4">
            <input type="text" placeholder="Título do aviso" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none" required />
            <textarea placeholder="Detalhes do aviso..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none resize-none" required />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Início</label>
                <input 
                  type="datetime-local" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Vazio = Agora</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Expiração</label>
                <input 
                  type="datetime-local" 
                  value={dataFim} 
                  onChange={(e) => setDataFim(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Vazio = Eterno</p>
              </div>
            </div>

            <button type="submit" disabled={enviando} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 cursor-pointer">
              {enviando ? 'Publicando...' : '📢 Publicar Aviso'}
            </button>
          </form>
        </div>

        {/* LISTAGEM COM ABAS */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 min-h-[400px] flex flex-col">
          
          {/* ABAS */}
          <div className="flex border-b border-gray-200 mb-4 gap-4">
            <button 
              onClick={() => setAbaAtiva('ativos')}
              className={`pb-3 text-sm font-semibold transition cursor-pointer ${abaAtiva === 'ativos' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Ao Vivo ({avisosAtivos.length})
            </button>
            <button 
              onClick={() => setAbaAtiva('historico')}
              className={`pb-3 text-sm font-semibold transition cursor-pointer ${abaAtiva === 'historico' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Histórico ({avisosHistorico.length})
            </button>
          </div>

          {loading ? <p className="text-gray-400 text-center py-10">Carregando...</p> : 
          
          abaAtiva === 'ativos' ? (
            avisosAtivos.length === 0 ? <p className="text-gray-400 text-center py-10">Nenhum aviso ao vivo.</p> : (
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
                {avisosAtivos.map((aviso) => (
                  <div key={aviso.id} className="p-4 border border-green-200 bg-green-50/50 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{aviso.titulo}</h3>
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-200 text-green-800">VISÍVEL</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{aviso.mensagem}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span>📅 Início: {formatarData(aviso.data_inicio)}</span>
                      {aviso.data_fim ? <span>⏳ Expira: {formatarData(aviso.data_fim)}</span> : <span className="text-green-600 font-medium">∞ Sem expiração</span>}
                    </div>
                    
                    <div className="flex gap-2 mt-3 border-t border-green-100 pt-3">
                      <button onClick={() => toggleForcarInativo(aviso)} className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition cursor-pointer">🚫 Desativar</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            avisosHistorico.length === 0 ? <p className="text-gray-400 text-center py-10">Histórico vazio.</p> : (
              <div className="space-y-4 flex-1 overflow-y-auto max-h-[60vh]">
                {avisosHistorico.map((aviso) => (
                  <div key={aviso.id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-700 truncate">{aviso.titulo}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-200 text-gray-600">INATIVO</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{aviso.mensagem}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                      <span>🛑 Expirou em: {aviso.data_fim ? formatarData(aviso.data_fim) : 'Desativado manualmente'}</span>
                    </div>
                    
                    {/* MODAL DE REATIVAÇÃO */}
                    {reativandoId === aviso.id ? (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-bold text-blue-700 mb-2">Defina a nova data de expiração:</p>
                        <div className="flex gap-2">
                          <input 
                            type="datetime-local" 
                            value={novaDataFim} 
                            onChange={(e) => setNovaDataFim(e.target.value)} 
                            className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm outline-none"
                          />
                          <button onClick={handleReativar} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 cursor-pointer">Salvar</button>
                          <button onClick={() => setReativandoId(null)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs font-bold hover:bg-gray-300 cursor-pointer">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-3 border-t border-gray-200 pt-3">
                        <button onClick={() => setReativandoId(aviso.id)} className="text-xs font-medium px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition cursor-pointer">🔄 Reativar Agora</button>
                        <button onClick={() => deletarAviso(aviso.id)} className="text-xs font-medium px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition cursor-pointer">Excluir Definitivamente</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default AdmBVPage