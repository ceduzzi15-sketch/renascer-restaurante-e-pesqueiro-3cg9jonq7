/**
 * Logo real do Renascer, extraída da foto enviada pelo usuário
 * (emblema com árvores, lago/pesca e o texto "Renascer — Restaurante e Pesqueiro"
 * no terço superior da foto, sobre o salão desfocado).
 *
 * O recorte é feito com o viewBox do SVG apontando para a região do emblema
 * (coordenadas abaixo, em frações da foto): nada é inventado e a foto original
 * permanece intacta em src/assets/foto-com-logo-cba4f.jpg como referência.
 */
import { cn } from '@/lib/utils'
import photoWithLogo from '@/assets/foto-com-logo-cba4f.jpg'

/** Caixa do recorte do emblema, em frações (0–1) da foto original */
const CROP = { x: 0.2, y: 0.035, width: 0.63, height: 0.215 }
/** Espaço de referência do SVG (proporção da foto) usado para posicionar a imagem */
const SPACE = { width: 320, height: 594 }
/** Cantos arredondados do recorte, em unidades do espaço de referência */
const RADIUS = 14

export default function LogoEmblem({ className }: { className?: string }) {
  const rect = {
    x: CROP.x * SPACE.width,
    y: CROP.y * SPACE.height,
    width: CROP.width * SPACE.width,
    height: CROP.height * SPACE.height,
  }
  const clipId = `logo-crop-${Math.round(rect.x)}-${Math.round(rect.y)}`

  return (
    <svg
      viewBox={`${rect.x} ${rect.y} ${rect.width} ${rect.height}`}
      className={cn('shrink-0', className)}
      role="img"
      aria-label="Logo do Renascer"
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={RADIUS}
            ry={RADIUS}
          />
        </clipPath>
      </defs>
      <image
        href={photoWithLogo}
        x={0}
        y={0}
        width={SPACE.width}
        height={SPACE.height}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  )
}
