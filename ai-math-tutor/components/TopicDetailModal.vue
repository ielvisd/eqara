<script setup lang="ts">
const props = defineProps<{
  topicId: string | null
  userId?: string
  sessionId?: string
}>()

const emit = defineEmits<{
  close: []
  startLearning: [topicId: string]
}>()

const kg = useKnowledgeGraph()
const mastery = useMastery()
const kgViz = useKGVisualization()

// Initialize all refs first
const isOpen = ref(false)
const loading = ref(false)
const topicData = ref<any>(null)
const topicMastery = ref<number>(0)
const prerequisites = ref<any[]>([])
const dependents = ref<any[]>([])
const canAdvance = ref(false)

// Watch topicId and open/close modal (after all refs are initialized)
watch(() => props.topicId, (newId: string | null, oldId: string | null) => {
  console.log('👀 TopicDetailModal watch triggered:', { oldId, newId })
  if (newId) {
    console.log('📥 Opening modal for topic:', newId)
    isOpen.value = true
    loadTopicDetails()
  } else {
    console.log('🚫 Topic ID is null, closing modal')
    isOpen.value = false
    topicData.value = null
  }
}, { immediate: true })

// Load topic details
const loadTopicDetails = async () => {
  if (!props.topicId) {
    console.warn('⚠️ No topicId provided to loadTopicDetails')
    return
  }
  
  console.log('📚 Loading topic details for:', props.topicId)
  loading.value = true
  topicData.value = null // Clear previous data
  
  try {
    // Get topic
    console.log('🔍 Fetching topic...')
    const topic = await kg.getTopic(props.topicId)
    console.log('📦 Topic fetched:', topic)
    
    if (!topic) {
      console.error('❌ Topic not found:', props.topicId)
      topicData.value = null
      return
    }
    topicData.value = topic
    
    // Get mastery
    console.log('📊 Fetching mastery...')
    const masteryData = await mastery.getTopicMastery(props.topicId, props.userId, props.sessionId)
    topicMastery.value = masteryData?.mastery_level || 0
    console.log('✅ Mastery loaded:', topicMastery.value)
    
    // Get prerequisites with mastery
    console.log('🔗 Fetching prerequisites...')
    const prereqs = await kg.getPrerequisites(props.topicId)
    console.log('📋 Prerequisites found:', prereqs.length)
    const enrichedPrereqs = await Promise.all(
      prereqs.map(async (prereq) => {
        const prereqMastery = await mastery.getTopicMastery(prereq.id, props.userId, props.sessionId)
        return {
          ...prereq,
          mastery: prereqMastery?.mastery_level || 0,
          isMastered: (prereqMastery?.mastery_level || 0) >= 100
        }
      })
    )
    prerequisites.value = enrichedPrereqs
    
    // Get dependent topics (topics that require this as prerequisite)
    console.log('🔗 Fetching dependent topics...')
    const allTopics = await kg.getAllTopics()
    const deps = []
    for (const t of allTopics) {
      const tPrereqs = await kg.getPrerequisites(t.id)
      if (tPrereqs.some(p => p.id === props.topicId)) {
        deps.push(t)
      }
    }
    dependents.value = deps
    console.log('📋 Dependent topics found:', deps.length)
    
    // Check if can advance
    canAdvance.value = await mastery.canAdvanceToTopic(props.topicId, props.userId, props.sessionId)
    console.log('✅ Topic details loaded successfully:', { 
      topic: topicData.value?.name, 
      mastery: topicMastery.value,
      canAdvance: canAdvance.value
    })
  } catch (e) {
    console.error('❌ Error loading topic details:', e)
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack trace')
    topicData.value = null
  } finally {
    loading.value = false
    console.log('🏁 Loading complete. Loading:', loading.value, 'TopicData:', !!topicData.value)
  }
}

// Handle modal close
watch(() => isOpen.value, (open: boolean) => {
  if (!open && props.topicId) {
    // Modal was closed, emit close event to clear topicId in parent
    emit('close')
  }
})

// Format domain
const formatDomainName = (domain: string) => {
  return domain.charAt(0).toUpperCase() + domain.slice(1).replace(/_/g, ' ')
}

// Get status
const getMasteryStatus = () => {
  if (!topicData.value) return 'locked'
  const allPrereqsMet = prerequisites.value.every((p: any) => p.isMastered)
  return kgViz.getMasteryStatus(topicMastery.value, allPrereqsMet, canAdvance.value)
}

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'mastered': return 'success'
    case 'in-progress': return 'warning'
    case 'frontier': return 'primary'
    case 'locked': default: return 'neutral'
  }
}

// Handle close
const handleClose = () => {
  console.log('🔒 Closing modal')
  isOpen.value = false
  emit('close')
}

