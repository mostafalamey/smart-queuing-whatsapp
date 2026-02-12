'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  userProfile: any | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const isInitialized = useRef(false)
  const lastUserId = useRef<string | null>(null)

  useEffect(() => {
    // Prevent double initialization
    if (isInitialized.current) return
    isInitialized.current = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        lastUserId.current = session.user.id
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes with Edge-specific handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore redundant events (fixes Edge re-auth issue)
      if (event === 'TOKEN_REFRESHED' && session?.user?.id === lastUserId.current) {
        return
      }

      setUser(session?.user ?? null)
      if (session?.user) {
        lastUserId.current = session.user.id
        await fetchUserProfile(session.user.id)
      } else {
        lastUserId.current = null
        setUserProfile(null)
      }
      setLoading(false)
    })

    // Handle visibility changes for Edge browser
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && lastUserId.current) {
        // Don't trigger full re-auth, just verify session silently
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session && lastUserId.current) {
            // Only update if session is actually gone
            setUser(null)
            setUserProfile(null)
            lastUserId.current = null
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('members')
        .select('*, organizations(*)')
        .eq('auth_user_id', userId)
        .single()
      
      setUserProfile(data)
    } catch (error) {
      // Debug log removed
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
