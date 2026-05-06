// src/lib/auth.jsx
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Busca perfil do usuário
   * Corrigido:
   * - troca single() por maybeSingle()
   * - trata erro sem quebrar fluxo
   */
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
        console.error('Erro ao buscar perfil:', error)
        setPerfil(null)
        return null
      }

      setPerfil(data || null)
      return data
    } catch (err) {
      console.error('Erro inesperado ao buscar perfil:', err)
      setPerfil(null)
      return null
    }
  }, [])

  /**
   * Sessão inicial
   */
  useEffect(() => {
    let mounted = true

    const carregarSessao = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await buscarPerfil(currentUser.id)
        } else {
          setPerfil(null)
        }
      } catch (err) {
        console.error('Erro ao carregar sessão:', err)
        setUser(null)
        setPerfil(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    carregarSessao()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null

        setUser(currentUser)

        if (currentUser) {
          await buscarPerfil(currentUser.id)
        } else {
          setPerfil(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [buscarPerfil])

  /**
   * Cadastro
   */
  const cadastrar = async (
    email,
    senha,
    nomeCompleto
  ) => {
    const { data, error } =
      await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: senha,
        options: {
          data: {
            nome_completo:
              nomeCompleto.trim()
          }
        }
      })

    if (error) throw error

    return data
  }

  /**
   * Login
   */
  const login = async (email, senha) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: senha
      })

    if (error) throw error

    return data
  }

  /**
   * Recuperação de senha
   */
  const recuperarSenha = async (email) => {
    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: window.location.origin
        }
      )

    if (error) throw error
  }

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setPerfil(null)
    } catch (err) {
      console.error('Erro ao sair:', err)
    }
  }

  /**
   * Recarregar perfil manualmente
   */
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