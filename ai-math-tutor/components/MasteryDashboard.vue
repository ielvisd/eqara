<script setup lang="ts">
const props = defineProps<{
  userId?: string
  sessionId?: string
}>()

const emit = defineEmits<{
  topicClick: [topicId: string]
}>()

const kg = useKnowledgeGraph()
const mastery = useMastery()
const kgViz = useKGVisualization()

const loading = ref(true)
const domainMastery = ref<any[]>([])
const frontierTopics = ref<any[]>([])
const recentTopics = ref<any[]>([])

// Load mastery data
const loadMasteryData = async () => {
  loading.value = true
  
  try {
    // Get all domains
    const domains = ['arithmetic', 'algebra', 'proportions', 'word_problems', 'geometry']
    
    // Calculate mastery for each domain
    const domainData = await Promise.all(
      domains.map(async (domain) => {
        const stats = await mastery.getDomainMastery(domain, props.userId, props.sessionId)
        return {
          domain,
          ...stats
        }
      })
    )
    
    domainMastery.value = domainData.filter(d => d.total > 0)
    
    // Get frontier topics
    const frontier = await kgViz.getFrontierTopics(props.userId, props.sessionId)
    frontierTopics.value = frontier.slice(0, 5) // Top 5 frontier topics
    
    // Get recent topics (topics with progress)
    const allMastery = await mastery.getAllMastery(props.userId, props.sessionId)
    recentTopics.value = allMastery
      .sort((a, b) => {
        const aDate = new Date(a.last_practiced || 0)
        const bDate = new Date(b.last_practiced || 0)
        return bDate.getTime() - aDate.getTime()
      })
      .slice(0, 10)
  } catch (e) {
    console.error('Error loading mastery data:', e)
  } finally {
    loading.value = false
  }
}

// Format domain name
const formatDomainName = (domain: string) => {
  return domain.charAt(0).toUpperCase() + domain.slice(1).replace(/_/g, ' ')
}

// Get mastery color
const getMasteryColor = (percentage: number) => {
  if (percentage >= 80) return 'success'
  if (percentage >= 50) return 'warning'
  return 'error'
}

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return date.toLocaleDateString()
}

// Watch for prop changes
watch(() => [props.userId, props.sessionId], () => {
  loadMasteryData()
}, { immediate: true })

// Manual refresh
const refresh = () => {
  loadMasteryData()
}

// Expose refresh method
defineExpose({ refresh })
</script>

