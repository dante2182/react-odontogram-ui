import type {
  OdontogramValue,
  ToothNumber,
  ToothPart,
  ToothStatus,
} from '../../types'

export interface ToothRow {
  /** true when the crowns point toward the opposite arch (upper arch). */
  upper: boolean
  /** true when these are deciduous (temporal) teeth. */
  deciduous: boolean
  left: ToothNumber[]
  right: ToothNumber[]
}

export interface ToothFaceGeom {
  part: ToothPart
  points?: string
  d?: string
}

const range = (from: number, to: number): number[] => {
  const result: number[] = []
  const step = from < to ? 1 : -1
  for (let i = from; ; i += step) {
    result.push(i)
    if (i === to) break
  }
  return result
}

const quadrantTeeth = (quad: number, from: number, to: number): ToothNumber[] =>
  range(from, to).map((n) => quad * 10 + n)

/** Display order: permanent upper, deciduous upper, deciduous lower, permanent lower. */
export const TEETH_ROWS: ToothRow[] = [
  {
    upper: true,
    deciduous: false,
    left: quadrantTeeth(1, 8, 1),
    right: quadrantTeeth(2, 1, 8),
  },
  {
    upper: true,
    deciduous: true,
    left: quadrantTeeth(5, 5, 1),
    right: quadrantTeeth(6, 1, 5),
  },
  {
    upper: false,
    deciduous: true,
    left: quadrantTeeth(8, 5, 1),
    right: quadrantTeeth(7, 1, 5),
  },
  {
    upper: false,
    deciduous: false,
    left: quadrantTeeth(4, 8, 1),
    right: quadrantTeeth(3, 1, 8),
  },
]

export const quadrantOf = (tooth: ToothNumber): number => Math.floor(tooth / 10)

const isMolar = (tooth: ToothNumber): boolean =>
  quadrantOf(tooth) < 5 && [6, 7, 8].includes(tooth % 10)

const isUpperMolar = (tooth: ToothNumber): boolean =>
  quadrantOf(tooth) <= 2 && isMolar(tooth)

/** Crown face polygons on a 48x48 square (tooth viewBox is 48x96). */
const CROWN_FACES = {
  top: '0,0 48,0 34,14 14,14',
  bottom: '0,48 48,48 34,34 14,34',
  left: '0,0 14,14 14,34 0,48',
  right: '48,0 48,48 34,34 34,14',
  center: '14,14 34,14 34,34 14,34',
} as const

/** Root outlines drawn "pointing up" in y∈[0,46]; lower rows are mirrored. */
const ROOTS = {
  simple: 'M14 46 L24 2 L34 46 Z',
  biW: 'M4 46 L12 2 L24 36 L36 2 L44 46 Z',
  triM: 'M3 46 L11 2 L17 40 L24 6 L31 40 L37 2 L45 46 Z',
} as const

/** Teeth in quadrants 1, 4, 5 and 8 have their mesial face on the right. */
export const mesialSide = (tooth: ToothNumber): 'left' | 'right' =>
  [1, 4, 5, 8].includes(quadrantOf(tooth)) ? 'right' : 'left'

const PART_LABELS: Record<ToothPart, string> = {
  root: 'Raíz',
  vestibular: 'Vestibular',
  lingual: 'Palatino/Lingual',
  mesial: 'Mesial',
  distal: 'Distal',
  occlusal: 'Oclusal',
}

export function faceLabel(part: ToothPart): string {
  return PART_LABELS[part]
}

export function rootPath(tooth: ToothNumber, deciduous: boolean): string {
  if (deciduous || !isMolar(tooth)) return ROOTS.simple
  return isUpperMolar(tooth) ? ROOTS.triM : ROOTS.biW
}

/** Ready-to-render geometry for every paintable part of a tooth. */
export function faceGeoms(
  tooth: ToothNumber,
  deciduous: boolean,
): ToothFaceGeom[] {
  const ring: {
    part: ToothPart
    face: 'top' | 'bottom' | 'left' | 'right' | 'center'
  }[] = [
    { part: 'vestibular', face: 'top' },
    { part: 'lingual', face: 'bottom' },
    { part: 'mesial', face: mesialSide(tooth) },
    { part: 'distal', face: mesialSide(tooth) === 'left' ? 'right' : 'left' },
    { part: 'occlusal', face: 'center' },
  ]

  return [
    { part: 'root', d: rootPath(tooth, deciduous) },
    ...ring.map(({ part, face }) => ({ part, points: CROWN_FACES[face] })),
  ]
}

import type { PaintMode } from '../../types'

