import type { BaseRecord } from '@/types'
import { createRecord, listRecords, updateRecord } from '@/services/api'

export type RequiredFieldKey = 'name' | 'phone' | 'cpf' | 'email'

export interface RequiredFieldsConfig extends BaseRecord {
  required_fields: Record<RequiredFieldKey, boolean>
}

export const REQUIRED_FIELD_LABELS: Record<RequiredFieldKey, string> = {
  name: 'Nome completo',
  phone: 'Telefone',
  cpf: 'CPF',
  email: 'E-mail',
}

export async function getRequiredFieldsConfig() {
  return listRecords<RequiredFieldsConfig>('required_fields_config', { perPage: 1 })
}

export async function createRequiredFieldsConfig(
  required_fields: Record<RequiredFieldKey, boolean>,
) {
  return createRecord<RequiredFieldsConfig>('required_fields_config', { required_fields })
}

export async function updateRequiredFieldsConfig(
  id: string,
  required_fields: Record<RequiredFieldKey, boolean>,
) {
  return updateRecord<RequiredFieldsConfig>('required_fields_config', id, { required_fields })
}
