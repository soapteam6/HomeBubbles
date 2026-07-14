import { getContext } from '@microsoft/power-apps/app'
import { useEffect, type ReactNode } from 'react'

interface PowerProviderProps {
  children: ReactNode
}

/**
 * Warms up the Power Platform host bridge on mount so the generated connector
 * services (e.g. PH_Users) can reach their data sources. In @microsoft/power-apps
 * the bridge initializes lazily on first use; calling getContext() here forces
 * that handshake early and surfaces any host/connection problems in the console.
 */
export default function PowerProvider({ children }: PowerProviderProps) {
  useEffect(() => {
    const initApp = async () => {
      try {
        const ctx = await getContext()
        console.log('Power Platform SDK initialized successfully', ctx?.user?.userPrincipalName ?? '')
      } catch (error) {
        console.error('Failed to initialize Power Platform SDK:', error)
      }
    }
    initApp()
  }, [])

  return <>{children}</>
}
