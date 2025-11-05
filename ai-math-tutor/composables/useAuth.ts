import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'

const user = ref<User | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Flag to track if migration has been triggered for this session
let migrationTriggered = false

export const useAuth = () => {
  const supabase = useSupabase()

  // Computed state
  const isAuthenticated = computed(() => !!user.value)

  // Initialize auth state
  const initAuth = async () => {
    try {
      isLoading.value = true
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser
    } catch (err: any) {
      console.error('Failed to initialize auth:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  // Send magic link to email
  const sendMagicLink = async (email: string): Promise<void> => {
    try {
      error.value = null
      isLoading.value = true

      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (authError) throw authError
    } catch (err: any) {
      console.error('Failed to send magic link:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      error.value = null
      isLoading.value = true

      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError

      user.value = null
      migrationTriggered = false
    } catch (err: any) {
      console.error('Failed to sign out:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Migrate anonymous data to authenticated user
  const migrateAnonymousData = async (sessionId: string, userId: string): Promise<void> => {
    try {
      error.value = null

      const response = await $fetch('/api/auth/migrate', {
        method: 'POST',
        body: { sessionId, userId }
      })

      console.log('Data migration complete:', response)
    } catch (err: any) {
      console.error('Failed to migrate data:', err)
      error.value = err.message
      throw err
    }
  }

  // Set up auth state change listener
  const setupAuthListener = () => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)

      user.value = session?.user ?? null

      // Trigger migration on first sign-in
      if (event === 'SIGNED_IN' && session?.user && !migrationTriggered) {
        migrationTriggered = true

        // Get session ID from localStorage
        const sessionId = localStorage.getItem('chat_session_id')

        if (sessionId && session.user.id) {
          try {
            console.log('Triggering data migration...')
            await migrateAnonymousData(sessionId, session.user.id)
            
            // Show success toast
            const toast = useToast()
            toast.add({
              title: 'Welcome back! 🎉',
              description: 'Your progress has been saved to your account',
              color: 'success',
              icon: 'i-lucide-check-circle'
            })
          } catch (err) {
            console.error('Migration failed:', err)
            // Don't block user if migration fails
            const toast = useToast()
            toast.add({
              title: 'Signed in successfully',
              description: 'Welcome back!',
              color: 'success',
              icon: 'i-lucide-check-circle'
            })
          }
        }
      }

      // Reset migration flag on sign out
      if (event === 'SIGNED_OUT') {
        migrationTriggered = false
      }
    })
  }

  // Initialize on first call
  if (process.client && isLoading.value) {
    initAuth()
    setupAuthListener()
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    sendMagicLink,
    signOut,
    migrateAnonymousData
  }
}

