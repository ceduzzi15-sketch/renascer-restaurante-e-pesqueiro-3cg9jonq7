import { useState, useRef, type ChangeEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  HelpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { importMenuData, parseMenuCsv, type ParsedCsvResult } from '@/services/csvImport'

interface CsvImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CsvImportModal({ open, onOpenChange, onSuccess }: CsvImportModalProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedCsvResult | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<{ added: number; updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setError(null)
    setStats(null)
    setParsing(true)

    try {
      const text = await selected.text()
      const result = parseMenuCsv(text)
      setParsed(result)
    } catch (err) {
      setParsed(null)
      setError(err instanceof Error ? err.message : 'Falha ao processar o arquivo CSV.')
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (!parsed) return

    setImporting(true)
    setProgress(0)
    setError(null)

    try {
      const result = await importMenuData(parsed, (current, total) => {
        setProgress(Math.round((current / total) * 100))
      })

      setStats(result)
      const skippedInfo = result.skipped > 0 ? `, ${result.skipped} ignorados` : ''
      toast({
        title: 'Importação concluída com sucesso!',
        description: `${result.added} registros adicionados, ${result.updated} atualizados${skippedInfo}.`,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro durante a importação no banco de dados.')
      toast({
        variant: 'destructive',
        title: 'Falha na importação',
        description: err instanceof Error ? err.message : 'Tente novamente.',
      })
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsed(null)
    setStats(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeDialog = () => {
    if (importing) return
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl">Importar Cardápio via CSV</DialogTitle>
              <DialogDescription>
                Carregue arquivos de Categorias, Itens ou Destaques. O sistema detecta separador,
                decimais e faz upsert automático sem duplicar dados.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {!file && !stats && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition hover:border-primary hover:bg-primary/10"
            >
              <FileUp className="h-10 w-10 text-primary mb-3" />
              <p className="text-sm font-semibold text-foreground">
                Clique para selecionar o arquivo CSV
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Suporta CSV com delimitador vírgula (,) ou ponto e vírgula (;)
              </p>
              <Badge variant="outline" className="mt-3 text-xs bg-white text-muted-foreground">
                Arquivos de Itens, Categorias ou Destaques
              </Badge>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {parsing && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Lendo e analisando arquivo CSV...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Erro no arquivo</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {parsed && !stats && !error && (
            <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{file?.name}</span>
                  <p className="text-xs text-muted-foreground">
                    Separador detectado: &ldquo;
                    <strong className="text-foreground">{parsed.delimiter}</strong>&rdquo; · Linhas
                    encontradas: <strong className="text-foreground">{parsed.rowCount}</strong>
                  </p>
                </div>
                <Badge className="bg-primary text-white">
                  {parsed.type === 'categories'
                    ? 'Categorias'
                    : parsed.type === 'highlights'
                      ? 'Destaques'
                      : 'Itens do Cardápio'}
                </Badge>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Prévia das colunas detectadas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.headers.map((h) => (
                    <span
                      key={h}
                      className="rounded bg-white px-2 py-0.5 text-xs font-mono text-muted-foreground border"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {parsed.type === 'items' && parsed.itemsToUpsert && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    {parsed.itemsToUpsert.length} itens prontos para serem inseridos ou atualizados
                    (idempotente: itens já existentes no cardápio serão atualizados, novos serão
                    adicionados).
                  </p>
                </div>
              )}

              {importing && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Gravando registros no banco de dados...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          )}

          {stats && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-center text-emerald-800 space-y-3">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold">Importação concluída com sucesso!</h4>
                <p className="mt-1 text-sm text-emerald-700">
                  {stats.added} novo(s) registro(s) adicionado(s) e {stats.updated} atualizado(s) no
                  banco.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground border border-dashed">
            <HelpCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <p>
              <strong>Dica:</strong> Se possuir o arquivo de Categorias e o arquivo de Itens,
              importe primeiro as Categorias para organizar a exibição, ou importe diretamente os
              Itens (as categorias serão criadas automaticamente a partir das linhas dos itens).
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {stats ? (
            <Button onClick={closeDialog} className="w-full sm:w-auto">
              Fechar e ver cardápio
            </Button>
          ) : (
            <>
              {file && (
                <Button type="button" variant="outline" onClick={handleReset} disabled={importing}>
                  Trocar arquivo
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={importing}>
                Cancelar
              </Button>
              {parsed && (
                <Button
                  onClick={handleImport}
                  disabled={importing || parsed.rowCount === 0}
                  className="gap-2 bg-primary"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Importando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" /> Confirmar e Gravar (
                      {parsed.rowCount})
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
