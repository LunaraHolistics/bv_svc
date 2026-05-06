// src/lib/auth.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) buscarPerfil(session.user.id)
      else setPerfil(null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) buscarPerfil(session.user.id)
      else setPerfil(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const buscarPerfil = async (userId) => {
    try {
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single()
      setPerfil(data)
    } catch {
      setPerfil(null)
    }
  }

  const cadastrar = async (email, senha, nomeCompleto) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: senha,
      options: {
        data: { nome_completo: nomeCompleto.trim() },
      },
    })
    if (error) throw error
    return data
  }

  const login = async (email, senha) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: senha,
    })
    if (error) throw error
    return data
  }

  const recuperarSenha = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      perfil,
      loading,
      cadastrar,
      login,
      recuperarSenha,
      logout,
      recarregarPerfil: () => user && buscarPerfil(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}