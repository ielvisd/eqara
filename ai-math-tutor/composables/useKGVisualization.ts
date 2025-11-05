// Knowledge Graph Visualization composable
// Transforms KG data into formats suitable for Vue Flow and UTree

import type { Node, Edge, Position } from '@vue-flow/core'
import { MarkerType } from '@vue-flow/core'
import type { TreeItem } from '@nuxt/ui'
import type { Topic, StudentMastery } from './types'

export interface EnrichedTopic extends Topic {
  mastery: number
  masteryStatus: 'mastered' | 'in-progress' | 'locked' | 'frontier'
  isFrontier: boolean
  prerequisitesMet: boolean
}

export interface VueFlowData {
  nodes: Node[]
  edges: Edge[]
}

// Module-level singleton cache - shared across all component instances
const vueFlowDataCache = new Map<string, VueFlowData>()
const treeDataCache = new Map<string, TreeItem[]>()
const isLoading = ref(false)

// Cache key generator
const cacheKey = (userId?: string, sessionId?: string) => `${userId || 'no-user'}-${sessionId || 'no-session'}`

export const useKGVisualization = () => {
  const kg = useKnowledgeGraph()
  const mastery = useMastery()

  // Get mastery status based on percentage
  const getMasteryStatus = (
    masteryLevel: number,
    prerequisitesMet: boolean,
    isFrontier: boolean
  ): 'mastered' | 'in-progress' | 'locked' | 'frontier' => {
    if (masteryLevel >= 100) return 'mastered'
    if (isFrontier && prerequisitesMet) return 'frontier'
    if (!prerequisitesMet) return 'locked'
    if (masteryLevel > 0) return 'in-progress'
    return 'locked'
  }

  // Get color based on mastery status
  const getNodeColor = (status: EnrichedTopic['masteryStatus']): string => {
    switch (status) {
      case 'mastered':
        return '#10b981' // Green
      case 'in-progress':
        return '#f59e0b' // Yellow/Orange
      case 'frontier':
        return '#ec4899' // Pink
      case 'locked':
      default:
        return '#6b7280' // Gray
    }
  }

  // Get icon based on mastery status
  const getNodeIcon = (status: EnrichedTopic['masteryStatus']): string => {
    switch (status) {
      case 'mastered':
        return 'i-lucide-check-circle'
      case 'in-progress':
        return 'i-lucide-clock'
      case 'frontier':
        return 'i-lucide-star'
      case 'locked':
      default:
        return 'i-lucide-lock'
    }
  }

  // Enrich topics with mastery data
  const enrichTopicsWithMastery = async (
    topics: Topic[],
    userId?: string,
    sessionId?: string
  ): Promise<EnrichedTopic[]> => {
    const allMastery = await mastery.getAllMastery(userId, sessionId)
    const frontierTopics = await kg.getKnowledgeFrontier(userId, sessionId)
    
    const masteryMap = new Map<string, number>()
    allMastery.forEach((m) => {
      masteryMap.set(m.topic_id, m.mastery_level || 0)
    })

    const frontierSet = new Set(frontierTopics.map((t) => t.id))

    const enrichedTopics: EnrichedTopic[] = []

    for (const topic of topics) {
      const topicMastery = masteryMap.get(topic.id) || 0
      const isFrontier = frontierSet.has(topic.id)
      const prerequisitesMet = await mastery.arePrerequisitesMastered(topic.id, userId, sessionId)
      
      const masteryStatus = getMasteryStatus(topicMastery, prerequisitesMet, isFrontier)

      enrichedTopics.push({
        ...topic,
        mastery: topicMastery,
        masteryStatus,
        isFrontier,
        prerequisitesMet
      })
    }

    return enrichedTopics
  }

  // Build hierarchical tree structure for UTree
  const buildTopicTree = async (
    userId?: string,
    sessionId?: string,
    useCache = true
  ): Promise<TreeItem[]> => {
    const startTime = performance.now()
    const key = cacheKey(userId, sessionId)
    
    // Check cache first (synchronous check)
    if (useCache && treeDataCache.has(key)) {
      const cachedData = treeDataCache.get(key)!
      const cacheDuration = performance.now() - startTime
      console.log('⚡ useKGVisualization: Using cached tree data', {
        userId,
        sessionId,
        cacheKey: key,
        itemsCount: cachedData.length,
        cacheDuration: `${cacheDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
      return cachedData
    }
    
    console.log('🔄 useKGVisualization: Building topic tree...', {
      userId,
      sessionId,
      cacheKey: key,
      useCache,
      cacheHasKey: treeDataCache.has(key),
      cacheSize: treeDataCache.size,
      timestamp: new Date().toISOString()
    })
    
    const allTopics = await kg.getAllTopics()
    const enriched = await enrichTopicsWithMastery(allTopics, userId, sessionId)

    // Group by domain
    const domainGroups = new Map<string, EnrichedTopic[]>()
    enriched.forEach((topic) => {
      if (!domainGroups.has(topic.domain)) {
        domainGroups.set(topic.domain, [])
      }
      domainGroups.get(topic.domain)!.push(topic)
    })

    // Build tree structure
    const treeItems: TreeItem[] = []

    for (const [domain, topics] of domainGroups) {
      // Sort topics by difficulty
      const sortedTopics = topics.sort((a, b) => a.difficulty - b.difficulty)

      // Create domain node
      const domainNode: TreeItem = {
        label: domain.charAt(0).toUpperCase() + domain.slice(1).replace(/_/g, ' '),
        icon: getNodeIcon(
          sortedTopics.some((t) => t.masteryStatus === 'mastered')
            ? 'mastered'
            : sortedTopics.some((t) => t.masteryStatus === 'frontier')
            ? 'frontier'
            : 'locked'
        ),
        defaultExpanded: true,
        children: sortedTopics.map((topic) => ({
          label: topic.name,
          icon: getNodeIcon(topic.masteryStatus),
          trailingIcon: topic.isFrontier ? 'i-lucide-sparkles' : undefined,
          class: topic.masteryStatus === 'mastered' ? 'text-green-400' : 
                 topic.masteryStatus === 'frontier' ? 'text-pink-400' :
                 topic.masteryStatus === 'in-progress' ? 'text-yellow-400' : 
                 'text-gray-500',
          // Store topic data for click handlers
          data: topic
        }))
      }

      treeItems.push(domainNode)
    }

    // Cache the result
    treeDataCache.set(key, treeItems)
    
    const buildDuration = performance.now() - startTime
    console.log('✅ useKGVisualization: Topic tree built successfully!', {
      itemsCount: treeItems.length,
      buildDuration: `${buildDuration.toFixed(2)}ms`,
      savedToCache: true,
      timestamp: new Date().toISOString()
    })
    
    return treeItems
  }

  // Calculate hierarchical layout positions for Vue Flow
  const calculateHierarchicalLayout = (
    topics: EnrichedTopic[],
    prerequisites: Map<string, string[]>
  ): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>()
    const visited = new Set<string>()
    const levels = new Map<string, number>()

    // Calculate depth level for each topic
    const calculateLevel = (topicId: string, level: number = 0): number => {
      if (levels.has(topicId)) return levels.get(topicId)!
      
      const prereqs = prerequisites.get(topicId) || []
      if (prereqs.length === 0) {
        levels.set(topicId, 0)
        return 0
      }

      const maxPrereqLevel = Math.max(
        ...prereqs.map((prereqId) => calculateLevel(prereqId, level + 1))
      )
      const currentLevel = maxPrereqLevel + 1
      levels.set(topicId, currentLevel)
      return currentLevel
    }

    // Calculate levels for all topics
    topics.forEach((topic) => calculateLevel(topic.id))

    // Group topics by level
    const levelGroups = new Map<number, string[]>()
    levels.forEach((level, topicId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, [])
      }
      levelGroups.get(level)!.push(topicId)
    })

    // Position topics
    const xSpacing = 250
    const ySpacing = 150

    levelGroups.forEach((topicIds, level) => {
      const yPos = level * ySpacing
      const totalWidth = (topicIds.length - 1) * xSpacing
      const startX = -totalWidth / 2

      topicIds.forEach((topicId, index) => {
        positions.set(topicId, {
          x: startX + index * xSpacing,
          y: yPos
        })
      })
    })

    return positions
  }

  // Build Vue Flow nodes and edges
  const buildVueFlowData = async (
    userId?: string,
    sessionId?: string,
    useCache = true
  ): Promise<VueFlowData> => {
    const startTime = performance.now()
    const key = cacheKey(userId, sessionId)
    
    // Check cache first (synchronous check - returns immediately)
    if (useCache && vueFlowDataCache.has(key)) {
      const cachedData = vueFlowDataCache.get(key)!
      const cacheDuration = performance.now() - startTime
      console.log('⚡ useKGVisualization: Using cached Vue Flow data', {
        userId,
        sessionId,
        cacheKey: key,
        nodesCount: cachedData.nodes.length,
        edgesCount: cachedData.edges.length,
        cacheDuration: `${cacheDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
      return cachedData
    }
    
    console.log('🔄 useKGVisualization: Building Vue Flow data...', {
      userId,
      sessionId,
      cacheKey: key,
      useCache,
      cacheHasKey: vueFlowDataCache.has(key),
      cacheSize: vueFlowDataCache.size,
      timestamp: new Date().toISOString()
    })
    
    const allTopics = await kg.getAllTopics()
    const enriched = await enrichTopicsWithMastery(allTopics, userId, sessionId)

    // Build prerequisite map
    const prerequisitesMap = new Map<string, string[]>()
    for (const topic of allTopics) {
      const prereqs = await kg.getPrerequisites(topic.id)
      prerequisitesMap.set(
        topic.id,
        prereqs.map((p) => p.id)
      )
    }

    // Calculate positions
    const positions = calculateHierarchicalLayout(enriched, prerequisitesMap)

    // Build nodes
    const nodes: Node[] = enriched.map((topic) => {
      const position = positions.get(topic.id) || { x: 0, y: 0 }
      const color = getNodeColor(topic.masteryStatus)

      return {
        id: topic.id,
        type: 'custom',
        position,
        data: {
          label: topic.name,
          mastery: topic.mastery,
          status: topic.masteryStatus,
          isFrontier: topic.isFrontier,
          difficulty: topic.difficulty,
          domain: topic.domain,
          icon: getNodeIcon(topic.masteryStatus),
          color
        },
        style: {
          backgroundColor: color,
          color: '#ffffff',
          border: topic.isFrontier ? '3px solid #ec4899' : '2px solid #374151',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '150px',
          textAlign: 'center'
        }
      }
    })

    // Build edges
    const edges: Edge[] = []
    for (const [topicId, prereqIds] of prerequisitesMap) {
      prereqIds.forEach((prereqId) => {
        edges.push({
          id: `${prereqId}-${topicId}`,
          source: prereqId,
          target: topicId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#6b7280',
            strokeWidth: 2
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6b7280'
          }
        })
      })
    }

    const result = { nodes, edges }
    
    // Cache the result
    vueFlowDataCache.set(key, result)
    
    const buildDuration = performance.now() - startTime
    console.log('✅ useKGVisualization: Vue Flow data built successfully!', {
      nodesCount: nodes.length,
      edgesCount: edges.length,
      buildDuration: `${buildDuration.toFixed(2)}ms`,
      savedToCache: true,
      timestamp: new Date().toISOString()
    })
    
    return result
  }

  // Get frontier topics
  const getFrontierTopics = async (
    userId?: string,
    sessionId?: string
  ): Promise<EnrichedTopic[]> => {
    const frontierTopics = await kg.getKnowledgeFrontier(userId, sessionId)
    return await enrichTopicsWithMastery(frontierTopics, userId, sessionId)
  }

  // Preload knowledge graph data
  const preloadKGData = async (userId?: string, sessionId?: string) => {
    if (isLoading.value) {
      console.log('⏸️ useKGVisualization: Preload already in progress, skipping...')
      return // Already loading
    }
    
    const startTime = performance.now()
    const key = cacheKey(userId, sessionId)
    
    // Skip if already cached
    if (vueFlowDataCache.has(key) && treeDataCache.has(key)) {
      console.log('⚡ useKGVisualization: KG data already cached, skipping preload', {
        userId,
        sessionId,
        timestamp: new Date().toISOString()
      })
      return
    }
    
    console.log('🔄 useKGVisualization: Starting KG data preload...', {
      userId,
      sessionId,
      timestamp: new Date().toISOString()
    })
    
    isLoading.value = true
    try {
      // Preload both graph and tree data in parallel
      await Promise.all([
        buildVueFlowData(userId, sessionId, false),
        buildTopicTree(userId, sessionId, false)
      ])
      const preloadDuration = performance.now() - startTime
      console.log('✅ useKGVisualization: KG data preload completed!', {
        preloadDuration: `${preloadDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      const preloadDuration = performance.now() - startTime
      console.error('❌ useKGVisualization: Error preloading KG data:', {
        error,
        preloadDuration: `${preloadDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
    } finally {
      isLoading.value = false
    }
  }

  // Clear cache (useful for refreshing)
  const clearCache = (userId?: string, sessionId?: string) => {
    if (userId || sessionId) {
      const key = cacheKey(userId, sessionId)
      vueFlowDataCache.delete(key)
      treeDataCache.delete(key)
    } else {
      vueFlowDataCache.clear()
      treeDataCache.clear()
    }
  }

  // Check if data is cached (synchronous check)
  const isCached = (userId?: string, sessionId?: string): boolean => {
    const key = cacheKey(userId, sessionId)
    return vueFlowDataCache.has(key) && treeDataCache.has(key)
  }

  return {
    enrichTopicsWithMastery,
    buildTopicTree,
    buildVueFlowData,
    getFrontierTopics,
    getMasteryStatus,
    getNodeColor,
    getNodeIcon,
    preloadKGData,
    clearCache,
    isCached,
    isLoading: readonly(isLoading)
  }
}

