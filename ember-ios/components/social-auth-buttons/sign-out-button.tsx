import { supabase } from '@/lib/supabase'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Sign out from the Supabase session.
async function onSignOutButtonPress() {
    const { error } = await supabase.auth.signOut()
    if (error) {
        console.error('Error signing out:', error)
    }
}

export default function SignOutButton() {
    return (
        <TouchableOpacity onPress={onSignOutButtonPress} style={{ alignItems: 'center' }}>
            <Ionicons name="log-out-outline" size={32} color="#ef4444" />
        </TouchableOpacity>
    )
}
