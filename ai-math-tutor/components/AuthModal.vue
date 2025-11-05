<template>
  <UModal 
    v-model:open="isOpen" 
    :title="emailSent ? '📧 Check Your Email' : 'Sign In / Sign Up'"
    :ui="{
      content: 'bg-black border border-pink-500/20 shadow-lg shadow-pink-500/20',
      header: 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-pink-500/20',
      body: 'bg-black',
      footer: 'bg-black border-t border-pink-500/20',
      title: 'text-white font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent'
    }"
  >
    <!-- Email sent confirmation -->
    <template v-if="emailSent" #body>
      <div class="space-y-4 text-center py-6">
        <div class="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-pink-500/30">
          <UIcon name="i-lucide-mail-check" class="size-8 text-pink-400" />
        </div>
        <div>
          <p class="text-lg font-semibold text-white mb-2">Magic link sent! ✨</p>
          <p class="text-sm text-gray-300 mb-4">
            We've sent a magic link to <span class="text-pink-400 font-medium">{{ email }}</span>
          </p>
          <p class="text-xs text-gray-400">
            Click the link in your email to sign in and save your progress. You can close this window.
          </p>
        </div>
      </div>
    </template>

    <template v-if="emailSent" #footer>
      <UButton
        color="gray"
        variant="ghost"
        class="w-full"
        @click="resetForm"
      >
        Use a different email
      </UButton>
    </template>

    <!-- Email input form -->
    <template v-else #body>
      <div class="space-y-4 py-4">
        <div class="text-center mb-4">
          <p class="text-sm text-gray-300">
            {{ hasAnonymousData ? 'Your current progress will be saved to your account' : 'Sign in to your account or create a new one with just your email' }}
          </p>
          <p class="text-xs text-gray-400 mt-2">
            New to Eqara? No problem - same process! We'll create your account automatically.
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="your.email@example.com"
              class="w-full px-4 py-3 bg-black/80 border border-pink-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <UIcon name="i-lucide-alert-circle" class="size-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p class="text-sm text-red-300">{{ error }}</p>
            </div>
          </div>

          <UButton
            type="submit"
            color="pink"
            size="lg"
            :loading="loading"
            :disabled="loading || !email"
            class="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
          >
            <template #leading>
              <UIcon name="i-lucide-sparkles" />
            </template>
            Send Magic Link
          </UButton>
        </form>

        <div class="text-center">
          <p class="text-xs text-gray-400">
            No password required • We'll send you a secure magic link to access your account
          </p>
        </div>

        <!-- Info about what gets saved -->
        <div v-if="hasAnonymousData" class="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-4 mt-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-info" class="size-5 text-pink-400 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-pink-200">
              <p class="font-medium mb-1">What gets saved:</p>
              <ul class="list-disc list-inside space-y-1 text-xs text-pink-200/80">
                <li>Your XP, level, and streak</li>
                <li>Chat history and progress</li>
                <li>Topic mastery and achievements</li>
                <li>Diagnostic and quiz results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  hasAnonymousData?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { sendMagicLink } = useAuth()
const toast = useToast()

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const emailSent = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

const handleSubmit = async () => {
  if (!email.value) return

  try {
    loading.value = true
    error.value = null

    await sendMagicLink(email.value)

    emailSent.value = true
    
    toast.add({
      title: 'Magic link sent! ✨',
      description: 'Check your email to complete sign in',
      color: 'success',
      icon: 'i-lucide-mail'
    })
  } catch (err: any) {
    console.error('Failed to send magic link:', err)
    error.value = err.message || 'Failed to send magic link. Please try again.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  emailSent.value = false
  email.value = ''
  error.value = null
}

// Reset form when modal closes
watch(isOpen, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      resetForm()
    }, 300) // Wait for modal close animation
  }
})
</script>

