import { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthData = {
    session?: Session | null
    profile?: any | null
    isLoading: boolean
    isLoggedIn: boolean
    needsPasswordReset: boolean
    setNeedsPasswordReset: (value: boolean) => void
}

export const AuthContext = createContext<AuthData>({
    session: undefined,
    profile: undefined,
    isLoading: true,
    isLoggedIn: false,
    needsPasswordReset: false,
    setNeedsPasswordReset: () => {},
})

export const useAuthContext = () => useContext(AuthContext)