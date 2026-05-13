import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// ✅ CENTRALIZANDO OS ADMs AQUI:
const ADMIN_IDS = [
  'aaddc383-2f72-45ff-bb01-cec19c695a86',
  '84f7670e-b3a6-4986-8cc1-f8e798374a34',
  'cf009181-37e3-47ae-9144-021c29c58168'
  // Quando o síndico se cadastrar, é só adicionar o ID aqui dentro desse array!
]

// Função universal para saber se é ADM
const isAdm = (userId) => userId && ADMIN_IDS.includes(userId)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  const buscarPerfil = useCallback(async (userId) => {
    if (!userId) {
      setPerfil(null)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('[Auth] Erro buscar perfil:', error.message)
      }

      setPerfil(data || null)
      return data
    } catch (err) {
      console.error('[Auth] Falha buscar perfil:', err)
      setPerfil(null)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser?.id) {
          buscarPerfil(currentUser.id)
        } else {
          setPerfil(null)
        }
      } catch (err) {
        console.warn('[Auth] getSession falhou:', err.message)
        setUser(null)
        setPerfil(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser?.id) {
          buscarPerfil(currentUser.id)
        } else {
          setPerfil(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [buscarPerfil])

  const cadastrar = async (email, senha, nomeCompleto) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: senha,
      options: {
        data: { nome_completo: nomeCompleto.trim() }
      }
    })

    if (error) throw error
    return data
  }

  const login = async (email, senha) => {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: senha
    })

    if (error) throw error

    // ✅ FORÇA A ATUALIZAÇÃO AQUI PARA SUMIR O LOADING
    if (data.user) {
      setUser(data.user)
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('id, nome_completo, whatsapp, avatar_url, tipo_pessoa')
        .eq('id', data.user.id)
        .single()
      
      if (perfilData) {
        setPerfil(perfilData)
      }
    }

    return data
  }

  const recuperarSenha = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    )

    if (error) throw error
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[Auth] Erro sair:', err)
    } finally {
      setUser(null)
      setPerfil(null)
    }
  }

  const recarregarPerfil = async () => {
    if (!user?.id) return null
    return await buscarPerfil(user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        loading,
        isAdm,
        cadastrar,
        login,
        recuperarSenha,
        logout,
        recarregarPerfil
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}