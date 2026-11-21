import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SITE_CONTENT, getSiteContent } from '@/services/siteContent'
import type { SiteContent } from '@/types'

/** Conteúdo da landing com os textos atuais como fallback — nunca nulo. */
export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(
    DEFAULT_SITE_CONTENT as unknown as SiteContent,
  )
  const [record, setRecord] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getSiteContent()
      setRecord(data)
      if (data) {
        // Só campos preenchidos substituem o padrão — imagem removida volta ao padrão.
        setContent({ ...(DEFAULT_SITE_CONTENT as unknown as SiteContent), ...clean(data) })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const listener = () => void refresh()
    window.addEventListener('site-content-updated', listener)
    return () => window.removeEventListener('site-content-updated', listener)
  }, [refresh])

  return { content, record, loading, refresh }
}

/** Descarta campos vazios do registro para que "limpar no painel" restaure o padrão. */
function clean(data: SiteContent): Partial<SiteContent> {
  const result: Partial<SiteContent> = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.trim() === '') continue
    ;(result as Record<string, unknown>)[key] = value
  }
  return result
}
