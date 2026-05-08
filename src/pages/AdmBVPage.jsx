import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MASTER_USER_ID = 'aaddc383-2f72-45ff-bb01-cec19c695a86'

const AdmBVPage = () => {
  const { user, perfil, logout } = useAuth()
  const navigate = useNavigate()
  
  const isMasterDev = user?.id === MASTER_USER_ID // Identifica se é você (Dev)
  
  const [avisos, setAvisos] = useState([])
  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => { buscarAvisos() }, [])

  const buscarAvisos = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('avisos_admin').select('*').order('created_at', { ascending: false })
    if (!error) setAvisos(data || [])
    setLoading(false)
  }

  const handlePublicar = async (e) => {
    e.preventDefault()
    if (!titulo.trim() || !mensagem.trim()) return alert('Preencha título e mensagem.')
    setEnviando(true)
    const { error } = await supabase.from('avisos_admin').insert({ titulo, mensagem, criado_por: user.id })
    if (error) alert('Erro: ' + error.message)
    else { setTitulo(''); setMensagem(''); buscarAvisos() }
    setEnviando(false)
  }

  const toggleAtivo = async (aviso) => {
    await supabase.from('avisos_admin').update({ ativo: !aviso.ativo }).eq('id', aviso.id)
    buscarAvisos()
  }

  const deletarAviso = async (id) => {
    if (!window.confirm('Excluir aviso?')) return
    await supabase.from('avisos_admin').delete().eq('id', id)
    buscarAvisos()
  }

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }) }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto mb-8">
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
        
        {/* AVISO DE DIFERENCIAÇÃO DE PERFIL */}
        {isMasterDev && (
          <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm">
            ⚠️ <strong>Modo Desenvolvedor:</strong> Você está acessando como Master. Em produção, apenas o perfil de Administração do Condomínio terá acesso a este local.
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 h-fit sticky top-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Publicar Novo Aviso</h2>
          <form onSubmit={handlePublicar} className="space-y-4">
            <input type="text" placeholder="Título do aviso" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none" />
            <textarea placeholder="Detalhes do aviso..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none resize-none" />
            <button type="submit" disabled={enviando} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-50 cursor-pointer">
              {enviando ? 'Publicando...' : '📢 Publicar Aviso'}
            </button>
          </form>
        </div>

        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Avisos Cadastrados</h2>
          {loading ? <p className="text-gray-400 text-center py-10">Carregando...</p> : avisos.length === 0 ? <p className="text-gray-400 text-center py-10">Nenhum aviso.</p> : (
            <div className="space-y-4">
              {avisos.map((aviso) => (
                <div key={aviso.id} className={`p-4 border rounded-xl transition ${aviso.ativo ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{aviso.titulo || 'Sem título'}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${aviso.ativo ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{aviso.ativo ? 'VISÍVEL' : 'OCULTO'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{aviso.mensagem}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(aviso.created_at).toLocaleString('pt-BR')}</p>
                  <div className="flex gap-2 mt-3 border-t pt-3">
                    <button onClick={() => toggleAtivo(aviso)} className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition cursor-pointer">{aviso.ativo ? 'Desativar' : 'Ativar'}</button>
                    <button onClick={() => deletarAviso(aviso.id)} className="text-xs font-medium px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition cursor-pointer">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdmBVPage