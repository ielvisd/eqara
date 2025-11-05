<template>
  <div class="py-6">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent mb-4">
          🎯 Practice Quiz
        </h1>
        <p class="text-lg text-gray-300">
          Test your knowledge and strengthen your mastery!
        </p>
      </div>

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
          <h3 class="text-2xl font-bold text-white">Quiz Options</h3>
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
          <p class="text-red-300 mb-4">{{ error }}</p>
          <UButton
            color="primary"
            variant="outline"
            @click="setupNewQuiz"
          >
            Try Again
          </UButton>
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

    quizStarted.value = true
  } catch (err: any) {
    error.value = err.message || 'Failed to generate quiz'
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

    quizResult.value = await completeQuiz(quiz.value.id, answers.value)
    
    // Award XP
    const xpEarned = Math.floor(quizResult.value.accuracy / 10) * 10 + 20
    await addXP(xpEarned)

    showResults.value = true
    quizStarted.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to complete quiz'
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

