import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  REQUIRED_FIELD_LABELS,
  createRequiredFieldsConfig,
  getRequiredFieldsConfig,
  updateRequiredFieldsConfig,
  type RequiredFieldKey,
} from '@/services/requiredFields'

const DESCRIPTIONS: Record<RequiredFieldKey, string> = {
  name: 'Cliente informa o nome ao criar conta e abrir comanda.',
  phone: 'Telefone com DDD para contato e confirmação.',
  cpf: 'CPF completo (11 dígitos), usado para identificar a comanda.',
  email: 'E-mail válido, também usado como login.',
}

const DEFAULT_CONFIG: Record<RequiredFieldKey, boolean> = {
  name: true,
  phone: true,
  cpf: true,
  email: false,
}

export default function RequiredFieldsPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<Record<RequiredFieldKey, boolean>>(DEFAULT_CONFIG)
  const [configId, setConfigId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getRequiredFieldsConfig()
      .then((rows) => {
        if (!mounted) return
        const row = rows[0]
        if (row) {
          setConfigId(row.id)
          setConfig({ ...DEFAULT_CONFIG, ...(row.required_fields ?? {}) })
        }
      })
      .catch(() =>
        toast({
          variant: 'destructive',
          title: 'Não foi possível carregar a configuração',
          description: 'Usando os campos padrão até tentar novamente.',
        }),
      )
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [toast])

  const toggle = (key: RequiredFieldKey, checked: boolean) =>
    setConfig((current) => ({ ...current, [key]: checked }))

  const save = async () => {
    setSaving(true)
    try {
      if (configId) {
        await updateRequiredFieldsConfig(configId, config)
      } else {
        const created = await createRequiredFieldsConfig(config)
        setConfigId(created.id)
      }
      toast({
        title: 'Configuração salva',
        description: 'Os formulários de cadastro e comanda já seguem a nova regra.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-shell space-y-7">
      <header>
        <p className="eyebrow mb-2">Cadastro & comandas</p>
        <h1 className="page-heading">Informações obrigatórias</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Escolha quais dados o cliente precisa preencher para criar o cadastro e abrir a comanda. A
          regra vale para o site e para o painel de atendimento.
        </p>
      </header>

      <section className="soft-card max-w-3xl p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-sans text-lg font-bold tracking-normal">Campos exigidos</h2>
            <p className="text-sm text-muted-foreground">
              Ative apenas o que a equipe realmente precisa.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {(Object.keys(REQUIRED_FIELD_LABELS) as RequiredFieldKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold">{REQUIRED_FIELD_LABELS[key]}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{DESCRIPTIONS[key]}</p>
                </div>
                <Switch
                  checked={config[key]}
                  onCheckedChange={(checked) => toggle(key, checked)}
                  aria-label={`Exigir ${REQUIRED_FIELD_LABELS[key]}`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={() => void save()} disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </Button>
        </div>
      </section>
    </div>
  )
}
