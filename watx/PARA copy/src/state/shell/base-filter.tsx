import React, {createContext, useContext, useState} from 'react'

type ViewMode =
  | 'View official parties'
  | "View by 9th's"
  | 'Followed policies'

interface BaseFilterContextValue {
  selectedFilters: string[]
  activeFilters: string[]
  viewMode: ViewMode
  selectedState: string
  showCommunities: boolean
  setSelectedState: (state: string) => void
  setViewMode: (mode: ViewMode) => void
  setShowCommunities: (show: boolean) => void
  toggleFilter: (name: string) => void
  applyFilters: () => void
  removeActiveFilter: (name: string) => void
  resetFilters: () => void
}

const BaseFilterContext = createContext<BaseFilterContextValue | null>(null)

export function BaseFilterProvider({children}: {children: React.ReactNode}) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('View official parties')
  const [selectedState, setSelectedState] = useState<string>('None')
  const [showCommunities, setShowCommunities] = useState(true)

  const toggleFilter = (name: string) => {
    setSelectedFilters(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name],
    )
  }

  const applyFilters = () => {
    setActiveFilters(selectedFilters)
  }

  const removeActiveFilter = (name: string) => {
    setActiveFilters(prev => prev.filter(item => item !== name))
    setSelectedFilters(prev => prev.filter(item => item !== name))
  }

  const resetFilters = () => {
    setSelectedFilters([])
    setActiveFilters([])
    setViewMode('View official parties')
    setSelectedState('None')
    setShowCommunities(true)
  }

  const value = React.useMemo(
    () => ({
      selectedFilters,
      activeFilters,
      viewMode,
      selectedState,
      showCommunities,
      setSelectedState,
      setViewMode,
      setShowCommunities,
      toggleFilter,
      applyFilters,
      removeActiveFilter,
      resetFilters,
    }),
    [
      selectedFilters,
      activeFilters,
      viewMode,
      selectedState,
      showCommunities,
      setSelectedState,
      setViewMode,
      setShowCommunities,
      toggleFilter,
      applyFilters,
      removeActiveFilter,
      resetFilters,
    ],
  )

  return (
    <BaseFilterContext.Provider value={value}>
      {children}
    </BaseFilterContext.Provider>
  )
}

export function useBaseFilter() {
  const ctx = useContext(BaseFilterContext)
  if (!ctx) {
    throw new Error('useBaseFilter must be used within a BaseFilterProvider')
  }
  return ctx
}
