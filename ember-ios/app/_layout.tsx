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
  const { isLoggedIn, needsPasswordReset } = useAuthContext()
  const router = useRouter()

  // Handle deep link when user clicks the password reset email link.
  // Supabase v2 uses PKCE by default: the reset link redirects back with ?code=xxx
  useEffect(() => {
    async function handleUrl(url: string) {
      const parsed = Linking.parse(url)
      const code = parsed.queryParams?.code as string | undefined
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
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