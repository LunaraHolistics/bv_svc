import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MASTER_USER_ID = 'COLE_SEU_USER_ID_AQUI'

const PainelAdminPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [abaAtiva, setAbaAtiva] = useState('servicos')
  
  const [servicos, setServicos] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [indicacoes, setIndicacoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id !== MASTER_USER_ID) return
    buscarDados()
  }, [abaAtiva])

  const buscarDados = async () => {
    setLoading(true)
    try {
      if (abaAtiva === 'servicos') {
        const { data } = await supabase.from('prestadores_servico').select('*').order('nome')
        setServicos(data || [])
      } else if (abaAtiva === 'anuncios') {
        const { data } = await supabase.from('anuncios_vendas').select('*').order('created_at', { ascending: false })
        setAnuncios(data || [])
      } else if (abaAtiva === 'indicacoes') {
        const { data } = await supabase.from('indicacoes').select('*').order('created_at', { ascending: false })
        setIndicacoes(data || [])
      }
    } catch (error) {
      console.error(error)
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
      buscarDados()
    }
  }

  const deletarAnuncio = async (id) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR este anúncio?')) return
    const { error } = await supabase.from('anuncios_vendas').delete().eq('id', id)
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      buscarDados()
    }
  }

  const deletarIndicacao = async (id) => {
    if (!window.confirm('Tem certeza que deseja EXCLUIR esta indicação?')) return
    const { error } = await supabase.from('indicacoes').delete().eq('id', id)
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      buscarDados()
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between bg-red-600 text-white p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">🛡️ Painel Master Admin</h1>
            <p className="text-red-100 text-sm mt-1">Acesso total ao sistema. Logado como: {user?.email}</p>
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
          ) : abaAtiva === 'servicos' ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Gerenciar Prestadores de Serviço</h2>
              {servicos.length === 0 ? <p className="text-gray-500">Nenhum serviço.</p> : (
                <div className="space-y-3">
                  {servicos.map((ser) => (
                    <div key={ser.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{ser.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{ser.categoria || 'Sem categoria'} • ID: {ser.usuario_id?.substring(0,8)}...</p>
                      </div>
                      <button onClick={() => deletarServico(ser.id)} className="ml-4 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition cursor-pointer">EXCLUIR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : abaAtiva === 'anuncios' ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Gerenciar Anúncios</h2>
              {anuncios.length === 0 ? <p className="text-gray-500">Nenhum anúncio.</p> : (
                <div className="space-y-3">
                  {anuncios.map((anun) => (
                    <div key={anun.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{anun.titulo}</p>
                        <p className="text-xs text-gray-500 truncate">{anun.status || 'Ativo'} • ID: {anun.usuario_id?.substring(0,8)}...</p>
                      </div>
                      <button onClick={() => deletarAnuncio(anun.id)} className="ml-4 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition cursor-pointer">EXCLUIR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : abaAtiva === 'indicacoes' ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Gerenciar Indicações</h2>
              {indicacoes.length === 0 ? <p className="text-gray-500">Nenhuma indicação.</p> : (
                <div className="space-y-3">
                  {indicacoes.map((ind) => (
                    <div key={ind.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{ind.nome_profissional}</p>
                        <p className="text-xs text-gray-500 truncate">{ind.categoria || 'Sem categoria'} • ID: {ind.usuario_id?.substring(0,8)}...</p>
                      </div>
                      <button onClick={() => deletarIndicacao(ind.id)} className="ml-4 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition cursor-pointer">EXCLUIR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default PainelAdminPage