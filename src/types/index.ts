export type UserRole = 'gestor' | 'atendimento' | 'cliente'

export interface BaseRecord {
  id: string
  created: string
  updated: string
  collectionId?: string
  collectionName?: string
}

export interface AuthUser extends BaseRecord {
  email: string
  name: string
  role: UserRole
  phone: string
  cpf: string
  avatar?: string
}

export interface BusinessSettings extends BaseRecord {
  key: string
  business_name: string
  tagline: string
  contact_phone: string
  pix_key: string
  map_query: string
  bank_name: string
  bank_agency: string
  bank_account: string
  commission_percent: number
}

export type MenuCategory = 'comida' | 'porcao' | 'bebida'

export interface MenuCategoryRecord extends BaseRecord {
  category_id: string
  name: string
  subtitle?: string
  order?: number
  item_count?: number
  art_svg?: string
  art_png?: string
}

export interface MenuItem extends BaseRecord {
  name: string
  description: string
  category: MenuCategory
  price: number
  image?: string
  image_url?: string
  active: boolean
  categoria_id?: string
  category_name?: string
  subcategoria?: string
  observacao?: string
  ordem?: number
  categoria_ordem?: number
  preco_formatado?: string
}

export interface Customer extends BaseRecord {
  user?: string
  name: string
  phone: string
  cpf: string
  notes: string
  total_spent: number
  last_visit?: string
}

export type TabStatus = 'aberta' | 'aguardando_pagamento' | 'paga' | 'fechada'

export interface CustomerTab extends BaseRecord {
  customer?: string
  customer_user?: string
  customer_name: string
  phone: string
  cpf: string
  table_label: string
  status: TabStatus
  total: number
  payment_method?: 'pix' | 'dinheiro' | 'cartao'
  pix_status?: 'pendente' | 'confirmado'
  attendant?: string
  attendant_name: string
  opened_at: string
  closed_at?: string
}

export interface TabItem extends BaseRecord {
  tab: string
  menu_item?: string
  item_name: string
  unit_price: number
  quantity: number
  subtotal: number
  status: 'solicitado' | 'preparo' | 'entregue' | 'cancelado'
  notes?: string
  ordered_by?: string
  commission_amount: number
}

export interface ServiceRate extends BaseRecord {
  name: string
  type: 'pesca' | 'locacao'
  description: string
  price: number
  duration: string
  active: boolean
}

export interface Activity extends BaseRecord {
  type: 'pesca' | 'locacao'
  rate?: string
  customer?: string
  customer_user?: string
  customer_name: string
  item_name: string
  amount: number
  start_at: string
  end_at?: string
  status: 'reservada' | 'em_andamento' | 'concluida' | 'cancelada'
  notes: string
}

export interface ParkingReservation extends BaseRecord {
  spot: string
  vehicle: string
  plate: string
  customer?: string
  customer_user?: string
  customer_name: string
  start_at: string
  end_at?: string
  status: 'reservada' | 'ocupada' | 'liberada' | 'cancelada'
}

export interface Visit extends BaseRecord {
  customer?: string
  customer_name: string
  phone: string
  cpf: string
  purpose: 'restaurante' | 'pesca' | 'locacao' | 'visita'
  checked_in_at: string
  checked_out_at?: string
}

export interface FinancialEntry extends BaseRecord {
  type: 'entrada' | 'saida'
  category:
    | 'restaurante'
    | 'pesca'
    | 'locacao'
    | 'estacionamento'
    | 'fornecedor'
    | 'manutencao'
    | 'outros'
  description: string
  amount: number
  entry_date: string
  source_type?: 'manual' | 'comanda' | 'atividade'
  source_id?: string
  registered_by?: string
}

export interface GalleryMedia extends BaseRecord {
  type: 'foto' | 'video'
  file: string
  caption?: string
  order?: number
  featured?: boolean
}

export interface Review extends BaseRecord {
  user: string
  customer_name: string
  rating: number
  suggestion: string
  photos: string[]
  approved: boolean
}

export interface Promotion extends BaseRecord {
  title: string
  text: string
  promotion_date: string
  destination: 'whatsapp' | 'instagram' | 'facebook' | 'todos'
  image?: string
  active: boolean
}
