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
        setPerfil(null)
        return null
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

    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] getSession lento — liberando sem sessão')
        setLoading(false)
      }
    }, 3000)

    const init = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) {
          console.error('[Auth] getSession erro:', error.message)
        }

        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser?.id) {
          await buscarPerfil(currentUser.id)
        } else {
          setPerfil(null)
        }
      } catch (err) {
        console.error('[Auth] Falha sessão:', err)
        setUser(null)
        setPerfil(null)
      } finally {
        if (mounted) {
          clearTimeout(timeout)
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
          await buscarPerfil(currentUser.id)
        } else {
          setPerfil(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: senha
    })

    if (error) throw error
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
      setUser(null)
      setPerfil(null)
    } catch (err) {
      console.error('[Auth] Erro sair:', err)
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