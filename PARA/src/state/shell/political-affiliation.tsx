import React, {createContext, useContext, useEffect, useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'para_political_affiliation'

type PoliticalAffiliationContextValue = {
  affiliation: string | null
  setAffiliation: (name: string | null) => Promise<void>
  isLoading: boolean
}

const PoliticalAffiliationContext =
  createContext<PoliticalAffiliationContextValue | null>(null)

export function PoliticalAffiliationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [affiliation, setAffiliationState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAffiliation = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        setAffiliationState(stored)
      } catch (e) {
        console.error('Failed to load political affiliation', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadAffiliation()
  }, [])

  const setAffiliation = async (name: string | null) => {
    try {
      if (name === null) {
        await AsyncStorage.removeItem(STORAGE_KEY)
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, name)
      }
      setAffiliationState(name)
    } catch (e) {
      console.error('Failed to save political affiliation', e)
    }
  }

  const value = React.useMemo(
    () => ({
      affiliation,
      setAffiliation,
      isLoading,
    }),
    [affiliation, isLoading],
  )

  return (
    <PoliticalAffiliationContext.Provider value={value}>
      {children}
    </PoliticalAffiliationContext.Provider>
  )
}

export function usePoliticalAffiliation() {
  const ctx = useContext(PoliticalAffiliationContext)
  if (!ctx) {
    throw new Error(
      'usePoliticalAffiliation must be used within a PoliticalAffiliationProvider',
    )
  }
  return ctx
}
