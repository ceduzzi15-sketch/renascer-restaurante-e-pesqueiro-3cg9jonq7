/**
 * Geração do BR Code "PIX Copia e Cola" (padrão EMV MPM do Banco Central).
 * 100% local — nenhum serviço externo é chamado.
 */

const ID_PAYLOAD_FORMAT = '00'
const ID_MERCHANT_ACCOUNT = '26'
const ID_MERCHANT_CATEGORY = '52'
const ID_CURRENCY = '53'
const ID_AMOUNT = '54'
const ID_COUNTRY = '58'
const ID_MERCHANT_NAME = '59'
const ID_MERCHANT_CITY = '60'
const ID_ADDITIONAL_DATA = '62'
const ID_CRC = '63'

function emvField(id: string, value: string): string {
  const size = value.length.toString().padStart(2, '0')
  return `${id}${size}${value}`
}

/** CRC16/CCITT-FALSE, polinômio 0x1021, inicial 0xFFFF — exigido pelo BR Code. */
export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function sanitize(value: string, maxLength: number): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, maxLength)
}

/** Sanitiza a chave PIX para o formato aceito no BR Code. */
function normalizePixKey(key: string): string {
  const raw = (key || '').trim()
  // Telefone: BR Code espera +55DDDNUMERO
  const digits = raw.replace(/\D/g, '')
  if (/^[@\w.-]+$/.test(raw) && raw.includes('@')) return raw // e-mail
  if (digits.length === 10 || digits.length === 11) return `+55${digits}` // telefone
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) return raw
  return raw
}

export interface PixPayloadInput {
  pixKey: string
  merchantName: string
  merchantCity: string
  amount: number
  reference?: string
}

/** Monta o payload EMV completo com CRC16 válido. */
export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  reference,
}: PixPayloadInput): string {
  const key = normalizePixKey(pixKey)
  if (!key) return ''

  const gui = emvField('00', 'BR.GOV.BCB.PIX')
  const keyField = emvField('01', key)

  const additionalData = emvField(
    '05',
    sanitize((reference || '***').replace(/\s+/g, '').toUpperCase(), 25) || '***',
  )

  let payload =
    emvField(ID_PAYLOAD_FORMAT, '01') +
    emvField(ID_MERCHANT_ACCOUNT, gui + keyField) +
    emvField(ID_MERCHANT_CATEGORY, '0000') +
    emvField(ID_CURRENCY, '986') +
    emvField(ID_AMOUNT, amount.toFixed(2)) +
    emvField(ID_COUNTRY, 'BR') +
    emvField(ID_MERCHANT_NAME, sanitize(merchantName || 'RENASCER', 25).toUpperCase()) +
    emvField(ID_MERCHANT_CITY, sanitize(merchantCity || 'AGUDOS', 15).toUpperCase()) +
    emvField(ID_ADDITIONAL_DATA, additionalData) +
    emvField(ID_CRC, '') // placeholder

  const checksum = crc16(payload)
  payload = payload.slice(0, -4) + checksum
  return payload
}
