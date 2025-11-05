<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  userId?: string
  sessionId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'topicSelect': [topicId: string]
}>()

const gamification = useGamification()
const supabase = useSupabase()

// Tab management
const tabs = [
  {
    label: 'Graph',
    icon: 'i-lucide-network',
    slot: 'graph'
  },
  {
    label: 'Tree',
    icon: 'i-lucide-folder-tree',
    slot: 'tree'
  },
  {
    label: 'Progress',
    icon: 'i-lucide-bar-chart-3',
    slot: 'progress'
  },
  {
    label: 'Stats',
    icon: 'i-lucide-award',
    slot: 'achievements'
  }
]

// Modal management
const selectedTopicId = ref<string | null>(null)

// Component refs
const graphFlowRef = ref<any>(null)
const treeRef = ref<any>(null)
const dashboardRef = ref<any>(null)

// Handle topic clicks
const handleNodeClick = (topicId: string, topicData: any) => {
  console.log('🖱️ Node clicked:', { topicId, topicData, timestamp: new Date().toISOString() })
  if (!topicId) {
    console.error('❌ No topic ID provided!')
    return
  }
  selectedTopicId.value = topicId
  // Force reactivity and log
  nextTick(() => {
    console.log('✅ Modal should open with topicId:', selectedTopicId.value)
    console.log('📊 Current modal state - selectedTopicId:', selectedTopicId.value)
  })
}

const handleTopicClick = (topicId: string, topicData?: any) => {
  console.log('🖱️ Topic clicked:', { topicId, topicData, timestamp: new Date().toISOString() })
  if (!topicId) {
    console.error('❌ No topic ID provided!')
    return
  }
  selectedTopicId.value = topicId
  nextTick(() => {
    console.log('✅ Modal should open with topicId:', selectedTopicId.value)
  })
}

const handleCloseModal = () => {
  selectedTopicId.value = null
}

const handleStartLearning = (topicId: string) => {
  selectedTopicId.value = null
  emit('topicSelect', topicId)
  emit('update:modelValue', false) // Close sidebar
}

// Refresh all views
const refreshAll = () => {
  const kgViz = useKGVisualization()
  // Clear cache to force reload
  kgViz.clearCache(props.userId, props.sessionId)
  graphFlowRef.value?.refresh()
  treeRef.value?.refresh()
  dashboardRef.value?.refresh()
  gamification.loadGamestate()
}

// Close sidebar
const closeSidebar = () => {
  emit('update:modelValue', false)
}

// Real-time subscriptions
let masterySubscription: any = null

// Setup real-time subscription to mastery changes
onMounted(() => {
  if (process.client) {
    // Subscribe to mastery changes
    const sessionIdValue = props.sessionId || (process.client ? localStorage.getItem('math_tutor_session_id') : null)
    
    if (sessionIdValue) {
      masterySubscription = supabase
        .channel('student_mastery_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'student_mastery',
            filter: `session_id=eq.${sessionIdValue}`
          },
        (payload: any) => {
          console.log('🔄 Mastery updated via realtime:', payload)
          // Auto-refresh all views when mastery changes
          setTimeout(() => {
            refreshAll()
          }, 500) // Small delay to ensure DB is updated
        }
        )
        .subscribe()
    }
  }
})

// Cleanup subscription on unmount
onUnmounted(() => {
  if (masterySubscription) {
    supabase.removeChannel(masterySubscription)
  }
})

// Watch for session ID changes
watch(() => props.sessionId, (newSessionId: string | undefined) => {
  if (process.client && newSessionId) {
    // Unsubscribe from old channel
    if (masterySubscription) {
      supabase.removeChannel(masterySubscription)
    }
    
    // Subscribe to new session
    masterySubscription = supabase
      .channel('student_mastery_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_mastery',
          filter: `session_id=eq.${newSessionId}`
        },
        (payload: any) => {
          console.log('🔄 Mastery updated via realtime:', payload)
          setTimeout(() => {
            refreshAll()
          }, 500)
        }
      )
      .subscribe()
  }
})

// Expose refresh method
defineExpose({ refreshAll })
</script>

