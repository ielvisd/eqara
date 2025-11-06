export interface MasteryDashboardCacheEntry {
  domainMastery: any[]
  frontierTopics: any[]
  recentTopics: any[]
  lastFetched: number
  loading: boolean
}

export const useMasteryDashboardCache = () => {
  const cache = useState<Record<string, MasteryDashboardCacheEntry>>('mastery-dashboard-cache', () => ({}))

  const ensureEntry = (key: string): MasteryDashboardCacheEntry => {
    if (!cache.value[key]) {
      cache.value[key] = {
        domainMastery: [],
        frontierTopics: [],
        recentTopics: [],
        lastFetched: 0,
        loading: false
      }
    }

    return cache.value[key]
  }

  const clearEntry = (key: string) => {
    if (cache.value[key]) {
      delete cache.value[key]
    }
  }

  return {
    cache,
    ensureEntry,
    clearEntry
  }
}

