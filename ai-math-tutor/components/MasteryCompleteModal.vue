<template>
  <UModal v-model="isOpen" :ui="{ width: 'max-w-2xl' }">
    <UCard>
      <div class="text-center space-y-6 py-8">
        <!-- Celebration Animation -->
        <div class="relative">
          <div class="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50 animate-bounce">
            <UIcon name="i-lucide-trophy" class="size-16 text-white" />
          </div>
          <!-- Confetti effect (visual only) -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-6xl animate-ping opacity-75">🎉</div>
          </div>
        </div>

        <!-- Title & Message -->
        <div>
          <h2 class="text-4xl font-bold text-white mb-3">
            🎉 {{ topic?.title || 'Topic' }} Mastered!
          </h2>
          <p class="text-xl text-gray-300">100% Mastery Achieved</p>
        </div>

        <!-- XP Reward -->
        <div class="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-6 inline-block">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-sparkles" class="size-8 text-pink-400" />
            <div class="text-left">
              <p class="text-sm text-gray-400">XP Earned</p>
              <p class="text-3xl font-bold text-pink-400">+{{ xpReward }} XP</p>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div class="bg-black/40 border border-gray-700 rounded-lg p-4">
            <UIcon name="i-lucide-check-circle" class="size-6 text-green-400 mx-auto mb-2" />
            <p class="text-xs text-gray-400">Questions</p>
            <p class="text-lg font-bold text-white">{{ questionsCompleted }}</p>
          </div>
          <div class="bg-black/40 border border-gray-700 rounded-lg p-4">
            <UIcon name="i-lucide-target" class="size-6 text-blue-400 mx-auto mb-2" />
            <p class="text-xs text-gray-400">Accuracy</p>
            <p class="text-lg font-bold text-white">{{ accuracy }}%</p>
          </div>
          <div class="bg-black/40 border border-gray-700 rounded-lg p-4">
            <UIcon name="i-lucide-clock" class="size-6 text-purple-400 mx-auto mb-2" />
            <p class="text-xs text-gray-400">Time</p>
            <p class="text-lg font-bold text-white">{{ timeSpent }}m</p>
          </div>
        </div>

        <!-- Next Topic Preview -->
        <div v-if="nextTopic" class="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-6">
          <p class="text-sm text-gray-400 mb-2">Next Topic</p>
          <p class="text-xl font-semibold text-white mb-4">{{ nextTopic.title }}</p>
          <div class="flex items-center justify-center gap-3">
            <UButton 
              size="lg" 
              color="pink"
              icon="i-lucide-arrow-right"
              trailing
              @click="handleContinue"
            >
              Continue to Next Topic
            </UButton>
            <UButton 
              size="lg" 
              variant="outline"
              icon="i-lucide-clipboard-check"
              @click="handlePracticeQuiz"
            >
              Practice Quiz
            </UButton>
          </div>
        </div>

        <!-- No Next Topic -->
        <div v-else class="space-y-4">
          <p class="text-gray-300">You've completed all available topics at your frontier! 🎓</p>
          <div class="flex items-center justify-center gap-3">
            <UButton 
              size="lg" 
              color="pink"
              icon="i-lucide-brain"
              @click="handleViewKG"
            >
              Explore Knowledge Graph
            </UButton>
            <UButton 
              size="lg" 
              variant="outline"
              @click="handleClose"
            >
              Close
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  topic?: {
    id: string
    title: string
  }
  nextTopic?: {
    id: string
    title: string
  }
  xpReward?: number
  questionsCompleted?: number
  accuracy?: number
  timeSpent?: number
}

const props = withDefaults(defineProps<Props>(), {
  xpReward: 50,
  questionsCompleted: 5,
  accuracy: 100,
  timeSpent: 15
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'continue': []
  'practice-quiz': []
  'view-kg': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleContinue = () => {
  emit('continue')
  isOpen.value = false
}

const handlePracticeQuiz = () => {
  emit('practice-quiz')
  isOpen.value = false
}

const handleViewKG = () => {
  emit('view-kg')
  isOpen.value = false
}

const handleClose = () => {
  isOpen.value = false
}
</script>

<style scoped>
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100px) rotate(360deg);
    opacity: 0;
  }
}
</style>

