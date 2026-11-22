import { CheckCircle2, Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { buildPixPayload } from '@/lib/pix'

interface PixQrCodeProps {
  /** Chave PIX configurada no sistema (telefone, e-mail, CPF/CNPJ ou aleatória). */
  pixKey: string
  /** Nome do recebedor (máx. 25 caracteres no BR Code). */
  merchantName: string
  /** Cidade do recebedor (máx. 15 caracteres no BR Code). */
  merchantCity?: string
  /** Valor total da comanda embutido no QR. */
  amount: number
  /** Identificador curto da comanda (máx. 25 caracteres, sem espaços). */
  reference?: string
  /** Mostra o "PIX Copia e Cola" para copiar (padrão: true). */
  showCopyPaste?: boolean
  className?: string
}

/**
 * QR Code PIX dinâmico (BR Code EMV) com o valor da comanda embutido.
 * Gerado 100% no navegador a partir da chave PIX configurada — nenhum
 * serviço externo é chamado.
 */
export default function PixQrCode({
  pixKey,
  merchantName,
  merchantCity = 'SAO PAULO',
  amount,
  reference,
  showCopyPaste = true,
  className,
}: PixQrCodeProps) {
  const payload = buildPixPayload({ pixKey, merchantName, merchantCity, amount, reference })
  const hasPayload = payload.length > 0

  return (
    <div className={className}>
      {hasPayload ? (
        <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm">
          <QRCodeSVG
            value={payload}
            size={208}
            level="M"
            marginSize={1}
            aria-label={`QR Code PIX de ${amount.toFixed(2).replace('.', ',')}`}
          />
        </div>
      ) : (
        <p className="rounded-xl bg-amber-50 p-3 text-center text-xs text-amber-700">
          Configure a chave PIX no financeiro para gerar o QR Code.
        </p>
      )}
      {hasPayload && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Escaneie com o app do seu banco — o valor já vem preenchido.
        </p>
      )}
      {hasPayload && showCopyPaste && (
        <div className="mx-auto mt-3 flex max-w-sm items-center justify-between gap-3 rounded-xl border bg-white p-3">
          <span className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-muted-foreground">
            {payload}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            aria-label="Copiar código PIX"
            onClick={() => {
              void navigator.clipboard.writeText(payload)
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        PIX Copia e Cola com valor — confirme o recebimento com a equipe.
      </p>
    </div>
  )
}
