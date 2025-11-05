<template>
  <div class="min-h-screen bg-black py-8">
    <UContainer class="py-8 max-w-4xl relative z-10">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent mb-4">
          📚 Review Session
        </h1>
        <p class="text-lg text-gray-300">
          Strengthen your mastery with spaced repetition!
        </p>
      </div>

      <!-- Loading State -->
      <UCard v-if="loading" class="bg-black/90 border border-blue-500/20">
        <div class="text-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p class="text-gray-300">Loading your reviews...</p>
        </div>
      </UCard>

      <!-- No Reviews Due -->
      <UCard v-else-if="!loading && dueReviews.length === 0" class="bg-black/90 border border-blue-500/20">
        <div class="text-center py-12">
          <div class="inline-block p-4 bg-green-500/20 rounded-full mb-4">
            <UIcon name="i-lucide-check-circle-2" class="size-16 text-green-400" />
          </div>
          <h3 class="text-2xl font-bold text-white mb-2">All Caught Up!</h3>
          <p class="text-gray-400 mb-6">
            You don't have any reviews due right now. Great work!
          </p>
          <UButton
            color="primary"
            variant="outline"
            @click="$emit('close')"
          >
            Back to Learning
          </UButton>
        </div>
      </UCard>

      <!-- Review Options (Optimization) -->
      <div v-else-if="!reviewStarted && dueReviews.length > 0" class="space-y-6">
        <!-- Due Reviews Summary -->
        <UCard class="bg-black/90 border border-blue-500/20">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-bold text-white">Reviews Due</h3>
              <div class="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full border border-blue-500/30">
                {{ dueReviews.length }} topics
              </div>
            </div>
          </template>

          <div class="space-y-3">
            <div 
              v-for="review in dueReviews.slice(0, 5)" 
              :key="review.topicId"
              class="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-white font-medium">{{ review.topicName }}</p>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-xs text-gray-400">
                      Mastery: {{ review.masteryLevel }}%
                    </span>
                    <span class="text-xs text-orange-400" v-if="review.daysUntilDue < 0">
                      {{ Math.abs(review.daysUntilDue) }} days overdue
                    </span>
                  </div>
                </div>
                <div class="w-16 h-16">
                  <div class="relative w-full h-full">
                    <svg class="transform -rotate-90 w-full h-full">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        stroke-width="4"
                        fill="none"
                        class="text-gray-700"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        stroke-width="4"
                        fill="none"
                        class="text-blue-400"
                        :stroke-dasharray="`${review.masteryLevel * 1.76} 176`"
                      />
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {{ review.masteryLevel }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="dueReviews.length > 5" class="text-center text-sm text-gray-400">
              + {{ dueReviews.length - 5 }} more topics
            </div>
          </div>
        </UCard>

        <!-- Optimization Option -->
        <UCard class="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 p-3 bg-purple-500/20 rounded-lg">
              <UIcon name="i-lucide-zap" class="size-6 text-purple-400" />
            </div>
            <div class="flex-1">
              <h4 class="text-lg font-semibold text-white mb-2">
                🚀 Smart Review (Recommended)
              </h4>
              <p class="text-sm text-gray-400 mb-4">
                Using FIRe algorithm compression, review {{ optimalTopicsCount }} advanced topics 
                that implicitly cover all {{ dueReviews.length }} due topics. 
                <span class="text-purple-400 font-medium">Save {{ timeSaved }}% time!</span>
              </p>
              <UButton
                color="primary"
                class="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                @click="startOptimalReview"
              >
                Start Smart Review
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Regular Review Option -->
        <div class="text-center">
          <UButton
            color="gray"
            variant="outline"
            @click="startRegularReview"
          >
            Review All Topics Individually
          </UButton>
        </div>
      </div>

      <!-- Review Quiz (reuse QuizInterface with review mode) -->
      <div v-else-if="reviewStarted">
        <QuizInterface
          :review-mode="true"
          :topic-ids="reviewTopicIds"
          @close="finishReview"
        />
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { useSpacedRepetition, type ReviewSchedule } from '~/composables/useSpacedRepetition'

const emit = defineEmits<{
  close: []
}>()

const { getDueReviews, getOptimalReviewTopics } = useSpacedRepetition()

// State
const loading = ref(true)
const reviewStarted = ref(false)
const dueReviews = ref<ReviewSchedule[]>([])
const reviewTopicIds = ref<string[]>([])
const optimalTopics = ref<any[]>([])
const compressionRatio = ref(0)

// Computed
const optimalTopicsCount = computed(() => optimalTopics.value.length || 0)
const timeSaved = computed(() => {
  if (dueReviews.value.length === 0) return 0
  return Math.round((1 - compressionRatio.value) * 100)
})

// Load reviews on mount
onMounted(async () => {
  try {
    loading.value = true
    
    // Get due reviews
    dueReviews.value = await getDueReviews()
    
    // Get optimal review topics
    if (dueReviews.value.length > 0) {
      const optimal = await getOptimalReviewTopics()
      optimalTopics.value = optimal.topics
      compressionRatio.value = optimal.compressionRatio
    }
  } catch (error) {
    console.error('Error loading reviews:', error)
  } finally {
    loading.value = false
  }
})

const startOptimalReview = () => {
  reviewTopicIds.value = optimalTopics.value.map(t => t.topicId)
  reviewStarted.value = true
}

const startRegularReview = () => {
  reviewTopicIds.value = dueReviews.value.map(r => r.topicId)
  reviewStarted.value = true
}

const finishReview = () => {
  emit('close')
}
</script>

