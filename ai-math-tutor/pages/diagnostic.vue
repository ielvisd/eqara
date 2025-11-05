<template>
  <div class="min-h-screen bg-black py-8">
    <UContainer class="py-8 max-w-7xl relative z-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent mb-4">
          🎯 Diagnostic Test
        </h1>
        <p class="text-lg text-gray-300">
          Let's find your starting point on the math adventure!
        </p>
      </div>

      <!-- Loading State -->
      <UCard v-if="loading" class="bg-black/90 border border-pink-500/20">
        <div class="text-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-12 text-pink-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-300">Preparing your diagnostic...</p>
        </div>
      </UCard>

      <!-- Question Display -->
      <UCard v-else-if="currentQuestion && !isComplete" class="bg-black/90 border border-pink-500/20">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold text-white">Question {{ questionNumber }}</h3>
              <p class="text-sm text-gray-400">{{ currentTopic?.name }}</p>
            </div>
            <div class="text-sm text-gray-400">
              Topics tested: {{ answers.length }}
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Question -->
          <div class="bg-pink-500/10 rounded-lg p-6 border border-pink-500/20">
            <p class="text-lg text-white font-medium mb-6" v-html="renderMath(currentQuestion.question)"></p>

            <!-- Multiple Choice Options -->
            <div v-if="currentQuestion.type === 'multiple_choice'" class="space-y-3">
              <UButton
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                :color="selectedAnswer === option ? 'primary' : 'gray'"
                :variant="selectedAnswer === option ? 'solid' : 'outline'"
                class="w-full justify-start text-left"
                size="lg"
                @click="selectedAnswer = option"
              >
                <span class="font-mono text-sm mr-3">{{ String.fromCharCode(65 + index) }}.</span>
                <span class="text-white" v-html="renderMath(option)"></span>
              </UButton>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <UButton
              color="primary"
              size="lg"
              class="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
              :disabled="!selectedAnswer || processing"
              :loading="processing"
              @click="submitSelectedAnswer"
            >
              Submit Answer
            </UButton>
            <UButton
              color="gray"
              variant="outline"
              size="lg"
              :disabled="processing"
              @click="submitIdontKnow"
            >
              I Don't Know
            </UButton>
          </div>

          <!-- Encouragement for "I Don't Know" -->
          <div class="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <p class="text-sm text-blue-300">
              💡 <strong>Honesty is rewarded!</strong> If you can't solve this quickly, choose "I Don't Know". 
              This helps us place you at the perfect starting point for your learning journey.
            </p>
          </div>
        </div>
      </UCard>

      <!-- Completion Screen -->
      <UCard v-else-if="isComplete && placement" class="bg-black/90 border border-pink-500/20">
        <template #header>
          <h3 class="text-2xl font-bold text-white">🎉 Diagnostic Complete!</h3>
        </template>

        <div class="space-y-6">
          <!-- Save Progress Prompt -->
          <SaveProgressPrompt
            message="Don't lose your diagnostic results! Sign up to save your personalized learning path."
            prompt-key="post-diagnostic"
            @sign-up="showAuthModal = true"
          />
          <!-- Placement Summary -->
          <div class="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-6 border border-pink-500/20">
            <h4 class="text-lg font-semibold text-white mb-4">Your Knowledge Frontier</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-pink-400">{{ placement.topicsMastered }}</div>
                <div class="text-sm text-gray-400">Mastered</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-yellow-400">{{ placement.topicsInProgress }}</div>
                <div class="text-sm text-gray-400">In Progress</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-400">{{ placement.topicsUnknown }}</div>
                <div class="text-sm text-gray-400">Unknown</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-green-400">{{ placement.frontierTopics }}</div>
                <div class="text-sm text-gray-400">Ready to Learn</div>
              </div>
            </div>
          </div>

          <!-- Recommended Starting Point -->
          <div v-if="placement.recommendedStartingPoint" class="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
            <p class="text-sm text-green-300 mb-2">
              <strong>Recommended Starting Point:</strong>
            </p>
            <p class="text-white font-medium">{{ placement.recommendedStartingPoint.name }}</p>
            <p class="text-sm text-gray-400 mt-1">{{ placement.recommendedStartingPoint.description }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <UButton
              color="primary"
              size="lg"
              class="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
              @click="goToLearning"
            >
              Start Learning! 🚀
            </UButton>
            <UButton
              color="gray"
              variant="outline"
              size="lg"
              @click="viewFrontier"
            >
              View Knowledge Graph
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Error State -->
      <UCard v-else-if="error" class="bg-red-500/10 border border-red-500/20">
        <div class="text-center py-8">
          <UIcon name="i-lucide-alert-circle" class="size-12 text-red-400 mx-auto mb-4" />
          <p class="text-red-300">{{ error }}</p>
          <UButton
            color="primary"
            variant="outline"
            class="mt-4"
            @click="startNewDiagnostic"
          >
            Try Again
          </UButton>
        </div>
      </UCard>
    </UContainer>

    <!-- Auth Modal -->
    <AuthModal
      v-model="showAuthModal"
      :has-anonymous-data="true"
    />
  </div>
</template>

<script setup lang="ts">
import { useDiagnostic, type DiagnosticQuestion, type DiagnosticAnswer, type DiagnosticSession } from '~/composables/useDiagnostic'
import { useKaTeX } from '~/composables/useKaTeX'

const diagnostic = useDiagnostic()
const { renderMath } = useKaTeX()

// State
const loading = ref(true)
const processing = ref(false)
const error = ref<string | null>(null)
const diagnosticSessionId = ref<string>('')
const currentQuestion = ref<DiagnosticQuestion | null>(null)
const currentTopic = ref<any>(null)
const selectedAnswer = ref<string>('')
const questionNumber = ref(1)
const showAuthModal = ref(false)
const answers = ref<DiagnosticAnswer[]>([])
const isComplete = ref(false)
const placement = ref<any>(null)
const diagnosticSession = ref<DiagnosticSession | null>(null)
const topicsTested = ref<string[]>([])
const testedRootTopics = ref<string[]>([])

// Start diagnostic on mount
onMounted(async () => {
  await startNewDiagnostic()
})

const startNewDiagnostic = async () => {
  try {
    loading.value = true
    error.value = null
    const session = await diagnostic.startDiagnostic()
    diagnosticSessionId.value = session.sessionId
    diagnosticSession.value = session
    currentQuestion.value = session.question
    currentTopic.value = session.currentTopic
    questionNumber.value = 1
    answers.value = []
    topicsTested.value = []
    testedRootTopics.value = []
    isComplete.value = false
    placement.value = null
    selectedAnswer.value = ''
  } catch (err: any) {
    error.value = err.message || 'Failed to start diagnostic'
  } finally {
    loading.value = false
  }
}

const submitSelectedAnswer = async () => {
  if (!selectedAnswer.value || !currentQuestion.value || !currentTopic.value) return

  const isCorrect = selectedAnswer.value === currentQuestion.value.correctAnswer
  await submitAnswer(isCorrect ? 'correct' : 'incorrect')
}

const submitIdontKnow = async () => {
  await submitAnswer('idontknow')
}

const submitAnswer = async (answerType: 'correct' | 'incorrect' | 'idontknow') => {
  if (!currentQuestion.value || !currentTopic.value || processing.value) return

  try {
    processing.value = true
    error.value = null

    // Log to browser console for debugging
    console.log('🔍 [CLIENT] Submitting answer:', {
      topicId: currentTopic.value.id,
      topicName: currentTopic.value.name,
      answerType,
      question: currentQuestion.value.question,
      topicsTestedSoFar: topicsTested.value.length
    })

    // Record answer
    const answer: DiagnosticAnswer = {
      topicId: currentTopic.value.id,
      answerType,
      masteryLevel: answerType === 'correct' ? 80 : answerType === 'idontknow' ? 0 : 30, // Match server-side values
      accuracy: answerType === 'correct' ? 100 : 0
    }
    answers.value.push(answer)

    // Submit to API
    const result = await diagnostic.submitAnswer(
      diagnosticSessionId.value,
      currentTopic.value.id,
      'question-1',
      selectedAnswer.value || '',
      answerType,
      topicsTested.value,
      diagnosticSession.value?.rootTopicsToTest,
      testedRootTopics.value
    )
    
    // Update tracking
    topicsTested.value = result.topicsTested
    testedRootTopics.value = result.testedRootTopics
    
    // Log to browser console
    console.log('📤 [CLIENT] Answer submitted, next question:', {
      topicsTested: result.topicsTested.length,
      nextTopicId: result.nextTopic?.id,
      nextTopicName: result.nextTopic?.name,
      questionPreview: result.nextQuestion?.question,
      isComplete: result.isComplete
    })

    if (result.isComplete) {
      // Complete diagnostic
      await completeDiagnostic()
    } else {
      // Move to next question
      currentTopic.value = result.nextTopic
      currentQuestion.value = result.nextQuestion
      questionNumber.value = result.questionsAsked + 1
      selectedAnswer.value = ''
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to submit answer'
  } finally {
    processing.value = false
  }
}

const completeDiagnostic = async () => {
  try {
    processing.value = true
    
    console.log('🎯 [CLIENT] Completing diagnostic:', {
      answersCount: answers.value.length,
      answers: answers.value.map((a: DiagnosticAnswer) => ({
        topicId: a.topicId,
        answerType: a.answerType
      }))
    })
    
    const result = await diagnostic.completeDiagnostic(
      diagnosticSessionId.value,
      answers.value
    )
    
    console.log('✅ [CLIENT] Diagnostic complete:', {
      placement: result.placement,
      frontierCount: result.frontier?.length || 0,
      recommendedTopic: result.placement.recommendedStartingPoint?.name
    })
    
    placement.value = result.placement
    isComplete.value = true
  } catch (err: any) {
    error.value = err.message || 'Failed to complete diagnostic'
  } finally {
    processing.value = false
  }
}

const goToLearning = () => {
  navigateTo('/')
}

const viewFrontier = () => {
  // TODO: Navigate to knowledge graph visualization
  navigateTo('/')
}
</script>

