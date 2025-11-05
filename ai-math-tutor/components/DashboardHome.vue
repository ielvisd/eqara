<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 text-pink-400 animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
      <UIcon name="i-lucide-alert-circle" class="size-8 text-red-400 mx-auto mb-3" />
      <p class="text-red-300">{{ error }}</p>
      <UButton class="mt-4" @click="() => fetchStudentContext(user?.id, getSessionId() || undefined)">Try Again</UButton>
    </div>

    <!-- State 1: New Student (No Diagnostic) -->
    <div v-else-if="isNew && !context.hasCompletedDiagnostic" class="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-8 text-center">
      <UIcon name="i-lucide-target" class="size-16 text-pink-400 mx-auto mb-4" />
      <h2 class="text-3xl font-bold text-white mb-2">Welcome to Your Math Journey!</h2>
      <p class="text-gray-300 text-lg mb-6">Let's find your perfect starting point</p>
      
      <NuxtLink to="/diagnostic">
        <UButton 
          size="xl" 
          color="pink" 
          class="px-8 py-4 text-lg"
          icon="i-lucide-arrow-right"
          trailing
        >
          Take Placement Test
        </UButton>
      </NuxtLink>
      
      <div class="mt-6 flex items-center justify-center gap-8 text-sm text-gray-400">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-clock" class="size-4" />
          <span>Takes 5-10 minutes</span>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-lightbulb" class="size-4" />
          <span>Answer honestly for best placement</span>
        </div>
      </div>
    </div>

    <!-- State 1b: Diagnostic Complete but No Active Learning -->
    <div v-else-if="isNew && context.hasCompletedDiagnostic" class="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-8 text-center">
      <UIcon name="i-lucide-check-circle-2" class="size-16 text-cyan-400 mx-auto mb-4" />
      <h2 class="text-3xl font-bold text-white mb-2">Ready to Practice!</h2>
      <p class="text-gray-300 text-lg mb-6">
        Take diagnostic again or enter a problem below to start practicing
      </p>
      
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <NuxtLink to="/diagnostic">
          <UButton 
            size="lg" 
            color="gray"
            variant="outline"
            class="px-6 py-3"
            icon="i-lucide-refresh-cw"
          >
            Retake Diagnostic
          </UButton>
        </NuxtLink>
        
        <UButton 
          size="lg" 
          color="pink"
          class="px-6 py-3"
          icon="i-lucide-brain"
          @click="emit('view-kg')"
        >
          View Knowledge Graph
        </UButton>
      </div>
      
      <p class="text-sm text-gray-400 mt-6">
        Your personalized learning path is ready. Start practicing by entering a math problem in the chat below!
      </p>
    </div>

    <!-- State 2: Active Learning -->
    <template v-else-if="isLearning || hasReviewsDue">
      <!-- Continue Learning Card -->
      <div class="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <div class="bg-pink-500/20 p-3 rounded-lg">
            <UIcon name="i-lucide-graduation-cap" class="size-6 text-pink-400" />
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-white mb-1">Continue Learning</h3>
            <p v-if="context.currentTopic" class="text-gray-300 text-sm mb-3">
              Current Topic: <span class="text-pink-400 font-semibold">{{ context.currentTopic.title }}</span>
            </p>
            
            <!-- Mastery Progress -->
            <div v-if="context.currentTopic" class="mb-4">
              <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Mastery: {{ context.currentTopic.mastery }}%</span>
                <span>{{ context.currentTopic.lessonsCompleted }}/{{ context.currentTopic.totalLessons }} lessons</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  :style="{ width: `${context.currentTopic.mastery}%` }"
                />
              </div>
            </div>

            <div class="flex items-center gap-3">
              <UButton 
                color="pink" 
                size="lg"
                icon="i-lucide-arrow-right"
                trailing
                @click="emit('continue-learning')"
              >
                Continue Learning
              </UButton>
              
              <p v-if="context.nextTopic" class="text-xs text-gray-400">
                Next up: <span class="text-gray-300">{{ context.nextTopic.title }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Card removed - use FAB button instead -->

      <!-- Progress Overview -->
      <div class="bg-black/40 border border-gray-700 rounded-xl p-6">
        <div class="flex items-center gap-3 mb-4">
          <UIcon name="i-lucide-bar-chart" class="size-5 text-gray-400" />
          <h3 class="text-lg font-semibold text-white">Your Progress</h3>
        </div>
        
        <div v-if="Object.keys(context.domainProgress).length > 0" class="space-y-3">
          <div 
            v-for="(domain, key) in context.domainProgress" 
            :key="key"
            class="flex items-center justify-between"
          >
            <div class="flex-1">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-300 font-medium">{{ domain.domain }}</span>
                <span class="text-gray-400">{{ domain.percentComplete }}% Complete</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  class="bg-gradient-to-r from-pink-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                  :style="{ width: `${domain.percentComplete}%` }"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-4 space-y-2">
          <UButton 
            variant="ghost" 
            class="w-full text-gray-400 hover:text-pink-400"
            icon="i-lucide-brain"
            @click="emit('view-kg')"
          >
            View Knowledge Graph
          </UButton>
          
          <NuxtLink 
            v-if="context.hasCompletedDiagnostic"
            to="/diagnostic"
            class="block"
          >
            <UButton 
              variant="ghost" 
              class="w-full text-gray-400 hover:text-pink-400"
              icon="i-lucide-refresh-cw"
            >
              Retake Diagnostic
            </UButton>
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- State 3: Topic Completed (Mastered) -->
    <div v-else-if="isCompleted" class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-8 text-center">
      <UIcon name="i-lucide-trophy" class="size-16 text-green-400 mx-auto mb-4" />
      <h2 class="text-3xl font-bold text-white mb-2">🎉 Amazing Progress!</h2>
      <p class="text-gray-300 text-lg mb-6">You've mastered all available topics at your frontier</p>
      
      <div class="flex items-center justify-center gap-4">
        <UButton 
          size="lg" 
          color="pink"
          icon="i-lucide-brain"
          @click="emit('view-kg')"
        >
          Explore Knowledge Graph
        </UButton>
        <!-- Practice Quiz button removed - use FAB button instead -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { 
  context, 
  loading, 
  error, 
  fetchStudentContext,
  isNew,
  isLearning,
  hasReviewsDue,
  isCompleted
} = useStudentState()

const { user } = useAuth()

const emit = defineEmits<{
  'continue-learning': []
  'start-review': []
  'view-kg': []
  'practice-quiz': []
}>()

// Helper to get or create session ID
const getSessionId = () => {
  if (process.client) {
    let sessionId = localStorage.getItem('chat_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('chat_session_id', sessionId)
    }
    return sessionId
  }
  return null
}

// Fetch context on mount
onMounted(() => {
  const sessionId = getSessionId()
  const userId = user.value?.id
  fetchStudentContext(userId, sessionId || undefined)
})
</script>