<template>
  <div class="mastery-dashboard h-full w-full overflow-auto">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="size-10 text-pink-500 animate-spin mb-3" />
        <p class="text-sm text-gray-400">Loading progress...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="space-y-6 p-4">
      <!-- Domain Mastery Overview -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
              <UIcon name="i-lucide-bar-chart-3" class="size-5 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Domain Mastery</h3>
              <p class="text-xs text-gray-400">Progress by mathematical domain</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="domainMastery.length === 0" class="text-center py-8 text-gray-400">
            <UIcon name="i-lucide-inbox" class="size-12 mb-2 mx-auto" />
            <p class="text-sm">No progress yet. Start learning to see your mastery!</p>
          </div>

          <div v-for="domain in domainMastery" :key="domain.domain" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-white">{{ formatDomainName(domain.domain) }}</span>
              <span class="text-gray-400">
                {{ domain.mastered }}/{{ domain.total }} topics
              </span>
            </div>
            <UProgress
              :model-value="domain.percentage"
              :color="getMasteryColor(domain.percentage)"
              size="md"
            />
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-check-circle" class="size-3 text-green-500" />
                <span>{{ domain.mastered }} mastered</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-clock" class="size-3 text-yellow-500" />
                <span>{{ domain.inProgress }} in progress</span>
              </div>
              <div class="flex items-center gap-1">
                <UIcon name="i-lucide-lock" class="size-3 text-gray-500" />
                <span>{{ domain.notStarted }} locked</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Knowledge Frontier -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <UIcon name="i-lucide-sparkles" class="size-5 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Knowledge Frontier</h3>
              <p class="text-xs text-gray-400">Ready to learn next</p>
            </div>
          </div>
        </template>

        <div class="space-y-2">
          <div v-if="frontierTopics.length === 0" class="text-center py-8 text-gray-400">
            <UIcon name="i-lucide-compass" class="size-12 mb-2 mx-auto" />
            <p class="text-sm">Master some topics to unlock new ones!</p>
          </div>

          <button
            v-for="topic in frontierTopics"
            :key="topic.id"
            class="w-full p-3 rounded-lg bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 transition-all text-left group"
            @click="emit('topicClick', topic.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <UIcon name="i-lucide-star" class="size-5 text-pink-400 group-hover:animate-pulse" />
                <div>
                  <p class="font-semibold text-white text-sm">{{ topic.name }}</p>
                  <p class="text-xs text-gray-400">{{ formatDomainName(topic.domain) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge size="xs" color="neutral">
                  Difficulty: {{ topic.difficulty }}/10
                </UBadge>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-gray-400 group-hover:text-pink-400 transition-colors" />
              </div>
            </div>
          </button>
        </div>
      </UCard>

      <!-- Recent Activity -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <UIcon name="i-lucide-history" class="size-5 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Recent Activity</h3>
              <p class="text-xs text-gray-400">Topics you've been practicing</p>
            </div>
          </div>
        </template>

        <div class="space-y-2">
          <div v-if="recentTopics.length === 0" class="text-center py-8 text-gray-400">
            <UIcon name="i-lucide-clock" class="size-12 mb-2 mx-auto" />
            <p class="text-sm">No activity yet. Start solving problems!</p>
          </div>

          <button
            v-for="item in recentTopics"
            :key="item.id"
            class="w-full p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all text-left group"
            @click="emit('topicClick', item.topic_id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <UIcon
                  :name="kgViz.getNodeIcon(kgViz.getMasteryStatus(item.mastery_level || 0, true, false))"
                  :class="[
                    'size-5',
                    item.mastery_level >= 100 ? 'text-green-400' :
                    item.mastery_level > 0 ? 'text-yellow-400' :
                    'text-gray-500'
                  ]"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-white text-sm truncate">
                    {{ item.topic?.name || 'Unknown Topic' }}
                  </p>
                  <p class="text-xs text-gray-400">
                    Last practiced: {{ formatDate(item.last_practiced) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <UProgress
                  :model-value="item.mastery_level || 0"
                  :color="getMasteryColor(item.mastery_level || 0)"
                  size="sm"
                  class="w-16"
                />
                <span class="text-xs font-semibold text-gray-300 w-8 text-right">
                  {{ item.mastery_level || 0 }}%
                </span>
              </div>
            </div>
          </button>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.mastery-dashboard {
  background: rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Custom scrollbar */
.mastery-dashboard::-webkit-scrollbar {
  width: 8px;
}

.mastery-dashboard::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.mastery-dashboard::-webkit-scrollbar-thumb {
  background: rgba(236, 72, 153, 0.5);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.mastery-dashboard::-webkit-scrollbar-thumb:hover {
  background: rgba(236, 72, 153, 0.7);
}

/* Card animations */
:deep(.u-card) {
  animation: cardSlideIn 0.4s ease-out backwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:deep(.u-card:nth-child(1)) {
  animation-delay: 0.1s;
}

:deep(.u-card:nth-child(2)) {
  animation-delay: 0.2s;
}

:deep(.u-card:nth-child(3)) {
  animation-delay: 0.3s;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.u-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.2);
}

/* Progress bar animation */
:deep(.u-progress) {
  animation: progressGrow 0.6s ease-out;
}

@keyframes progressGrow {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
  to {
    transform: scaleX(1);
  }
}

/* Frontier topic button animation */
:deep(.frontier-topic-button) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.frontier-topic-button:hover) {
  transform: translateX(4px);
  box-shadow: -4px 0 12px rgba(236, 72, 153, 0.3);
}

/* Activity item animation */
:deep(.activity-item) {
  transition: all 0.2s ease;
}

:deep(.activity-item:hover) {
  transform: translateX(4px);
  background: rgba(107, 114, 128, 0.3) !important;
}
</style>

