import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import * as Linking from 'expo-linking'

import { SplashScreenController } from '@/components/splash-screen-controller'

import { useAuthContext } from '@/hooks/use-auth-context'
import { useColorScheme } from '@/hooks/use-color-scheme'
import AuthProvider from '@/providers/auth-provider'
import { supabase } from '@/lib/supabase'

// Separate RootNavigator so we can access the AuthContext
function RootNavigator() {
    const { isLoggedIn, needsPasswordReset, setNeedsPasswordReset } = useAuthContext()
    const router = useRouter()

    useEffect(() => {
        async function handleUrl(url: string) {
            // PKCE flow: Supabase redirects with ?code=xxx
            const parsed = Linking.parse(url)
            const code = parsed.queryParams?.code as string | undefined
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) console.error('[handleUrl] exchangeCodeForSession error:', error)
                return
            }

            // Implicit flow: Supabase redirects with #access_token=...&type=recovery
            const hashIndex = url.indexOf('#')
            if (hashIndex !== -1) {
                const params = Object.fromEntries(new URLSearchParams(url.slice(hashIndex + 1)))
                if (params.access_token && params.refresh_token && params.type === 'recovery') {
                    setNeedsPasswordReset(true)
                    await supabase.auth.setSession({
                        access_token: params.access_token,
                        refresh_token: params.refresh_token,
                    })
                }
            }
        }

        Linking.getInitialURL().then((url) => { if (url) handleUrl(url) })
        const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))
        return () => subscription.remove()
    }, [])

  // Navigate to reset password screen when PASSWORD_RECOVERY event fires
  useEffect(() => {
        if (needsPasswordReset) {
            router.replace('/(auth)/resetPassword' as any)
        }
  }, [needsPasswordReset])

  return (
        <Stack>
            <Stack.Protected guard={isLoggedIn && !needsPasswordReset}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={!isLoggedIn || needsPasswordReset}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={isLoggedIn && !needsPasswordReset}>
                <Stack.Screen name="(misc)" options={{ headerShown: false }} />
            </Stack.Protected>
            {/* <Stack.Screen name="+not-found" /> */}
        </Stack>
  )
}

export default function RootLayout() {
    const colorScheme = useColorScheme()

    useEffect(() => {
        Notifications.requestPermissionsAsync();
    }, [])

  return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
                <SplashScreenController />
                <RootNavigator />
                <StatusBar style="auto" />
            </AuthProvider>
        </ThemeProvider>
    )
}