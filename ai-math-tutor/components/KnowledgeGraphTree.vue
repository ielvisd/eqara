<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui'

const props = defineProps<{
  userId?: string
  sessionId?: string
}>()

const emit = defineEmits<{
  topicClick: [topicId: string, topicData: any]
}>()

const kgViz = useKGVisualization()
// Use shallowRef for large array (Vue 3 best practice - prevents deep reactivity)
const treeItems = shallowRef<TreeItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedTopic = ref<string | null>(null)

// Component-level state tracking
const isInitialized = ref(false)
const lastProps = ref<{ userId?: string; sessionId?: string } | null>(null)

// Check if props actually changed
const propsChanged = computed(() => {
  if (!lastProps.value) return true
  return lastProps.value.userId !== props.userId || lastProps.value.sessionId !== props.sessionId
})

// Load tree data
const loadTreeData = async () => {
  // Skip if already initialized and props haven't changed
  if (isInitialized.value && !propsChanged.value) {
    // Check cache synchronously first
    if (kgViz.isCached(props.userId, props.sessionId)) {
      console.log('⚡ KnowledgeGraphTree: Data already loaded and cached, skipping reload', {
        userId: props.userId,
        sessionId: props.sessionId,
        timestamp: new Date().toISOString()
      })
      return
    }
  }
  
  const startTime = performance.now()
  console.log('🔄 KnowledgeGraphTree: Starting to load tree data...', {
    userId: props.userId,
    sessionId: props.sessionId,
    isInitialized: isInitialized.value,
    propsChanged: propsChanged.value,
    timestamp: new Date().toISOString()
  })
  
  loading.value = true
  error.value = null
  
  try {
    treeItems.value = await kgViz.buildTopicTree(props.userId, props.sessionId)
    
    // Mark as initialized and save current props
    isInitialized.value = true
    lastProps.value = { userId: props.userId, sessionId: props.sessionId }
    const loadDuration = performance.now() - startTime
    console.log('✅ KnowledgeGraphTree: Tree data loaded successfully!', {
      itemsCount: treeItems.value.length,
      loadDuration: `${loadDuration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (e: any) {
    const loadDuration = performance.now() - startTime
    console.error('❌ KnowledgeGraphTree: Error loading tree data:', {
      error: e,
      loadDuration: `${loadDuration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    })
    error.value = e.message || 'Failed to load topic tree'
  } finally {
    loading.value = false
  }
}

// Handle topic selection
const onSelect = (event: any) => {
  const item = event.detail?.value
  if (item?.data) {
    selectedTopic.value = item.data.id
    emit('topicClick', item.data.id, item.data)
  }
}

// Reload when props change (only if props actually changed)
watch(() => [props.userId, props.sessionId], () => {
  if (propsChanged.value) {
    loadTreeData()
  }
}, { immediate: true })

// Manual refresh
const refresh = () => {
  // Clear cache to force reload
  kgViz.clearCache(props.userId, props.sessionId)
  // Reset initialization state to force reload
  isInitialized.value = false
  lastProps.value = null
  loadTreeData()
}

// Expose refresh method
defineExpose({ refresh })
</script>

<template>
  <div class="kg-tree-container h-full w-full">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="size-8 text-pink-500 animate-spin mb-2" />
        <p class="text-sm text-gray-400">Loading topics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4">
      <UCard variant="soft">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-alert-circle" class="size-5 text-red-500" />
            <h4 class="font-bold text-sm">Error</h4>
          </div>
        </template>

        <p class="text-sm text-gray-400">{{ error }}</p>

        <template #footer>
          <UButton size="sm" color="primary" @click="loadTreeData">
            Retry
          </UButton>
        </template>
      </UCard>
    </div>

    <!-- Tree View -->
    <div v-else class="overflow-auto h-full">
      <!-- Empty State -->
      <div v-if="treeItems.length === 0" class="flex flex-col items-center justify-center py-12 px-4">
        <UIcon name="i-lucide-folder-open" class="size-16 text-gray-600 mb-4" />
        <h3 class="text-lg font-bold text-white mb-2">No Topics Yet</h3>
        <p class="text-sm text-gray-400 text-center">
          Topics will appear here once you start learning
        </p>
      </div>

      <!-- Tree -->
      <UTree
        v-else
        :items="treeItems"
        color="primary"
        size="md"
        :get-key="(item: TreeItem) => item.data?.id || item.label"
        @select="onSelect"
      >
        <!-- Custom item template with progress indicator -->
        <template #item-leading="{ item, selected }">
          <UIcon
            :name="item.icon"
            :class="[
              'size-5',
              selected ? 'text-pink-400' : item.class
            ]"
          />
        </template>

        <!-- Custom label with mastery indicator -->
        <template #item-label="{ item }">
          <div class="flex items-center justify-between w-full gap-2">
            <span :class="item.class">{{ item.label }}</span>
            <UBadge
              v-if="item.data?.mastery !== undefined"
              :color="
                item.data.mastery >= 100 ? 'success' :
                item.data.mastery > 0 ? 'warning' :
                'neutral'
              "
              size="xs"
              variant="subtle"
            >
              {{ item.data.mastery }}%
            </UBadge>
          </div>
        </template>

        <!-- Trailing icon for frontier topics -->
        <template #item-trailing="{ item }">
          <UIcon
            v-if="item.trailingIcon"
            :name="item.trailingIcon"
            class="size-4 text-pink-400 animate-pulse"
          />
        </template>
      </UTree>
    </div>
  </div>
</template>

<style scoped>
.kg-tree-container {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
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

/* Custom tree styling */
:deep(.text-green-400) {
  color: #10b981;
}

:deep(.text-yellow-400) {
  color: #f59e0b;
}

:deep(.text-pink-400) {
  color: #ec4899;
}

:deep(.text-gray-500) {
  color: #6b7280;
  opacity: 0.7;
}

/* Hover effects with smooth transition */
:deep(.u-tree-item) {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.u-tree-item:hover) {
  background: rgba(236, 72, 153, 0.15);
  transform: translateX(4px);
  border-left: 2px solid rgba(236, 72, 153, 0.5);
}

:deep(.u-tree-item:active) {
  transform: translateX(2px);
  background: rgba(236, 72, 153, 0.2);
}

/* Badge animation */
:deep(.u-badge) {
  animation: badgeAppear 0.4s ease-out backwards;
  transition: transform 0.2s ease;
}

@keyframes badgeAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

:deep(.u-tree-item:hover .u-badge) {
  transform: scale(1.1);
}

/* Icon animation */
:deep(.u-icon) {
  transition: transform 0.2s ease;
}

:deep(.u-tree-item:hover .u-icon) {
  transform: scale(1.15);
}

/* Expand/collapse animation */
:deep(.u-tree-item-expand) {
  transition: transform 0.3s ease;
}

:deep(.u-tree-item-expand[aria-expanded="true"]) {
  transform: rotate(90deg);
}
</style>

