import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, FolderPlus, Pencil, Store, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createRecord, deleteRecord, listRecords, updateRecord } from '@/services/api'
import type { MenuCategoryRecord, MenuFolder } from '@/types'

export default function MenuFolderEditor({
  categories,
  onChanged,
}: {
  categories: MenuCategoryRecord[]
  onChanged: () => void
}) {
  const { toast } = useToast()
  const [folders, setFolders] = useState<MenuFolder[]>([])
  const [name, setName] = useState('')
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null)
  const [dragCategory, setDragCategory] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setFolders(await listRecords<MenuFolder>('menu_folders', { sort: 'order,name' }))
    } catch {
      setFolders([])
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saveFolder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    try {
      if (editingFolder) {
        await updateRecord<MenuFolder>('menu_folders', editingFolder.id, { name: name.trim() })
      } else {
        await createRecord<MenuFolder>('menu_folders', { name: name.trim(), order: folders.length })
      }
      toast({ title: editingFolder ? 'Pasta atualizada' : 'Pasta criada' })
      setName('')
      setEditingFolder(null)
      await refresh()
      onChanged()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar a pasta',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const move = async (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= folders.length) return
    const ordered = [...folders]
    const [moved] = ordered.splice(index, 1)
    ordered.splice(target, 0, moved)
    try {
      await Promise.all(
        ordered.map((folder, i) => updateRecord('menu_folders', folder.id, { order: i })),
      )
      await refresh()
      onChanged()
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível reordenar as pastas' })
    }
  }

  const remove = async (id: string) => {
    try {
      await deleteRecord('menu_folders', id)
      toast({ title: 'Pasta removida', description: 'As categorias voltaram para "sem pasta".' })
      await refresh()
      onChanged()
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível remover a pasta' })
    }
  }

  const assignCategory = async (categoryId: string, folderId: string | null) => {
    try {
      await updateRecord('menu_categories', categoryId, { folder: folderId || '' })
      await refresh()
      onChanged()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível mover a categoria',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  const unassigned = categories.filter((category) => !category.folder)

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="soft-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <FolderPlus className="h-4 w-4 text-primary" />
          <h2 className="font-sans text-base font-bold tracking-normal">
            {editingFolder ? 'Renomear pasta' : 'Nova pasta'}
          </h2>
        </div>
        <form className="flex items-end gap-2" onSubmit={saveFolder}>
          <div className="flex-1 space-y-2">
            <Label htmlFor="folder-name">Nome da pasta</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Almoço e Porções"
              required
            />
          </div>
          <Button type="submit">{editingFolder ? 'Salvar' : 'Criar'}</Button>
          {editingFolder && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingFolder(null)
                setName('')
              }}
            >
              Cancelar
            </Button>
          )}
        </form>

        <div className="mt-5 space-y-2">
          {folders.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma pasta criada ainda. Crie a primeira e arraste categorias para dentro dela.
            </p>
          )}
          {folders.map((folder, index) => (
            <div
              key={folder.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragCategory) void assignCategory(dragCategory, folder.id)
                setDragCategory(null)
              }}
              className="flex items-center justify-between gap-2 rounded-xl border border-dashed p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{folder.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categories.filter((category) => category.folder === folder.id).length} categorias
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}
                  title="Renomear"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0}
                  title="Subir"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => void move(index, 1)}
                  disabled={index === folders.length - 1}
                  title="Descer"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => void remove(folder.id)}
                  title="Remover pasta"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="soft-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          <h2 className="font-sans text-base font-bold tracking-normal">Categorias do cardápio</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Arraste uma categoria e solte sobre a pasta de destino — ou use o seletor ao lado.
        </p>

        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              draggable
              onDragStart={() => setDragCategory(category.id)}
              className="data-row cursor-grab"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{category.name}</p>
                <p className="text-xs text-muted-foreground">
                  {category.category_id}
                  {category.folder ? '' : ' · sem pasta'}
                </p>
              </div>
              <Select
                value={category.folder || 'none'}
                onValueChange={(value) =>
                  void assignCategory(category.id, value === 'none' ? null : value)
                }
              >
                <SelectTrigger className="h-8 w-44 shrink-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem pasta</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria cadastrada ainda. Elas aparecem aqui após o primeiro cadastro ou
              importação de CSV.
            </p>
          )}
        </div>

        {unassigned.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Fora de pasta: {unassigned.length}</Badge>
            <span className="text-xs text-muted-foreground">
              Categorias fora de pasta aparecem no grupo "Cardápio" das telas públicas.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