/** Estilos visuales de la leyenda: cómo se dibuja cada afección. */
export type LegendShape =
  | 'solid' // círculo relleno (caries, restaurado, etc)
  | 'ring' // solo borde (coronas)
  | 'ringProst' // borde apaisado (prótesis)
  | 'letterS' // círculo + letra "S" (sellados)
  | 'square' // cuadrado (implantes)

export interface LegendItem {
  id: PaintMode
  label: string
  /** Token CSS del color principal (fill / stroke). */
  color: string
  shape: LegendShape
}

/** Barra de leyenda HORIZONTAL. Orden y propiedades coinciden con el diseño clínico. */
export const LEGEND: readonly LegendItem[] = [
  {
    id: 'caries',
    label: 'Caries',
    color: 'var(--odonto-caries)',
    shape: 'solid',
  },
  {
    id: 'restaurado',
    label: 'Restaurado',
    color: 'var(--odonto-restaurado)',
    shape: 'solid',
  },
  { id: 'sano', label: 'Sano', color: 'var(--odonto-tooth)', shape: 'solid' },
  {
    id: 'extraido',
    label: 'Extraído',
    color: 'var(--odonto-extraido)',
    shape: 'solid',
  },
  {
    id: 'aExtraer',
    label: 'A Extraer',
    color: 'var(--odonto-a-extraer)',
    shape: 'solid',
  },
  {
    id: 'ausente',
    label: 'Ausente',
    color: 'var(--odonto-ausente)',
    shape: 'solid',
  },
  {
    id: 'coronaBuena',
    label: 'Corona Buena',
    color: 'var(--odonto-corona-buena)',
    shape: 'ring',
  },
  {
    id: 'coronaMala',
    label: 'Corona Mala',
    color: 'var(--odonto-corona-mala)',
    shape: 'ring',
  },
  {
    id: 'selladoBueno',
    label: 'Sellado Bueno',
    color: 'var(--odonto-sellado-bueno)',
    shape: 'letterS',
  },
  {
    id: 'selladoMalo',
    label: 'Sellado Malo',
    color: 'var(--odonto-sellado-malo)',
    shape: 'letterS',
  },
  {
    id: 'protesisBuena',
    label: 'Prótesis Buena',
    color: 'var(--odonto-protesis-buena)',
    shape: 'ringProst',
  },
  {
    id: 'protesisMala',
    label: 'Prótesis Mala',
    color: 'var(--odonto-protesis-mala)',
    shape: 'ringProst',
  },
  {
    id: 'implanteBueno',
    label: 'Implante Bueno',
    color: 'var(--odonto-implante-bueno)',
    shape: 'square',
  },
  {
    id: 'implanteMalo',
    label: 'Implante Malo',
    color: 'var(--odonto-implante-malo)',
    shape: 'square',
  },
] as const

/** Pintado DIRECTO (sin ciclo):
 * - `sano` = siempre vuelve a normal (borrador).
 * - Cualquier otro modo = toggle sobre ese estado puntual: si ya lo tenía → normal; si no → lo aplica.
 */
export function nextStatus(current: ToothStatus, mode: PaintMode): ToothStatus {
  if (mode === 'sano') return 'normal'
  return current === mode ? 'normal' : mode
}

export interface StatusCounts {
  caries: number
  restaurado: number
  extraido: number
  aExtraer: number
  ausente: number
  corona: number
  sellado: number
  protesis: number
  implante: number
}

export function countStatuses(value: OdontogramValue): StatusCounts {
  const counts: StatusCounts = {
    caries: 0,
    restaurado: 0,
    extraido: 0,
    aExtraer: 0,
    ausente: 0,
    corona: 0,
    sellado: 0,
    protesis: 0,
    implante: 0,
  }
  for (const tooth of Object.values(value)) {
    if (!tooth) continue
    for (const status of Object.values(tooth)) {
      switch (status) {
        case 'caries':
          counts.caries += 1
          break
        case 'restaurado':
          counts.restaurado += 1
          break
        case 'extraido':
          counts.extraido += 1
          break
        case 'aExtraer':
          counts.aExtraer += 1
          break
        case 'ausente':
          counts.ausente += 1
          break
        case 'coronaBuena':
        case 'coronaMala':
          counts.corona += 1
          break
        case 'selladoBueno':
        case 'selladoMalo':
          counts.sellado += 1
          break
        case 'protesisBuena':
        case 'protesisMala':
          counts.protesis += 1
          break
        case 'implanteBueno':
        case 'implanteMalo':
          counts.implante += 1
          break
      }
    }
  }
  return counts
}
