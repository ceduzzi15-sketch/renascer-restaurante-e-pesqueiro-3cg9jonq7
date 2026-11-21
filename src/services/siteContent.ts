import { createRecord, getFileUrl, listRecords, updateRecord } from '@/services/api'
import type { SiteContent } from '@/types'

/**
 * Textos e imagens padrão da landing — exatamente os valores usados hoje
 * em Index.tsx. A landing só muda quando algo for salvo no painel.
 */
export const DEFAULT_SITE_CONTENT: Omit<SiteContent, keyof import('@/types').BaseRecord> = {
  hero_badge: 'Seu refúgio à beira do lago',
  hero_title: 'Onde a boa pesca encontra a boa mesa.',
  hero_subtitle: 'Boa pesca, comida de verdade e momentos à beira do lago.',
  hero_cta_primary: 'Conheça nosso cardápio',
  hero_cta_secondary: 'Fale conosco',
  strip_1_title: 'Aberto hoje',
  strip_1_text: '07h às 20h',
  strip_2_title: 'Natureza por perto',
  strip_2_text: 'Lago, pesca e descanso',
  strip_3_title: 'Cozinha da casa',
  strip_3_text: 'Sabor fresco todos os dias',
  about_eyebrow: 'Uma experiência completa',
  about_title: 'Pesca, sabores e histórias para guardar.',
  about_text:
    'Venha passar o dia cercado pela natureza. Prepare a vara, aproveite o lago e encerre o passeio com pratos preparados com cuidado pela nossa cozinha.',
  about_quote: 'Um dia leve, do jeito que a natureza pede.',
  feature_1_title: 'Pesca para todos',
  feature_1_text: 'Diárias e estrutura para aproveitar o lago.',
  feature_2_title: 'Comida de verdade',
  feature_2_text: 'Porções generosas e pratos feitos na hora.',
  menu_tagline: 'Restaurante e Pesqueiro',
  menu_description:
    'Conheça os pratos e porções servidos com o carinho de nossa cozinha. Os valores são informados no atendimento e no acesso restrito do cliente.',
  menu_cta: 'Acessar cardápio completo e pedir',
  gallery_eyebrow: 'Galeria',
  gallery_title: 'Fotos e vídeos do local',
  gallery_text: 'Um pouco do que espera por você: o lago, a pesca e os pratos da nossa cozinha.',
  promo_eyebrow: 'Promoção do dia',
  promo_fallback_title: 'Um convite para voltar',
  promo_fallback_text: 'Acompanhe nossas novidades e condições especiais para pesca e restaurante.',
  location_eyebrow: 'Venha nos visitar',
  location_title: 'Seu próximo dia tranquilo começa aqui.',
  contact_phone: '19 991689268',
  opening_hours: 'Terça a domingo, 07h às 20h',
  map_query: 'Pesqueiro e Restaurante, São Paulo',
}

/** Busca o documento único de conteúdo do site (ou null se nunca foi salvo). */
export async function getSiteContent(): Promise<SiteContent | null> {
  const records = await listRecords<SiteContent>('site_content', { sort: '-created' })
  return records[0] ?? null
}

export async function createSiteContent(data: FormData | Record<string, unknown>) {
  return createRecord<SiteContent>('site_content', data)
}

export async function updateSiteContent(id: string, data: FormData | Record<string, unknown>) {
  return updateRecord<SiteContent>('site_content', id, data)
}

/** URL de um arquivo salvo em site_content, com fallback para string vazia. */
export function getSiteContentFileUrl(
  record: SiteContent,
  filename: string | undefined,
  thumb?: string,
) {
  return getFileUrl(record, filename, thumb)
}
