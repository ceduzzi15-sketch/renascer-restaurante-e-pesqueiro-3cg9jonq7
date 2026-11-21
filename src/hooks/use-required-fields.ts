import { useEffect, useState } from 'react'
import { getRequiredFieldsConfig, type RequiredFieldKey } from '@/services/requiredFields'

const FIELDS: RequiredFieldKey[] = ['name', 'phone', 'cpf', 'email']

export function useRequiredFields() {
  const [required, setRequired] = useState<Record<RequiredFieldKey, boolean>>({
    name: true,
    phone: true,
    cpf: true,
    email: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getRequiredFieldsConfig()
      .then((rows) => {
        if (!mounted) return
        const row = rows[0]
        if (row) setRequired(row.required_fields as Record<RequiredFieldKey, boolean>)
      })
      .catch(() => undefined)
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  const fields = FIELDS.map((key) => ({
    key,
    required: required[key],
  }))

  return { required, fields, loading }
}
