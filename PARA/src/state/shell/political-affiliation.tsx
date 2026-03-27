import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'para_political_affiliation'

type PoliticalAffiliationContextValue = {
  affiliation: string | null
  setAffiliation: (name: string | null) => Promise<void>
  isPublic: boolean
  setIsPublic: (isPublic: boolean) => Promise<void>
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
  const [isPublic, setIsPublicState] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAffiliation = async () => {
      try {
        const [storedAffiliation, storedIsPublic] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORAGE_KEY + '_is_public'),
        ])
        setAffiliationState(storedAffiliation)
        setIsPublicState(storedIsPublic === 'true')
      } catch (e) {
        console.error('Failed to load political affiliation', e)
      } finally {
        setIsLoading(false)
      }
    }
    void loadAffiliation()
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

  const setIsPublic = async (val: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY + '_is_public', val ? 'true' : 'false')
      setIsPublicState(val)
    } catch (e) {
      console.error('Failed to save public status', e)
    }
  }

  const value = useMemo(
    () => ({
      affiliation,
      setAffiliation,
      isPublic,
      setIsPublic,
      isLoading,
    }),
    [affiliation, isPublic, isLoading],
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