<template>
  <USlideover 
    :open="modelValue" 
    @update:open="(value: boolean) => emit('update:modelValue', value)" 
    side="right"
    title="Knowledge Graph"
    description="Track your learning journey and explore topic relationships"
    class="kg-sidebar"
    :ui="{
      header: 'bg-black border-b border-pink-500/20',
      title: 'text-white font-bold',
      description: 'text-pink-400',
      content: 'bg-black',
      body: 'bg-black'
    }"
  >

    <template #body>
      <div class="h-full flex flex-col">
        <!-- Tabs -->
        <UTabs :items="tabs" variant="link" :unmount-on-hide="false" class="w-full flex-1 flex flex-col min-h-0" :ui="{ root: 'flex flex-col h-full', content: 'flex-1 min-h-0 overflow-hidden' }">
          <template #item="{ item }">
            <div class="flex items-center gap-2 whitespace-nowrap">
              <UIcon :name="item.icon" class="size-4 flex-shrink-0" />
              <span class="text-sm">{{ item.label }}</span>
            </div>
          </template>

          <!-- Graph View -->
          <template #graph>
            <div class="flex-1 overflow-hidden min-h-0" style="height: 100%;">
              <KnowledgeGraphFlow
                ref="graphFlowRef"
                :user-id="userId"
                :session-id="sessionId"
                @node-click="handleNodeClick"
              />
            </div>
          </template>

          <!-- Tree View -->
          <template #tree>
            <div class="flex-1 overflow-hidden min-h-0" style="height: 100%;">
              <KnowledgeGraphTree
                ref="treeRef"
                :user-id="userId"
                :session-id="sessionId"
                @topic-click="handleTopicClick"
              />
            </div>
          </template>

          <!-- Progress Dashboard -->
          <template #progress>
            <div class="flex-1 overflow-hidden min-h-0" style="height: 100%;">
              <MasteryDashboard
                ref="dashboardRef"
                :user-id="userId"
                :session-id="sessionId"
                @topic-click="handleTopicClick"
              />
            </div>
          </template>

          <!-- Achievements -->
          <template #achievements>
            <div class="flex-1 overflow-y-auto p-4 min-h-0">
              <div class="space-y-6">
                <!-- XP and Level Card -->
                <UCard>
                  <template #header>
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-zap" class="size-6 text-white" />
                      </div>
                      <div>
                        <h3 class="text-lg font-bold text-white">Level {{ gamification.gameState.value.level }}</h3>
                        <p class="text-xs text-gray-400">{{ gamification.gameState.value.xp }} XP</p>
                      </div>
                    </div>
                  </template>

                  <div class="space-y-3">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-400">Progress to Level {{ gamification.gameState.value.level + 1 }}</span>
                      <span class="text-white font-semibold">{{ gamification.gameState.value.xp % 100 }}/100 XP</span>
                    </div>
                    <UProgress
                      :model-value="(gamification.gameState.value.xp % 100)"
                      color="warning"
                      size="md"
                    />
                  </div>
                </UCard>

                <!-- Streak Card -->
                <UCard>
                  <template #header>
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-flame" class="size-6 text-white" />
                      </div>
                      <div>
                        <h3 class="text-lg font-bold text-white">Current Streak</h3>
                        <p class="text-xs text-gray-400">Days in a row</p>
                      </div>
                    </div>
                  </template>

                  <div class="text-center py-4">
                    <p class="text-5xl font-bold text-orange-400 mb-2">{{ gamification.gameState.value.currentStreak }}</p>
                    <p class="text-sm text-gray-400">{{ gamification.gameState.value.currentStreak === 1 ? 'day' : 'days' }}</p>
                  </div>
                </UCard>

                <!-- Badges Card -->
                <UCard>
                  <template #header>
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-award" class="size-6 text-white" />
                      </div>
                      <div>
                        <h3 class="text-lg font-bold text-white">Badges Earned</h3>
                        <p class="text-xs text-gray-400">{{ gamification.gameState.value.badges.length }} total</p>
                      </div>
                    </div>
                  </template>

                  <div v-if="gamification.gameState.value.badges.length === 0" class="text-center py-8 text-gray-400">
                    <UIcon name="i-lucide-medal" class="size-16 mb-2 mx-auto" />
                    <p class="text-sm">No badges yet. Keep learning to earn your first badge!</p>
                  </div>

                  <div v-else class="grid grid-cols-3 gap-3">
                    <div
                      v-for="badge in gamification.gameState.value.badges"
                      :key="badge"
                      class="flex flex-col items-center p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg"
                    >
                      <UIcon name="i-lucide-award" class="size-8 text-purple-400 mb-2" />
                      <p class="text-xs text-center text-gray-300 font-semibold">{{ badge }}</p>
                    </div>
                  </div>
                </UCard>

                <!-- Stats Card -->
                <UCard>
                  <template #header>
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-lucide-chart-line" class="size-6 text-white" />
                      </div>
                      <div>
                        <h3 class="text-lg font-bold text-white">Quick Stats</h3>
                        <p class="text-xs text-gray-400">Your learning summary</p>
                      </div>
                    </div>
                  </template>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="text-center p-3 bg-gray-800/50 rounded-lg">
                      <p class="text-2xl font-bold text-green-400 mb-1">
                        {{ gamification.gameState.value.xp }}
                      </p>
                      <p class="text-xs text-gray-400">Total XP</p>
                    </div>
                    <div class="text-center p-3 bg-gray-800/50 rounded-lg">
                      <p class="text-2xl font-bold text-purple-400 mb-1">
                        {{ gamification.gameState.value.level }}
                      </p>
                      <p class="text-xs text-gray-400">Level</p>
                    </div>
                  </div>
                </UCard>
              </div>
            </div>
          </template>
        </UTabs>
      </div>
    </template>

    <!-- Topic Detail Modal - rendered outside slideover to ensure proper z-index -->
  </USlideover>

  <!-- Topic Detail Modal - must be outside slideover for proper z-index -->
  <TopicDetailModal
    :topic-id="selectedTopicId"
    :user-id="userId"
    :session-id="sessionId"
    @close="handleCloseModal"
    @start-learning="handleStartLearning"
  />
</template>

<style scoped>
.kg-sidebar {
  max-width: min(90vw, 800px);
}

/* Black and hot pink theme - using proper Nuxt UI classes */
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

:deep([data-slot="content"]) {
  background: #000000 !important;
}

:deep([data-slot="body"]) {
  background: #000000 !important;
}

/* Tab styling - hot pink active state */
:deep(.u-tabs-list) {
  border-bottom-color: rgba(236, 72, 153, 0.2);
}

:deep(.u-tabs-trigger[data-state="active"]) {
  color: #ec4899;
  border-bottom-color: #ec4899;
}

:deep(.u-tabs-trigger:hover) {
  color: #ec4899;
}

/* Custom scrollbar for achievements section - hot pink */
.kg-sidebar :deep(.overflow-auto)::-webkit-scrollbar {
  width: 8px;
}

.kg-sidebar :deep(.overflow-auto)::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.kg-sidebar :deep(.overflow-auto)::-webkit-scrollbar-thumb {
  background: rgba(236, 72, 153, 0.5);
  border-radius: 4px;
}

.kg-sidebar :deep(.overflow-auto)::-webkit-scrollbar-thumb:hover {
  background: rgba(236, 72, 153, 0.7);
}
</style>

