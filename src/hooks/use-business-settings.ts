import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_BUSINESS } from '@/lib/assets'
import { getBusinessSettings } from '@/services/api'
import type { BusinessSettings } from '@/types'

const fallback = DEFAULT_BUSINESS as unknown as BusinessSettings

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings>(fallback)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getBusinessSettings()
      if (data) setSettings(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const listener = () => void refresh()
    window.addEventListener('business-settings-updated', listener)
    return () => window.removeEventListener('business-settings-updated', listener)
  }, [refresh])

  return { settings, loading, refresh }
}
