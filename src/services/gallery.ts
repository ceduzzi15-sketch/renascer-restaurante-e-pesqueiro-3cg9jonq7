import { createRecord, deleteRecord, listRecords, updateRecord } from '@/services/api'
import type { GalleryMedia } from '@/types'

export async function getGalleryMedia() {
  return listRecords<GalleryMedia>('gallery_media', { sort: 'order,created' })
}

export async function createGalleryMedia(data: FormData) {
  return createRecord<GalleryMedia>('gallery_media', data)
}

export async function updateGalleryMedia(id: string, data: Record<string, unknown> | FormData) {
  return updateRecord<GalleryMedia>('gallery_media', id, data)
}

export async function deleteGalleryMedia(id: string) {
  await deleteRecord('gallery_media', id)
}

/** Reordena a galeria enviando a nova posição de cada item. */
export async function reorderGalleryMedia(items: GalleryMedia[]) {
  await Promise.all(
    items.map((item, index) =>
      updateRecord<GalleryMedia>('gallery_media', item.id, { order: index + 1 }),
    ),
  )
}
