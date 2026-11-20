import pb from '@/lib/pocketbase/client'
import type {
  BaseRecord,
  BusinessSettings,
  Customer,
  FinancialEntry,
  MenuItem,
  Promotion,
  ServiceRate,
} from '@/types'

interface ListOptions {
  sort?: string
  filter?: string
  expand?: string
}

export async function listRecords<T extends BaseRecord>(
  collection: string,
  options: ListOptions = {},
) {
  const records = await pb.collection(collection).getFullList({
    sort: options.sort,
    filter: options.filter,
    expand: options.expand,
  })
  return records as unknown as T[]
}

export async function createRecord<T extends BaseRecord>(
  collection: string,
  data: Record<string, unknown> | FormData,
) {
  const record = await pb.collection(collection).create(data)
  return record as unknown as T
}

export async function updateRecord<T extends BaseRecord>(
  collection: string,
  id: string,
  data: Record<string, unknown> | FormData,
) {
  const record = await pb.collection(collection).update(id, data)
  return record as unknown as T
}

export async function deleteRecord(collection: string, id: string) {
  await pb.collection(collection).delete(id)
}

export async function getBusinessSettings() {
  const records = await listRecords<BusinessSettings>('settings', { filter: 'key = "main"' })
  return records[0] ?? null
}

export async function getPublicMenu() {
  return listRecords<MenuItem>('menu_items', { filter: 'active = true', sort: 'category,name' })
}

export async function getActivePromotions() {
  return listRecords<Promotion>('promotions', { filter: 'active = true', sort: '-promotion_date' })
}

export async function getServiceRates() {
  return listRecords<ServiceRate>('service_rates', { filter: 'active = true', sort: 'type,price' })
}

export async function findCustomerByCpf(cpf: string) {
  const customers = await listRecords<Customer>('customers')
  return (
    customers.find((customer) => customer.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')) ?? null
  )
}

export async function findUserByCpf(cpf: string) {
  const users = await listRecords<import('@/types').AuthUser>('users')
  return users.find((user) => user.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')) ?? null
}

export async function recordFinancialEntry(data: Omit<FinancialEntry, keyof BaseRecord>) {
  return createRecord<FinancialEntry>(
    'financial_entries',
    data as unknown as Record<string, unknown>,
  )
}

export function getFileUrl(record: BaseRecord, filename?: string, thumb?: string) {
  if (!filename) return ''
  return pb.files.getURL(record as never, filename, thumb ? { thumb } : undefined)
}

export function formatCurrency(value: number | string | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value) || 0,
  )
}

export function formatDate(value?: string, includeTime = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(
    'pt-BR',
    includeTime
      ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' },
  ).format(date)
}

export function startOfTodayIso() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function normalizeCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}
