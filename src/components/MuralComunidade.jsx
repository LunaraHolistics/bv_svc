import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MuralComunidade = () => {
  const { user, perfil } = useAuth()
  const navigate = useNavigate()

  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [respostasAbertas, setRespostasAbertas] = useState([])
  const [respostaTexto, setRespostaTexto] = useState('')
  const [loadingPublicar, setLoadingPublicar] = useState(false)
  const [loadingResposta, setLoadingResposta] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)

  // Carrega os posts ao abrir a página
  useEffect(() => {
    buscarPosts()
  }, [])

  const buscarPosts = async () => {
    setLoadingDados(true)
    try {
      const { data, error } = await supabase
        .from('mural_posts')
        .select(`
          *,
          usuario:perfis(nome_completo, avatar_url),
          respostas:mural_respostas(
            id,
            conteudo,
            created_at,
            usuario:perfis(nome_completo, avatar_url)
          )
        `)
        .is('resolvido', false)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error

      setPosts(data || [])
    } catch (err) {
      console.error('Erro ao buscar mural:', err)
    } finally {
      setLoadingDados(false)
    }
  }

  // Publicar novo post
  const handlePublicar = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }

    const textoLimpo = novoPost.trim()
    if (!textoLimpo) return

    setLoadingPublicar(true)
    try {
      const { error } = await supabase
        .from('mural_posts')
        .insert({ usuario_id: user.id, conteudo: textoLimpo })
        .single()

      if (error) throw error

      setNovoPost('')
      buscarPosts() // Atualiza a lista
    } catch (err) {
      alert('Erro ao publicar: ' + err.message)
    } finally {
      setLoadingPublicar(false)
    }
  }

  // Responder um post
  const handleResponder = async (postId) => {
    const textoLimpo = respostaTexto.trim()
    if (!textoLimpo) return

    setLoadingResposta(true)
    try {
      const { error } = await supabase
        .from('mural_respostas')
        .insert({ post_id: postId, usuario_id: user.id, conteudo: textoLimpo })
        .single()

      if (error) throw error

      setRespostaTexto('')
      setRespostasAbertas(prev => prev.filter(id => id !== postId))
      buscarPosts()
    } catch (err) {
      alert('Erro ao responder: ' + err.message)
    } finally {
      setLoadingResposta(false)
    }
  }

  // Marcar como resolvido
  const handleResolver = async (postId) => {
    if (!window.confirm('Marcar como resolvido? Isso esconderá o post do mural.')) return

    try {
      const { error } = await supabase
        .from('mural_posts')
        .update({ resolvido: true })
        .eq('id', postId)

      if (error) throw error
      buscarPosts()
    } catch (err) {
      alert('Erro ao atualizar: ' + err.message)
    }
  }

  // Função auxiliar para pegar inicial do nome
  const getInicial = (perfilData) => {
    if (perfilData?.nome_completo) return perfilData.nome_completo.charAt(0).toUpperCase()
    if (perfilData?.avatar_url) return null
    return '🧑'
  }

  // Se não estiver logado, mostra botão para logar
  if (!user) {
    return (
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-6 sm:p-8 text-center">
        <div className="text-4xl mb-3">💬</div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Mural da Comunidade</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          Precisa de um profissional ou quer fazer uma pergunta para os vizinhos? Faça login para usar o mural.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-5 px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition cursor-pointer text-sm"
        >
          Fazer Login
        </button>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-5 sm:p-8">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            💬 Mural da Comunidade
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Pergunte, ofereça ou encontre o que precisa aqui.</p>
        </div>
      </div>

      {/* FORMULÁRIO DE NOVO POST */}
      <form onSubmit={handlePublicar} className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={novoPost}
            onChange={(e) => setNovoPost(e.target.value)}
            placeholder="Ex: Alguém sabe de um eletricista disponível esta semana?"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            maxLength={300}
            required
          />
          <button
            type="submit"
            disabled={loadingPublicar || !novoPost.trim()}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer text-sm whitespace-nowrap shrink-0"
          >
            {loadingPublicar ? 'Postando...' : 'Perguntar'}
          </button>
        </div>
      </form>

      {/* LISTA DE POSTS */}
      {loadingDados ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🌟</div>
          <p className="text-sm text-gray-500">Nenhuma pergunta ainda. Seja o primeiro a perguntar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100 transition-all">
              {/* CABEÇALHO DO POST */}
              <div className="flex items-start gap-3 mb-3">
                {post.usuario?.avatar_url ? (
                  <img src={post.usuario.avatar_url} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
                    {getInicial(post.usuario)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                    {post.usuario?.nome_completo || 'Morador'} • {new Date(post.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line break-words">
                    {post.conteudo}
                  </p>
                </div>
              </div>

              {/* AÇÕES E RESPOSTAS */}
              <div className="ml-0 sm:ml-13 pl-0 sm:pl-4 border-l-2 border-gray-200 space-y-3">
                {post.respostas?.map((resposta) => (
                  <div key={resposta.id} className="flex items-start gap-2 sm:gap-3">
                    {resposta.usuario?.avatar_url ? (
                      <img src={resposta.usuario.avatar_url} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold shrink-0 mt-0.5">
                        R
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        {resposta.usuario?.nome_completo || 'Morador'} respondeu
                      </p>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
                        {resposta.conteudo}
                      </p>
                    </div>
                  </div>
                ))}

                {/* FORMULÁRIO DE RESPOSTA */}
                {respostasAbertas.includes(post.id) ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleResponder(post.id) }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={respostaTexto}
                      onChange={(e) => setRespostaTexto(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      className="flex-1 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      maxLength={500}
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loadingResposta}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                      >
                        {loadingResposta ? '...' : 'Enviar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRespostasAbertas(prev => prev.filter(id => id !== post.id))
                          setRespostaTexto('')
                        }}
                        className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs cursor-pointer hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setRespostasAbertas(prev => [...prev, post.id])
                    }}
                    className="text-xs sm:text-sm text-emerald-600 font-medium hover:text-emerald-700 cursor-pointer"
                  >
                    💬 Responder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default MuralComunidade