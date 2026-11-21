import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getFileUrl, updateRecord } from '@/services/api'
import type { MenuCategoryRecord } from '@/types'

interface CategoryArtDialogProps {
  category: MenuCategoryRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export default function CategoryArtDialog({
  category,
  open,
  onOpenChange,
  onSaved,
}: CategoryArtDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setFile(null)
  }, [open, category?.id])

  const save = async (remove: boolean) => {
    if (!category) return
    setSaving(true)
    try {
      const data = new FormData()
      if (remove) data.set('art_image', '')
      else if (file) data.set('art_image', file)
      else return
      await updateRecord<MenuCategoryRecord>('menu_categories', category.id, data)
      toast({
        title: remove ? 'Arte removida' : 'Arte da categoria salva',
        description: remove
          ? 'A categoria voltou ao visual padrão do cartaz.'
          : `A arte de "${category.name}" já aparece no cardápio.`,
      })
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar a arte',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!category) return null

  const currentArt = category.art_image ? getFileUrl(category, category.art_image) : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Arte da categoria &ldquo;{category.name}&rdquo;</DialogTitle>
          <DialogDescription>
            Envie uma imagem (SVG ou PNG) para servir de ilustração/capa desta categoria no
            cardápio. Sem arte, o visual atual do cartaz é mantido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {currentArt && (
            <div className="space-y-2">
              <Label>Arte atual</Label>
              <img
                src={currentArt}
                alt={`Arte atual da categoria ${category.name}`}
                className="max-h-48 w-full rounded-xl border object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category-art-file">Nova arte</Label>
            <label
              htmlFor="category-art-file"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/40"
            >
              <ImagePlus className="h-5 w-5 shrink-0 text-primary" />
              <span>{file?.name ?? 'Escolher imagem (SVG ou PNG)'}</span>
            </label>
            <Input
              id="category-art-file"
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,image/png"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          {currentArt && (
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => void save(true)}
              className="text-destructive hover:text-destructive sm:mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remover arte
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={!file || saving} onClick={() => void save(false)}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar arte'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