// Handle start learning
const handleStartLearning = () => {
  if (props.topicId) {
    emit('startLearning', props.topicId)
  }
}
</script>

<template>
  <UModal 
    v-model:open="isOpen" 
    :prevent-close="loading"
    :title="topicData?.name || 'Topic Details'"
    :description="topicData ? formatDomainName(topicData.domain) : 'Loading...'"
    :ui="{
      overlay: 'bg-black/85 backdrop-blur-lg',
      content: 'bg-black border border-pink-500/30 shadow-2xl shadow-pink-500/20',
      header: 'bg-black border-b border-pink-500/20',
      title: 'text-white font-bold',
      description: 'text-pink-400',
      body: 'bg-black text-white',
      footer: 'bg-black border-t border-pink-500/20'
    }"
  >
    <template #header>
      <div v-if="loading" class="flex items-center justify-center py-4">
        <UIcon name="i-lucide-loader-2" class="size-8 text-pink-500 animate-spin" />
        <span class="ml-3 text-white">Loading topic details...</span>
      </div>
      
      <div v-else-if="topicData" class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <UIcon
              :name="kgViz.getNodeIcon(getMasteryStatus())"
              :class="[
                'size-6',
                getMasteryStatus() === 'mastered' ? 'text-green-400' :
                getMasteryStatus() === 'frontier' ? 'text-pink-400' :
                getMasteryStatus() === 'in-progress' ? 'text-yellow-400' :
                'text-gray-500'
              ]"
            />
            <h2 class="text-xl font-bold text-white">{{ topicData.name }}</h2>
          </div>
          <p class="text-sm text-gray-400">{{ formatDomainName(topicData.domain) }}</p>
        </div>
        <button @click="handleClose" class="text-gray-400 hover:text-white transition-colors">
          <UIcon name="i-lucide-x" class="size-6" />
        </button>
      </div>
    </template>
    
    <template #body>
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-12 text-pink-500 animate-spin" />
      </div>

      <!-- Error State -->
      <div v-else-if="!topicData && props.topicId" class="p-6 text-center">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-bold text-white mb-2">Failed to Load Topic</h3>
        <p class="text-sm text-gray-400 mb-4">Topic ID: {{ props.topicId }}</p>
        <UButton color="primary" @click="loadTopicDetails">
          Try Again
        </UButton>
      </div>

      <!-- Content -->
      <div v-else-if="topicData" class="space-y-6">
        <!-- Mastery Progress -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-white">Mastery Progress</h3>
            <UBadge :color="getStatusColor(getMasteryStatus())" size="sm">
              {{ getMasteryStatus().replace('-', ' ').toUpperCase() }}
            </UBadge>
          </div>
          <UProgress
            :model-value="topicMastery"
            :color="topicMastery >= 100 ? 'success' : topicMastery > 0 ? 'warning' : 'neutral'"
            size="lg"
            status
          />
          <p class="text-xs text-gray-400">
            {{ topicMastery >= 100 ? 'You have mastered this topic!' :
               topicMastery > 0 ? 'Keep practicing to reach 100% mastery.' :
               'Start learning this topic to track your progress.' }}
          </p>
        </div>

        <!-- Topic Info -->
        <div class="grid grid-cols-2 gap-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
          <div>
            <p class="text-xs text-gray-400 mb-1">Difficulty</p>
            <div class="flex items-center gap-1">
              <UIcon
                v-for="i in 10"
                :key="i"
                name="i-lucide-circle"
                :class="[
                  'size-2',
                  i <= topicData.difficulty ? 'text-pink-500' : 'text-gray-600'
                ]"
              />
            </div>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">Domain</p>
            <p class="text-sm font-semibold text-white">{{ formatDomainName(topicData.domain) }}</p>
          </div>
        </div>

        <!-- Prerequisites -->
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-white flex items-center gap-2">
            <UIcon name="i-lucide-arrow-down-to-line" class="size-4" />
            Prerequisites
          </h3>
          
          <div v-if="prerequisites.length === 0" class="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-check-circle" class="size-5 text-green-400" />
              <p class="text-sm text-gray-300">No prerequisites required! You can start learning this topic now.</p>
            </div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="prereq in prerequisites"
              :key="prereq.id"
              class="p-3 rounded-lg border"
              :class="[
                prereq.isMastered
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-pink-500/10 border-pink-500/20'
              ]"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 flex-1">
                  <UIcon
                    :name="prereq.isMastered ? 'i-lucide-check-circle' : 'i-lucide-lock'"
                    :class="prereq.isMastered ? 'text-green-400' : 'text-gray-500'"
                    class="size-4"
                  />
                  <span class="text-sm font-medium" :class="prereq.isMastered ? 'text-gray-300' : 'text-gray-400'">
                    {{ prereq.name }}
                  </span>
                </div>
                <span class="text-xs font-semibold" :class="prereq.isMastered ? 'text-green-400' : 'text-gray-500'">
                  {{ prereq.mastery }}%
                </span>
              </div>
            </div>

            <div v-if="!prerequisites.every((p: any) => p.isMastered)" class="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="size-4 text-yellow-400" />
                <p class="text-xs text-gray-300">
                  Master all prerequisites to unlock this topic
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- What This Unlocks -->
        <div v-if="dependents.length > 0" class="space-y-3">
          <h3 class="text-sm font-semibold text-white flex items-center gap-2">
            <UIcon name="i-lucide-unlock" class="size-4" />
            What This Unlocks
          </h3>
          <div class="space-y-2">
            <div
              v-for="dep in dependents.slice(0, 5)"
              :key="dep.id"
              class="p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg hover:bg-pink-500/15 transition-colors"
            >
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-arrow-right" class="size-4 text-pink-400" />
                <span class="text-sm text-gray-300">{{ dep.name }}</span>
              </div>
            </div>
            <p v-if="dependents.length > 5" class="text-xs text-gray-400 text-center">
              +{{ dependents.length - 5 }} more topics
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div v-if="!loading && topicData" class="flex items-center justify-between gap-3">
          <UButton color="neutral" variant="ghost" @click="handleClose">
            Close
          </UButton>
          
          <UButton
            v-if="canAdvance || topicMastery < 100"
            color="primary"
            @click="handleStartLearning"
          >
            <UIcon name="i-lucide-play" class="size-4 mr-2" />
            {{ topicMastery > 0 ? 'Continue Learning' : 'Start Learning' }}
          </UButton>

          <UButton
            v-else-if="topicMastery >= 100"
            color="success"
            disabled
          >
            <UIcon name="i-lucide-check" class="size-4 mr-2" />
            Mastered
          </UButton>

          <UButton
            v-else
            color="neutral"
            disabled
          >
            <UIcon name="i-lucide-lock" class="size-4 mr-2" />
            Locked
          </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Modal styling - black and hot pink theme */
