<template>
  <div class="space-y-4">
    <!-- Question Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <span class="text-white font-bold text-lg">{{ questionNumber }}</span>
        </div>
        <div>
          <p class="text-sm text-gray-400">{{ topicName }}</p>
          <div class="flex items-center gap-2 mt-1">
            <UIcon 
              v-for="i in difficulty" 
              :key="i" 
              name="i-lucide-star" 
              class="size-3 text-yellow-400" 
            />
          </div>
        </div>
      </div>
      <div v-if="isTimed && timeRemaining !== null" class="flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-lg border border-orange-500/30">
        <UIcon name="i-lucide-timer" class="size-4 text-orange-400" />
        <span class="text-orange-300 font-mono text-sm">{{ formatTime(timeRemaining) }}</span>
      </div>
    </div>

    <!-- Question Text -->
    <div class="bg-purple-500/10 rounded-lg p-6 border border-purple-500/20">
      <p class="text-lg text-white font-medium mb-6" v-html="renderMath(question)"></p>

      <!-- Multiple Choice Options -->
      <div v-if="type === 'multiple_choice' && options" class="space-y-3">
        <button
          v-for="(option, index) in options"
          :key="index"
          :class="[
            'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
            selectedAnswer === option
              ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
              : 'bg-black/30 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10',
            showResult && option === correctAnswer
              ? 'bg-green-500/20 border-green-500'
              : showResult && selectedAnswer === option && option !== correctAnswer
              ? 'bg-red-500/20 border-red-500'
              : ''
          ]"
          :disabled="showResult || disabled"
          @click="selectAnswer(option)"
        >
          <div class="flex items-center gap-3">
            <span class="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm"
              :class="[
                selectedAnswer === option ? 'border-purple-400 text-purple-300' : 'border-gray-600 text-gray-400',
                showResult && option === correctAnswer ? 'border-green-400 text-green-300' : '',
                showResult && selectedAnswer === option && option !== correctAnswer ? 'border-red-400 text-red-300' : ''
              ]"
            >
              {{ String.fromCharCode(65 + index) }}
            </span>
            <span class="text-white flex-1" v-html="renderMath(option)"></span>
            <UIcon 
              v-if="showResult && option === correctAnswer" 
              name="i-lucide-check-circle" 
              class="size-5 text-green-400" 
            />
            <UIcon 
              v-if="showResult && selectedAnswer === option && option !== correctAnswer" 
              name="i-lucide-x-circle" 
              class="size-5 text-red-400" 
            />
          </div>
        </button>
      </div>

      <!-- Short Answer Input -->
      <div v-else-if="type === 'short_answer'" class="space-y-3">
        <UInput
          v-model="shortAnswerInput"
          placeholder="Type your answer..."
          size="lg"
          :disabled="showResult || disabled"
          class="w-full"
          @keyup.enter="selectAnswer(shortAnswerInput)"
        />
      </div>
    </div>

    <!-- Explanation (shown after answer) -->
    <div v-if="showResult && explanation" class="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-lightbulb" class="size-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-medium text-blue-300 mb-1">Explanation</p>
          <p class="text-sm text-gray-300" v-html="renderMath(explanation)"></p>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <UButton
      v-if="!showResult"
      color="primary"
      size="lg"
      class="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
      :disabled="!selectedAnswer || disabled"
      :loading="submitting"
      @click="submitAnswer"
    >
      Submit Answer
    </UButton>

    <!-- Next Button -->
    <UButton
      v-else
      color="primary"
      size="lg"
      class="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
      @click="$emit('next')"
    >
      Next Question →
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { useKaTeX } from '~/composables/useKaTeX'

const { renderMath } = useKaTeX()

const props = defineProps<{
  questionNumber: number
  question: string
  type: 'multiple_choice' | 'short_answer'
  options?: string[]
  correctAnswer?: string
  explanation?: string
  topicName: string
  difficulty: number
  isTimed?: boolean
  timeLimit?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  submit: [answer: string, isCorrect: boolean, timeSpent: number]
  next: []
}>()

const selectedAnswer = ref<string>('')
const shortAnswerInput = ref<string>('')
const showResult = ref(false)
const submitting = ref(false)
const startTime = ref<number>(Date.now())
const timeRemaining = ref<number | null>(props.isTimed ? (props.timeLimit || 60) : null)

// Timer countdown
let timerInterval: NodeJS.Timeout | null = null
if (props.isTimed && props.timeLimit) {
  timerInterval = setInterval(() => {
    if (timeRemaining.value !== null && timeRemaining.value > 0) {
      timeRemaining.value--
    } else if (timeRemaining.value === 0) {
      // Time's up, auto-submit
      submitAnswer()
    }
  }, 1000)
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const selectAnswer = (answer: string) => {
  if (showResult.value || props.disabled) return
  selectedAnswer.value = answer
}

const submitAnswer = async () => {
  if (!selectedAnswer.value && !shortAnswerInput.value) return
  if (showResult.value) return

  submitting.value = true
  const answer = props.type === 'short_answer' ? shortAnswerInput.value : selectedAnswer.value
  const timeSpent = Math.floor((Date.now() - startTime.value) / 1000)
  
  // Check if correct
  const isCorrect = answer.trim().toLowerCase() === (props.correctAnswer || '').trim().toLowerCase()
  
  showResult.value = true
  submitting.value = false

  // Stop timer
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  emit('submit', answer, isCorrect, timeSpent)
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

