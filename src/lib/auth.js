// src/lib/auth.js
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

  const loginMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
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
      loginMagicLink,
      logout,
      recarregarPerfil: () => user && buscarPerfil(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}