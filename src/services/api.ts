import pbClient from '@/lib/pocketbase/client'
import type { BaseRecord } from '@/types'

export const pb = pbClient

function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '')
}

/** Formata como (DD) NNNNN-NNNN a partir dos dígitos digitados. */
export function normalizePhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Formata como 000.000.000-00 a partir dos dígitos digitados. */
export function normalizeCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** ISO da meia-noite local de hoje (início do dia no fuso do dispositivo). */
export function startOfTodayIso(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

export interface ListOptions {
  filter?: string
  sort?: string
  expand?: string
  page?: number
  perPage?: number
}

export async function listRecords<T extends BaseRecord>(
  collection: string,
  options: ListOptions = {},
): Promise<T[]> {
  const perPage = options.perPage ?? 200
  const records: T[] = []
  let page = options.page ?? 1
  // paginação defensiva: algumas listas podem passar de 200 registros
  for (let guard = 0; guard < 20; guard++) {
    const result = await pb.collection(collection).getList<T>(page, perPage, {
      filter: options.filter,
      sort: options.sort,
      expand: options.expand,
    })
    records.push(...result.items)
    if (result.items.length < perPage) break
    page += 1
  }
  return records
}

export async function createRecord<T extends BaseRecord>(
  collection: string,
  data: Record<string, unknown> | FormData,
): Promise<T> {
  return pb.collection(collection).create<T>(data)
}

export async function updateRecord<T extends BaseRecord>(
  collection: string,
  id: string,
  data: Record<string, unknown> | FormData,
): Promise<T> {
  return pb.collection(collection).update<T>(id, data)
}

export async function deleteRecord(collection: string, id: string): Promise<void> {
  await pb.collection(collection).delete(id)
}

export function getFileUrl(
  record: { id: string; collectionId?: string; collectionName?: string },
  filename: string,
  thumb?: string,
): string {
  return pb.files.getURL(record, filename, { thumb })
}

export function formatCurrency(value?: number | null): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

export function formatDate(value?: string | null, withTime = false): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export async function getBusinessSettings() {
  const rows = await listRecords<import('@/types').BusinessSettings>('settings', {
    sort: '-created',
    perPage: 1,
  })
  return rows[0] ?? null
}

export async function getMenuCategories() {
  return listRecords<import('@/types').MenuCategoryRecord>('menu_categories', {
    sort: 'order,name',
  })
}

export async function getPublicMenu() {
  return listRecords<import('@/types').MenuItem>('menu_items', {
    filter: 'active = true',
    sort: 'categoria_ordem,ordem,category,name',
  })
}

export async function getActivePromotions() {
  return listRecords<import('@/types').Promotion>('promotions', {
    filter: 'active = true',
    sort: '-promotion_date',
    perPage: 3,
  })
}

export async function getServiceRates() {
  return listRecords<import('@/types').ServiceRate>('service_rates', { sort: 'type,price' })
}

export async function findCustomerByCpf(cpf: string) {
  const rows = await listRecords<import('@/types').Customer>('customers', {
    filter: `cpf = "${cpf}"`,
    perPage: 1,
  })
  return rows[0] ?? null
}

export async function findUserByCpf(cpf: string) {
  const rows = await listRecords<import('@/types').AuthUser>('users', {
    filter: `cpf = "${cpf}"`,
    perPage: 1,
  })
  return rows[0] ?? null
}

export async function recordFinancialEntry(input: {
  type: 'entrada' | 'saida'
  category: import('@/types').FinancialEntry['category']
  description: string
  amount: number
  source_type: 'manual' | 'comanda' | 'atividade'
  source_id?: string
  registered_by?: string
}) {
  return createRecord<import('@/types').FinancialEntry>('financial_entries', {
    ...input,
    entry_date: new Date().toISOString(),
  })
}
