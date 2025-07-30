import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 客户端实例
export const supabase = createClient()

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      keyword_searches: {
        Row: {
          id: string
          user_id: string
          search_type: 'competitor' | 'trending'
          query: string
          results: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          search_type: 'competitor' | 'trending'
          query: string
          results: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          search_type?: 'competitor' | 'trending'
          query?: string
          results?: any
          created_at?: string
        }
      }
    }
  }
}

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error: unknown) {
    return { 
      data: { user: null, session: null }, 
      error: error as AuthError 
    }
  }
}

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error: unknown) {
    return { 
      data: { user: null, session: null }, 
      error: error as AuthError 
    }
  }
}

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error: unknown) {
    return { error: error as AuthError }
  }
}
