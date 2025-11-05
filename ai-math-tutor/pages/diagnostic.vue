<template>
  <div class="min-h-screen bg-black py-6 md:py-12">
    <UContainer class="py-6 md:py-8 max-w-4xl relative z-10">
      <!-- Header -->
      <div class="text-center mb-8 md:mb-12">
        <div class="inline-flex items-center justify-center mb-4">
          <div class="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-pink-500/30 mr-4">
            <UIcon name="i-lucide-target" class="size-6 md:size-8 text-pink-400" />
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent">
            Diagnostic Test
          </h1>
        </div>
        <p class="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
          Let's find your starting point on the math adventure!
        </p>
      </div>

      <!-- Loading State -->
      <UCard 
        v-if="loading" 
        class="bg-black/90 border border-pink-500/20 shadow-xl shadow-pink-500/10 transition-all duration-300"
        :ui="{ body: 'py-16' }"
      >
        <div class="text-center">
          <UIcon name="i-lucide-loader-2" class="size-12 md:size-16 text-pink-400 animate-spin mx-auto mb-6" />
          <p class="text-lg text-gray-300 font-medium">Preparing your diagnostic...</p>
          <p class="text-sm text-gray-500 mt-2">This will only take a moment</p>
        </div>
      </UCard>

      <!-- Question Display -->
      <UCard 
        v-else-if="currentQuestion && !isComplete" 
        class="bg-black/90 border border-pink-500/20 shadow-xl shadow-pink-500/10 transition-all duration-300"
        :ui="{ 
          header: 'pb-4 border-b border-pink-500/20',
          body: 'py-6 md:py-8'
        }"
      >
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 font-bold text-sm">
                  {{ questionNumber }}
                </span>
                <h3 class="text-xl md:text-2xl font-bold text-white">Question {{ questionNumber }}</h3>
              </div>
              <p class="text-sm md:text-base text-gray-400 ml-11">{{ currentTopic?.name }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
              <UIcon name="i-lucide-book-open" class="size-4" />
              <span>Topics tested: <span class="text-pink-400 font-semibold">{{ answers.length }}</span></span>
            </div>
          </div>
        </template>

        <div class="space-y-6 md:space-y-8">
          <!-- Progress Indicator -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{{ Math.min(answers.length + 1, 15) }} / ~15 questions</span>
            </div>
            <div class="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div 
                class="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-500 ease-out"
                :style="{ width: `${Math.min(((answers.length + 1) / 15) * 100, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Question -->
          <div class="bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent rounded-xl p-6 md:p-8 border border-pink-500/20 shadow-lg shadow-pink-500/5">
            <div class="mb-6">
              <p class="text-xl md:text-2xl text-white font-semibold leading-relaxed" v-html="renderMath(currentQuestion.question)"></p>
            </div>

            <!-- Multiple Choice Options -->
            <div v-if="currentQuestion.type === 'multiple_choice'" class="space-y-3">
              <button
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                @click="selectedAnswer = option"
                :disabled="processing"
                class="w-full group relative overflow-hidden rounded-xl border-2 transition-all duration-200 text-left"
                :class="{
                  'bg-gradient-to-r from-pink-500 to-pink-600 border-pink-400 shadow-lg shadow-pink-500/30 scale-[1.02]': selectedAnswer === option,
                  'bg-gray-900/50 border-gray-700 hover:border-pink-500/50 hover:bg-gray-800/50': selectedAnswer !== option,
                  'opacity-50 cursor-not-allowed': processing
                }"
              >
                <div class="p-4 md:p-5 flex items-center gap-4">
                  <div 
                    class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200"
                    :class="{
                      'bg-white/20 text-white': selectedAnswer === option,
                      'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300': selectedAnswer !== option
                    }"
                  >
                    {{ String.fromCharCode(65 + index) }}
                  </div>
                  <span 
                    class="flex-1 text-base md:text-lg font-medium transition-colors"
                    :class="{
                      'text-white': selectedAnswer === option,
                      'text-gray-300 group-hover:text-white': selectedAnswer !== option
                    }"
                    v-html="renderMath(option)"
                  ></span>
                  <UIcon 
                    v-if="selectedAnswer === option"
                    name="i-lucide-check-circle-2" 
                    class="size-5 md:size-6 text-white flex-shrink-0"
                  />
                </div>
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <UButton
              color="primary"
              size="xl"
              class="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 transition-all duration-200"
              :disabled="!selectedAnswer || processing"
              :loading="processing"
              @click="submitSelectedAnswer"
            >
              <template v-if="!processing">
                Submit Answer
                <UIcon name="i-lucide-arrow-right" class="size-5 ml-2" />
              </template>
            </UButton>
            <UButton
              color="gray"
              variant="outline"
              size="xl"
              class="sm:flex-shrink-0 font-semibold border-gray-700 hover:border-gray-600 hover:bg-gray-900/50 transition-all duration-200"
              :disabled="processing"
              @click="submitIdontKnow"
            >
              <UIcon name="i-lucide-help-circle" class="size-5 mr-2" />
              I Don't Know
            </UButton>
          </div>

          <!-- Encouragement for "I Don't Know" -->
          <div class="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 md:p-5 border border-blue-500/20 shadow-sm">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 mt-0.5">
                <UIcon name="i-lucide-lightbulb" class="size-5 text-blue-400" />
              </div>
              <div class="flex-1">
                <p class="text-sm md:text-base text-blue-300 leading-relaxed">
                  <strong class="text-blue-200">Honesty is rewarded!</strong> If you can't solve this quickly, choose "I Don't Know". 
                  This helps us place you at the perfect starting point for your learning journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Completion Screen -->
      <UCard 
        v-else-if="isComplete && placement" 
        class="bg-black/90 border border-pink-500/20 shadow-xl shadow-pink-500/10 transition-all duration-300"
        :ui="{ 
          header: 'pb-4 border-b border-pink-500/20',
          body: 'py-6 md:py-8'
        }"
      >
        <template #header>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-green-500/30">
              <UIcon name="i-lucide-check-circle-2" class="size-6 md:size-8 text-green-400" />
            </div>
            <div>
              <h3 class="text-2xl md:text-3xl font-bold text-white">Diagnostic Complete!</h3>
              <p class="text-sm text-gray-400 mt-1">Your personalized learning path is ready</p>
            </div>
          </div>
        </template>

        <div class="space-y-6 md:space-y-8">
          <!-- Save Progress Prompt -->
          <SaveProgressPrompt
            message="Don't lose your diagnostic results! Sign up to save your personalized learning path."
            prompt-key="post-diagnostic"
            @sign-up="showAuthModal = true"
          />
          
          <!-- Placement Summary -->
          <div class="bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent rounded-xl p-6 md:p-8 border border-pink-500/20 shadow-lg shadow-pink-500/5">
            <div class="flex items-center gap-3 mb-6">
              <UIcon name="i-lucide-brain" class="size-5 text-pink-400" />
              <h4 class="text-xl font-bold text-white">Your Knowledge Frontier</h4>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div class="text-center p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                <div class="text-3xl md:text-4xl font-bold text-pink-400 mb-2">{{ placement.topicsMastered }}</div>
                <div class="text-xs md:text-sm text-gray-400 font-medium">Mastered</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div class="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">{{ placement.topicsInProgress }}</div>
                <div class="text-xs md:text-sm text-gray-400 font-medium">In Progress</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div class="text-3xl md:text-4xl font-bold text-blue-400 mb-2">{{ placement.topicsUnknown }}</div>
                <div class="text-xs md:text-sm text-gray-400 font-medium">Unknown</div>
              </div>
              <div class="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div class="text-3xl md:text-4xl font-bold text-green-400 mb-2">{{ placement.frontierTopics }}</div>
                <div class="text-xs md:text-sm text-gray-400 font-medium">Ready to Learn</div>
              </div>
            </div>
          </div>

          <!-- Recommended Starting Point -->
          <div 
            v-if="placement.recommendedStartingPoint" 
            class="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-5 md:p-6 border border-green-500/20 shadow-sm"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-map-pin" class="size-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-semibold text-green-300 mb-2">
                  Recommended Starting Point
                </p>
                <p class="text-lg font-bold text-white mb-2">{{ placement.recommendedStartingPoint.name }}</p>
                <p class="text-sm text-gray-400 leading-relaxed">{{ placement.recommendedStartingPoint.description }}</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <UButton
              color="primary"
              size="xl"
              class="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/40 transition-all duration-200"
              @click="goToLearning"
            >
              Start Learning!
              <UIcon name="i-lucide-rocket" class="size-5 ml-2" />
            </UButton>
            <UButton
              color="gray"
              variant="outline"
              size="xl"
              class="sm:flex-shrink-0 font-semibold border-gray-700 hover:border-gray-600 hover:bg-gray-900/50 transition-all duration-200"
              @click="viewFrontier"
            >
              <UIcon name="i-lucide-brain" class="size-5 mr-2" />
              View Knowledge Graph
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Error State -->
      <UCard 
        v-else-if="error" 
        class="bg-red-500/10 border border-red-500/20 shadow-xl shadow-red-500/10"
        :ui="{ body: 'py-12' }"
      >
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <UIcon name="i-lucide-alert-circle" class="size-8 text-red-400" />
          </div>
          <h3 class="text-xl font-bold text-red-300 mb-2">Something went wrong</h3>
          <p class="text-red-200 mb-6 max-w-md mx-auto">{{ error }}</p>
          <UButton
            color="primary"
            variant="outline"
            size="lg"
            class="border-pink-500/50 hover:bg-pink-500/10 hover:border-pink-500"
            @click="startNewDiagnostic"
          >
            <UIcon name="i-lucide-refresh-cw" class="size-5 mr-2" />
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
  // Navigate with recommended starting point as query parameter
  if (placement.value?.recommendedStartingPoint) {
    navigateTo({
      path: '/',
      query: {
        startTopic: placement.value.recommendedStartingPoint.id,
        fromDiagnostic: 'true'
      }
    })
  } else {
    navigateTo('/')
  }
}

const viewFrontier = () => {
  // Navigate and open knowledge graph
  navigateTo({
    path: '/',
    query: { openKG: 'true' }
  })
}
</script>