:deep([data-slot="overlay"]) {
  background: rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(8px);
}

:deep([data-slot="content"]) {
  background: #000000 !important;
  border: 1px solid rgba(236, 72, 153, 0.3) !important;
  box-shadow: 0 20px 60px rgba(236, 72, 153, 0.4) !important;
  max-width: 600px !important;
}

:deep([data-slot="header"]) {
  background: #000000 !important;
  border-bottom: 1px solid rgba(236, 72, 153, 0.2) !important;
}

:deep([data-slot="title"]) {
  color: #ffffff !important;
  font-weight: 700 !important;
}

:deep([data-slot="description"]) {
  color: rgba(236, 72, 153, 0.8) !important;
}

:deep([data-slot="body"]) {
  background: #000000 !important;
  color: #ffffff !important;
}

:deep([data-slot="footer"]) {
  background: #000000 !important;
  border-top: 1px solid rgba(236, 72, 153, 0.2) !important;
}

/* Content styling */
:deep(.u-progress) {
  background: rgba(236, 72, 153, 0.1) !important;
}

:deep(.u-badge) {
  border: 1px solid rgba(236, 72, 153, 0.3);
}

/* Button styling */
:deep(.u-button[color="primary"]) {
  background: linear-gradient(to right, #ec4899, #db2777) !important;
  border-color: #ec4899 !important;
}

:deep(.u-button[color="primary"]:hover) {
  background: linear-gradient(to right, #db2777, #be185d) !important;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4) !important;
}

/* Badge colors with hot pink theme */
:deep(.u-badge[color="primary"]) {
  background: rgba(236, 72, 153, 0.2) !important;
  color: #ec4899 !important;
  border-color: rgba(236, 72, 153, 0.4) !important;
}

:deep(.u-badge[color="success"]) {
  background: rgba(16, 185, 129, 0.2) !important;
  color: #10b981 !important;
  border-color: rgba(16, 185, 129, 0.4) !important;
}

:deep(.u-badge[color="warning"]) {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #f59e0b !important;
  border-color: rgba(245, 158, 11, 0.4) !important;
}

/* Progress bar with hot pink */
:deep(.u-progress[color="warning"]) {
  --progress-background: rgba(236, 72, 153, 0.3) !important;
}

:deep(.u-progress[color="success"]) {
  --progress-background: rgba(16, 185, 129, 0.3) !important;
}

/* Animation */
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

:deep([data-slot="content"]) {
  animation: modalSlideIn 0.3s ease-out;
}

/* Progress bar animation */
:deep(.progress-bar) {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Prerequisite items animation */
:deep(.prerequisite-item) {
  animation: fadeInUp 0.3s ease-out backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Badge pulse animation */
:deep(.badge-success) {
  animation: badgePulse 2s infinite;
}

@keyframes badgePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
}
</style>

