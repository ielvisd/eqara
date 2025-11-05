<script setup lang="ts">
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge } from '@vue-flow/core'

const props = defineProps<{
  userId?: string
  sessionId?: string
}>()

const emit = defineEmits<{
  nodeClick: [nodeId: string, nodeData: any]
}>()

const kgViz = useKGVisualization()
// Use shallowRef for large arrays (Vue 3 best practice - prevents deep reactivity)
const nodes = shallowRef<Node[]>([])
const edges = shallowRef<Edge[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Component-level state tracking
const isInitialized = ref(false)
const lastProps = ref<{ userId?: string; sessionId?: string } | null>(null)

// Initialize Vue Flow
const { fitView, zoomTo } = useVueFlow()

// Check if props actually changed
const propsChanged = computed(() => {
  if (!lastProps.value) return true
  return lastProps.value.userId !== props.userId || lastProps.value.sessionId !== props.sessionId
})

// Load KG data
const loadKGData = async () => {
  // Skip if already initialized and props haven't changed
  if (isInitialized.value && !propsChanged.value) {
    // Check cache synchronously first
    if (kgViz.isCached(props.userId, props.sessionId)) {
      console.log('⚡ KnowledgeGraphFlow: Data already loaded and cached, skipping reload', {
        userId: props.userId,
        sessionId: props.sessionId,
        timestamp: new Date().toISOString()
      })
      return
    }
  }
  
  const startTime = performance.now()
  console.log('🔄 KnowledgeGraphFlow: Starting to load KG data...', {
    userId: props.userId,
    sessionId: props.sessionId,
    isInitialized: isInitialized.value,
    propsChanged: propsChanged.value,
    timestamp: new Date().toISOString()
  })
  
  loading.value = true
  error.value = null
  
  try {
    const data = await kgViz.buildVueFlowData(props.userId, props.sessionId)
    nodes.value = data.nodes
    edges.value = data.edges
    
    // Mark as initialized and save current props
    isInitialized.value = true
    lastProps.value = { userId: props.userId, sessionId: props.sessionId }
    
    const loadDuration = performance.now() - startTime
    console.log('✅ KnowledgeGraphFlow: KG data loaded successfully!', {
      nodesCount: nodes.value.length,
      edgesCount: edges.value.length,
      loadDuration: `${loadDuration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    })
    
    // Fit view after a short delay to ensure rendering
    await nextTick()
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 })
      const totalDuration = performance.now() - startTime
      console.log('✅ KnowledgeGraphFlow: Knowledge Graph fully rendered and ready!', {
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
    }, 100)
  } catch (e: any) {
    const loadDuration = performance.now() - startTime
    console.error('❌ KnowledgeGraphFlow: Error loading KG data:', {
      error: e,
      loadDuration: `${loadDuration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    })
    error.value = e.message || 'Failed to load Knowledge Graph'
  } finally {
    loading.value = false
  }
}

// Handle node click
const onNodeClick = ({ node }: { node: Node }) => {
  console.log('🎯 KnowledgeGraphFlow: Node clicked in VueFlow:', { 
    nodeId: node.id, 
    nodeData: node.data,
    timestamp: new Date().toISOString()
  })
  emit('nodeClick', node.id, node.data)
  console.log('📤 KnowledgeGraphFlow: Event emitted')
}

// Handle node double click - zoom to node
const onNodeDoubleClick = ({ node }: { node: Node }) => {
  const { x, y } = node.position
  zoomTo(1.5, { duration: 300 })
  // Center on node
  fitView({ nodes: [node.id], duration: 300, padding: 0.5 })
}

// Reload data when props change (only if props actually changed)
watch(() => [props.userId, props.sessionId], () => {
  if (propsChanged.value) {
    loadKGData()
  }
}, { immediate: true })

// Manual refresh
const refresh = () => {
  // Clear cache to force reload
  kgViz.clearCache(props.userId, props.sessionId)
  // Reset initialization state to force reload
  isInitialized.value = false
  lastProps.value = null
  loadKGData()
}

// Expose refresh method
defineExpose({ refresh })
</script>

<template>
  <div class="kg-flow-container relative" style="width: 100%; height: 100%;">
    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
      <div class="text-center">
        <UIcon name="i-lucide-loader-2" class="size-12 text-pink-500 animate-spin mb-4" />
        <p class="text-white text-lg">Loading Knowledge Graph...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="absolute inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <UCard class="max-w-md">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-alert-circle" class="size-6 text-red-500" />
            <h3 class="text-lg font-bold">Error Loading Graph</h3>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-gray-400">{{ error }}</p>
          <div v-if="nodes.length === 0 && !loading" class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p class="text-sm text-blue-300 mb-2">💡 No topics found in database</p>
            <p class="text-xs text-gray-400">
              Run the seed script in Supabase SQL Editor:<br>
              <code class="text-pink-400">server/utils/seed-ccat-topics.sql</code>
            </p>
          </div>
        </div>

        <template #footer>
          <UButton color="primary" @click="loadKGData">
            Try Again
          </UButton>
        </template>
      </UCard>
    </div>

    <!-- Empty State (No Topics) -->
    <div v-else-if="!loading && nodes.length === 0" class="absolute inset-0 flex items-center justify-center p-4">
      <div class="text-center max-w-md">
        <UIcon name="i-lucide-database" class="size-20 text-gray-600 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-white mb-2">No Topics Yet</h3>
        <p class="text-gray-400 mb-4">
          Your Knowledge Graph is empty. Seed your database with topics to get started.
        </p>
        <div class="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left">
          <p class="text-sm font-semibold text-blue-300 mb-2">📝 Setup Instructions:</p>
          <ol class="text-xs text-gray-400 space-y-1 list-decimal list-inside">
            <li>Go to Supabase Dashboard → SQL Editor</li>
            <li>Open <code class="text-pink-400">server/utils/seed-ccat-topics.sql</code></li>
            <li>Copy and run the entire script</li>
            <li>Click the refresh button above</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Vue Flow -->
    <VueFlow
      v-else-if="!loading && nodes.length > 0"
      :nodes="nodes"
      :edges="edges"
      :fit-view-on-init="true"
      :min-zoom="0.1"
      :max-zoom="4"
      class="vue-flow-dark"
      style="width: 100%; height: 100%;"
      @node-click="onNodeClick"
      @node-double-click="onNodeDoubleClick"
    >
      <!-- Background Pattern -->
      <Background
        pattern-color="#374151"
        :gap="16"
        :size="1"
        variant="dots"
      />

      <!-- Controls (Zoom, Fit View, etc.) -->
      <Controls
        :show-zoom="true"
        :show-fit-view="true"
        :show-interactive="true"
        position="bottom-right"
      />

      <!-- Mini Map -->
      <MiniMap
        :node-color="(node: any) => node.data?.color || '#6b7280'"
        :node-stroke-width="3"
        position="bottom-left"
        pannable
        zoomable
      />

      <!-- Legend Panel -->
      <Panel position="top-left" class="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <h4 class="text-white font-bold text-sm mb-3">Legend</h4>
        <div class="space-y-2 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded" style="background-color: #10b981;"></div>
            <span class="text-gray-300">Mastered (100%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded" style="background-color: #06b6d4;"></div>
            <span class="text-gray-300">Near Mastery (80-99%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-yellow-500"></div>
            <span class="text-gray-300">In Progress (1-79%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-pink-500 border-2 border-pink-400"></div>
            <span class="text-gray-300">Knowledge Frontier</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded bg-gray-600"></div>
            <span class="text-gray-300">Locked</span>
          </div>
        </div>
      </Panel>

      <!-- Instructions Panel -->
      <Panel position="top-right" class="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <div class="text-xs text-gray-300 space-y-1">
          <p><strong>Click</strong> node for details</p>
          <p><strong>Double-click</strong> to zoom</p>
          <p><strong>Drag</strong> to pan</p>
          <p><strong>Scroll</strong> to zoom</p>
        </div>
      </Panel>

      <!-- Custom Node Template (fallback) -->
      <template #node-custom="{ data }">
        <div class="px-4 py-2 rounded-lg shadow-lg text-center" :style="{ backgroundColor: data.color, color: '#ffffff' }">
          <div class="flex items-center justify-center gap-2 mb-1">
            <UIcon :name="data.icon" class="size-4" />
            <span class="font-bold text-sm">{{ data.label }}</span>
          </div>
          <div class="text-xs opacity-90">
            {{ data.mastery }}% mastery
          </div>
          <div v-if="data.isFrontier" class="text-xs mt-1 flex items-center justify-center gap-1">
            <UIcon name="i-lucide-sparkles" class="size-3" />
            <span>Frontier</span>
          </div>
        </div>
      </template>
    </VueFlow>
  </div>
</template>

<style scoped>
.kg-flow-container {
  background: linear-gradient(to bottom, #000000, #1a1a1a);
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

/* Vue Flow Dark Theme Overrides */
:deep(.vue-flow__node) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: nodeAppear 0.4s ease-out backwards;
}

@keyframes nodeAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

:deep(.vue-flow__node:hover) {
  transform: scale(1.08);
  box-shadow: 0 12px 24px rgba(236, 72, 153, 0.4);
  z-index: 10;
}

:deep(.vue-flow__node:active) {
  transform: scale(1.02);
  transition: all 0.1s ease;
}

:deep(.vue-flow__edge-path) {
  transition: stroke 0.3s ease, stroke-width 0.3s ease;
}

:deep(.vue-flow__edge) {
  animation: edgeAppear 0.6s ease-out backwards;
}

@keyframes edgeAppear {
  from {
    opacity: 0;
    stroke-dashoffset: 100;
  }
  to {
    opacity: 1;
    stroke-dashoffset: 0;
  }
}

:deep(.vue-flow__edge:hover .vue-flow__edge-path) {
  stroke: #ec4899 !important;
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.6));
}

:deep(.vue-flow__minimap) {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #374151;
  transition: all 0.3s ease;
  animation: slideInFromBottom 0.4s ease-out;
}

:deep(.vue-flow__minimap:hover) {
  border-color: #ec4899;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.vue-flow__controls) {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #374151;
  transition: all 0.3s ease;
  animation: slideInFromRight 0.4s ease-out;
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.vue-flow__controls:hover) {
  border-color: #ec4899;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
}

:deep(.vue-flow__controls-button) {
  background: transparent;
  border-bottom: 1px solid #374151;
  color: #fff;
  transition: all 0.2s ease;
}

:deep(.vue-flow__controls-button:hover) {
  background: #374151;
  color: #ec4899;
  transform: scale(1.05);
}
</style>

