<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
    <div class="text-center space-y-6">
      <div v-if="isLoading" class="space-y-4">
        <UIcon name="i-lucide-loader-2" class="size-12 text-pink-400 animate-spin mx-auto" />
        <h2 class="text-2xl font-bold text-white">Signing you in...</h2>
        <p class="text-gray-400">Please wait while we verify your magic link</p>
      </div>

      <div v-else-if="error" class="space-y-4">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-red-400 mx-auto" />
        <h2 class="text-2xl font-bold text-white">Sign In Failed</h2>
        <p class="text-gray-400">{{ error }}</p>
        <NuxtLink to="/">
          <UButton size="lg" color="pink">
            Return to Home
          </UButton>
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <UIcon name="i-lucide-check-circle" class="size-12 text-green-400 mx-auto" />
        <h2 class="text-2xl font-bold text-white">Success!</h2>
        <p class="text-gray-400">Redirecting you now...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase()
const router = useRouter()
const route = useRoute()

const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    // Extract the token hash from the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      // Set the session with the tokens from the magic link
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (sessionError) {
        throw sessionError
      }

      // Wait a moment for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to home
      router.push('/')
    } else {
      // Check if there's an error in the URL
      const errorDescription = hashParams.get('error_description') || route.query.error_description as string
      if (errorDescription) {
        throw new Error(errorDescription)
      }

      throw new Error('No authentication tokens found in the URL')
    }
  } catch (err: any) {
    console.error('Auth callback error:', err)
    error.value = err.message || 'An unexpected error occurred'
    isLoading.value = false
  }
})
</script>

