<template>
  <div class="py-6">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Loading State -->
      <UCard v-if="loading" class="bg-black/90 border border-pink-500/20">
        <div class="text-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-12 text-pink-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-300">Generating your quiz...</p>
        </div>
      </UCard>

      <!-- Quiz Setup (before starting) - Hide in review mode -->
      <UCard v-else-if="!quizStarted && !showResults && !reviewMode" class="bg-black/90 border border-pink-500/20">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-bold text-white">Quiz Options</h3>
            <UButton
              color="gray"
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              @click="$emit('close')"
            />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Number of Questions -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Number of Questions
            </label>
            <div class="flex gap-3">
              <UButton
                v-for="num in [5, 10, 15, 20]"
                :key="num"
                :color="numQuestions === num ? 'primary' : 'gray'"
                :variant="numQuestions === num ? 'solid' : 'outline'"
                @click="numQuestions = num"
              >
                {{ num }}
              </UButton>
            </div>
          </div>

          <!-- Timed Mode -->
          <div class="flex items-center justify-between p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-timer" class="size-5 text-pink-400" />
              <div>
                <p class="text-sm font-medium text-white">Timed Mode</p>
                <p class="text-xs text-gray-400">Challenge yourself with a time limit per question</p>
              </div>
            </div>
            <USwitch v-model="isTimed" />
          </div>

          <!-- Start Button -->
          <UButton
            color="pink"
            size="lg"
            class="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
            @click="startQuiz"
          >
            Start Quiz 🚀
          </UButton>
        </div>
      </UCard>

      <!-- Quiz In Progress -->
      <UCard v-else-if="quizStarted && !showResults && currentQuestion" class="bg-black/90 border border-pink-500/20">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-white">
              Question {{ currentQuestionIndex + 1 }} of {{ quiz?.questions.length || 0 }}
            </h3>
            <div class="flex items-center gap-3">
              <div class="text-sm text-gray-400">
                {{ answeredQuestions }} answered
              </div>
              <UButton
                color="gray"
                variant="ghost"
                size="sm"
                icon="i-lucide-x"
                @click="cancelQuiz"
              />
            </div>
          </div>
        </template>

        <!-- Progress Bar -->
        <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-6">
          <div 
            class="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <!-- Question Component -->
        <QuizQuestion
          :question-number="currentQuestionIndex + 1"
          :question="currentQuestion.question"
          :type="currentQuestion.type"
          :options="currentQuestion.options"
          :correct-answer="currentQuestion.correctAnswer"
          :explanation="currentQuestion.explanation"
          :topic-name="currentQuestion.topicName"
          :difficulty="currentQuestion.difficulty"
          :is-timed="isTimed"
          :time-limit="60"
          @submit="handleAnswerSubmit"
          @next="nextQuestion"
        />
      </UCard>

      <!-- Results -->
      <UCard v-else-if="showResults && quizResult" class="bg-black/90 border border-pink-500/20">
        <QuizResults
          :accuracy="quizResult.accuracy"
          :total-questions="quizResult.totalQuestions"
          :correct-answers="quizResult.correctAnswers"
          :topics-reviewed="quizResult.topicsReviewed"
          :time-spent="quizResult.timeSpent"
          :mastery-updates="quizResult.masteryUpdates"
          @retake="setupNewQuiz"
          @close="$emit('close')"
        />
      </UCard>

      <!-- Error State -->
      <UCard v-else-if="error" class="bg-red-500/10 border border-red-500/20">
        <div class="text-center py-8">
          <UIcon name="i-lucide-alert-circle" class="size-12 text-red-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-red-300 mb-2">Oops! Something went wrong</h3>
          <p class="text-red-300 mb-6">{{ error }}</p>
          <div class="flex gap-3 justify-center">
            <UButton
              color="primary"
              variant="outline"
              @click="setupNewQuiz"
            >
              Try Again
            </UButton>
            <UButton
              color="gray"
              variant="ghost"
              @click="$emit('close')"
            >
              Close
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuiz, type QuizSession, type QuizAnswer, type QuizResult } from '~/composables/useQuiz'
import { useGamification } from '~/composables/useGamification'

const props = defineProps<{
  reviewMode?: boolean
  topicIds?: string[]
}>()

