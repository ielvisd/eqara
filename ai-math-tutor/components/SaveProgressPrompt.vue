<template>
  <div
    v-if="shouldShow"
    class="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-lg p-4 mb-4"
  >
    <div class="flex items-start gap-3">
      <div class="bg-pink-500/20 p-2 rounded-lg flex-shrink-0">
        <UIcon name="i-lucide-save" class="size-5 text-pink-400" />
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold text-pink-300 mb-1">
          💾 Save Your Progress!
        </h4>
        <p class="text-xs text-pink-200/80 mb-3">
          {{ message || 'Sign up to keep your XP, mastery, and chat history permanently' }}
        </p>
        <div class="flex items-center gap-2">
          <UButton
            size="sm"
            color="pink"
            @click="handleSignUp"
          >
            Sign Up Now
          </UButton>
          <UButton
            size="sm"
            color="gray"
            variant="ghost"
            @click="handleMaybeLater"
          >
            Maybe Later
          </UButton>
        </div>
      </div>
      <UButton
        icon="i-lucide-x"
        color="gray"
        variant="ghost"
        size="xs"
        @click="handleDismiss"
      />
    </div>
  </div>
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

  shouldShow.value = true
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

const handleDismiss = () => {
  // Dismiss for 7 days (less aggressive)
  const dismissUntil = Date.now() + (7 * 24 * 60 * 60 * 1000)
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

