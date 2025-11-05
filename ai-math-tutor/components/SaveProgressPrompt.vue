<template>
  <UModal v-if="shouldShow" v-model="shouldShow" :ui="{ width: 'max-w-md' }">
    <UCard class="bg-black/90 border border-pink-500/20">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/50">
            <UIcon name="i-lucide-save" class="size-5 text-white" />
          </div>
          <div>
            <h3 class="text-xl font-bold text-white">💾 Save Your Progress!</h3>
            <p class="text-xs text-gray-400">Don't lose your learning journey</p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-300 leading-relaxed">
          {{ message || 'Sign up to keep your XP, mastery, and chat history permanently. Your progress is saved across all devices!' }}
        </p>

        <div class="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4 space-y-2">
          <div class="flex items-center gap-2 text-sm text-pink-300">
            <UIcon name="i-lucide-check-circle" class="size-4" />
            <span>Keep your XP and level progress</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-pink-300">
            <UIcon name="i-lucide-check-circle" class="size-4" />
            <span>Save your chat history</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-pink-300">
            <UIcon name="i-lucide-check-circle" class="size-4" />
            <span>Track your mastery across topics</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <UButton
            color="gray"
            variant="ghost"
            @click="handleMaybeLater"
          >
            Maybe Later
          </UButton>
          <UButton
            color="pink"
            class="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
            @click="handleSignUp"
          >
            Sign Up Now
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  message?: string
  promptKey?: string // Unique key for this prompt type
}>()

const emit = defineEmits<{
  'sign-up': []
}>()

const { isAuthenticated } = useAuth()

const shouldShow = ref(false)
const promptKey = computed(() => props.promptKey || 'default')

// Check if prompt should be shown
onMounted(() => {
  if (isAuthenticated.value) {
    shouldShow.value = false
    return
  }

  // Check localStorage for dismissal
  const dismissedUntil = localStorage.getItem(`save-progress-prompt-${promptKey.value}`)
  
  if (dismissedUntil) {
    const dismissedTime = parseInt(dismissedUntil)
    const now = Date.now()
    
    // Show again after 24 hours
    if (now < dismissedTime) {
      shouldShow.value = false
      return
    }
  }

  // Small delay to let page load smoothly
  setTimeout(() => {
    shouldShow.value = true
  }, 1000)
})

const handleSignUp = () => {
  emit('sign-up')
  shouldShow.value = false
}

const handleMaybeLater = () => {
  // Dismiss for 24 hours
  const dismissUntil = Date.now() + (24 * 60 * 60 * 1000)
  localStorage.setItem(`save-progress-prompt-${promptKey.value}`, dismissUntil.toString())
  shouldShow.value = false
}

// Hide if user becomes authenticated
watch(isAuthenticated, (newVal) => {
  if (newVal) {
    shouldShow.value = false
  }
})
</script>