const emit = defineEmits<{
  close: []
}>()

const { generateQuiz, completeQuiz } = useQuiz()
const { addXP } = useGamification()

// State
const loading = ref(false)
const quizStarted = ref(false)
const showResults = ref(false)
const error = ref<string | null>(null)
const quiz = ref<QuizSession | null>(null)
const currentQuestionIndex = ref(0)
const answers = ref<QuizAnswer[]>([])
const quizResult = ref<QuizResult | null>(null)

// Settings
const numQuestions = ref(10)
const isTimed = ref(false)

// Auto-start if in review mode with topic IDs
onMounted(() => {
  if (props.reviewMode && props.topicIds && props.topicIds.length > 0) {
    startQuiz()
  }
})

// Computed
const currentQuestion = computed(() => {
  if (!quiz.value || currentQuestionIndex.value >= quiz.value.questions.length) {
    return null
  }
  return quiz.value.questions[currentQuestionIndex.value]
})

const answeredQuestions = computed(() => answers.value.length)

const progress = computed(() => {
  if (!quiz.value) return 0
  return (answeredQuestions.value / quiz.value.questions.length) * 100
})

const setupNewQuiz = () => {
  quizStarted.value = false
  showResults.value = false
  error.value = null
  quiz.value = null
  currentQuestionIndex.value = 0
  answers.value = []
  quizResult.value = null
}

const startQuiz = async () => {
  try {
    loading.value = true
    error.value = null

    quiz.value = await generateQuiz({
      topicIds: props.topicIds,
      numQuestions: props.topicIds ? props.topicIds.length * 2 : numQuestions.value,
      isTimed: isTimed.value,
      timeLimit: isTimed.value ? 60 : undefined
    })

    if (!quiz.value || !quiz.value.questions || quiz.value.questions.length === 0) {
      throw new Error('No questions were generated for this quiz. Please try again or select different topics.')
    }

    quizStarted.value = true
  } catch (err: any) {
    console.error('Error starting quiz:', err)
    
    // Provide user-friendly error messages
    if (err.message?.includes('No topics available')) {
      error.value = 'No topics available for quiz. Please complete some lessons first to practice!'
    } else if (err.message?.includes('Session ID required')) {
      error.value = 'Unable to start quiz. Please refresh the page and try again.'
    } else {
      error.value = err.message || 'Failed to generate quiz. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const handleAnswerSubmit = (answer: string, isCorrect: boolean, timeSpent: number) => {
  if (!currentQuestion.value) return

  const quizAnswer: QuizAnswer = {
    questionId: currentQuestion.value.id,
    topicId: currentQuestion.value.topicId,
    answer,
    isCorrect,
    timeSpent
  }

  answers.value.push(quizAnswer)
}

const nextQuestion = () => {
  if (!quiz.value) return

  if (currentQuestionIndex.value < quiz.value.questions.length - 1) {
    currentQuestionIndex.value++
  } else {
    // Quiz complete
    finishQuiz()
  }
}

const finishQuiz = async () => {
  if (!quiz.value) return

  try {
    loading.value = true
    error.value = null

    if (!answers.value || answers.value.length === 0) {
      throw new Error('No answers submitted. Please answer at least one question.')
    }

    quizResult.value = await completeQuiz(quiz.value.id, answers.value)
    
    if (!quizResult.value) {
      throw new Error('Failed to get quiz results. Please try again.')
    }
    
    // Award XP
    const xpEarned = Math.floor(quizResult.value.accuracy / 10) * 10 + 20
    try {
      await addXP(xpEarned)
    } catch (xpError) {
      // XP error shouldn't block showing results
      console.warn('Failed to award XP:', xpError)
    }

    showResults.value = true
    quizStarted.value = false
  } catch (err: any) {
    console.error('Error completing quiz:', err)
    error.value = err.message || 'Failed to complete quiz. Your progress may not have been saved.'
    // Don't hide quiz - let user see their answers
  } finally {
    loading.value = false
  }
}

const cancelQuiz = () => {
  if (confirm('Are you sure you want to cancel this quiz? Your progress will be lost.')) {
    setupNewQuiz()
    emit('close')
  }
}
</script>

