<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="text-center">
      <div class="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4 border border-purple-500/30">
        <UIcon :name="getScoreIcon()" class="size-16" :class="getScoreColor()" />
      </div>
      <h2 class="text-3xl font-bold text-white mb-2">
        {{ getScoreMessage() }}
      </h2>
      <p class="text-gray-400">
        You've completed your practice quiz!
      </p>
    </div>

    <!-- Score Card -->
    <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/20">
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-4xl font-bold text-purple-400 mb-1">
            {{ accuracy.toFixed(0) }}%
          </div>
          <div class="text-sm text-gray-400">Accuracy</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-green-400 mb-1">
            {{ correctAnswers }}/{{ totalQuestions }}
          </div>
          <div class="text-sm text-gray-400">Correct</div>
        </div>
        <div class="text-center" v-if="timeSpent">
          <div class="text-4xl font-bold text-blue-400 mb-1">
            {{ formatTime(timeSpent) }}
          </div>
          <div class="text-sm text-gray-400">Time</div>
        </div>
      </div>
    </div>

    <!-- Performance Gauge -->
    <div class="bg-black/50 rounded-lg p-6 border border-purple-500/20">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <UIcon name="i-lucide-target" class="size-5 text-purple-400" />
        Performance Analysis
      </h3>
      <div class="space-y-3">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-400">Your Score</span>
            <span class="text-sm font-medium text-purple-300">{{ accuracy.toFixed(1) }}%</span>
          </div>
          <div class="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-1000 ease-out"
              :class="getAccuracyBarColor()"
              :style="{ width: `${accuracy}%` }"
            ></div>
          </div>
        </div>
        <div class="text-sm text-gray-400 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <UIcon name="i-lucide-info" class="size-4 text-blue-400 inline mr-2" />
          {{ getPerformanceAdvice() }}
        </div>
      </div>
    </div>

    <!-- Mastery Updates -->
    <div v-if="masteryUpdates && masteryUpdates.length > 0" class="bg-black/50 rounded-lg p-6 border border-purple-500/20">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <UIcon name="i-lucide-trending-up" class="size-5 text-green-400" />
        Mastery Progress
      </h3>
      <div class="space-y-3">
        <div 
          v-for="update in masteryUpdates" 
          :key="update.topicId"
          class="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-white">{{ update.topicName }}</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400">{{ update.oldMastery }}%</span>
              <UIcon 
                name="i-lucide-arrow-right" 
                class="size-4"
                :class="update.newMastery > update.oldMastery ? 'text-green-400' : 'text-orange-400'"
              />
              <span 
                class="text-sm font-medium"
                :class="update.newMastery > update.oldMastery ? 'text-green-400' : 'text-orange-400'"
              >
                {{ update.newMastery }}%
              </span>
            </div>
          </div>
          <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
              :style="{ width: `${update.newMastery}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- XP Earned -->
    <div class="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
      <div class="flex items-center justify-center gap-3">
        <UIcon name="i-lucide-trophy" class="size-6 text-yellow-400" />
        <span class="text-lg font-semibold text-white">
          +{{ xpEarned }} XP Earned!
        </span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3">
      <UButton
        color="primary"
        size="lg"
        class="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        @click="$emit('retake')"
      >
        <UIcon name="i-lucide-refresh-cw" class="size-4 mr-2" />
        Take Another Quiz
      </UButton>
      <UButton
        color="gray"
        variant="outline"
        size="lg"
        class="flex-1"
        @click="$emit('close')"
      >
        Back to Learning
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  topicsReviewed: string[]
  timeSpent?: number
  masteryUpdates?: Array<{
    topicId: string
    topicName: string
    oldMastery: number
    newMastery: number
  }>
}>()

const emit = defineEmits<{
  retake: []
  close: []
}>()

// Calculate XP earned (1 XP per minute of focused work + accuracy bonus)
const xpEarned = computed(() => {
  const baseXP = props.timeSpent ? Math.floor(props.timeSpent / 60) * 10 : 0
  const accuracyBonus = Math.floor(props.accuracy / 10) * 5
  return Math.max(10, baseXP + accuracyBonus)
})

const getScoreIcon = () => {
  if (props.accuracy >= 90) return 'i-lucide-trophy'
  if (props.accuracy >= 75) return 'i-lucide-award'
  if (props.accuracy >= 60) return 'i-lucide-thumbs-up'
  return 'i-lucide-target'
}

const getScoreColor = () => {
  if (props.accuracy >= 90) return 'text-yellow-400'
  if (props.accuracy >= 75) return 'text-green-400'
  if (props.accuracy >= 60) return 'text-blue-400'
  return 'text-purple-400'
}

const getScoreMessage = () => {
  if (props.accuracy >= 90) return 'Outstanding! 🌟'
  if (props.accuracy >= 80) return 'Excellent Work! 🎯'
  if (props.accuracy >= 70) return 'Great Job! 💪'
  if (props.accuracy >= 60) return 'Good Progress! 👍'
  return 'Keep Practicing! 📚'
}

const getAccuracyBarColor = () => {
  if (props.accuracy >= 85) return 'bg-gradient-to-r from-green-500 to-emerald-500'
  if (props.accuracy >= 70) return 'bg-gradient-to-r from-blue-500 to-cyan-500'
  if (props.accuracy >= 50) return 'bg-gradient-to-r from-yellow-500 to-orange-500'
  return 'bg-gradient-to-r from-orange-500 to-red-500'
}

const getPerformanceAdvice = () => {
  if (props.accuracy >= 90) {
    return 'Perfect! You\'re ready for more advanced topics. Your mastery is exceptional!'
  }
  if (props.accuracy >= 80) {
    return 'Excellent! You\'re in the optimal 80-85% accuracy range for learning. Keep it up!'
  }
  if (props.accuracy >= 70) {
    return 'Good work! A few more practice sessions and you\'ll master these topics.'
  }
  if (props.accuracy >= 60) {
    return 'You\'re making progress! Review the explanations and try again to improve.'
  }
  return 'These topics need more practice. Review the fundamentals and try some easier problems first.'
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}
</script>

