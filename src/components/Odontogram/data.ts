import type { OdontogramValue, ToothNumber, ToothPart, ToothStatus } from '../../types'

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
  { upper: true, deciduous: false, left: quadrantTeeth(1, 8, 1), right: quadrantTeeth(2, 1, 8) },
  { upper: true, deciduous: true, left: quadrantTeeth(5, 5, 1), right: quadrantTeeth(6, 1, 5) },
  { upper: false, deciduous: true, left: quadrantTeeth(8, 5, 1), right: quadrantTeeth(7, 1, 5) },
  { upper: false, deciduous: false, left: quadrantTeeth(4, 8, 1), right: quadrantTeeth(3, 1, 8) },
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
export function faceGeoms(tooth: ToothNumber, deciduous: boolean): ToothFaceGeom[] {
  const ring: { part: ToothPart; face: 'top' | 'bottom' | 'left' | 'right' | 'center' }[] = [
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

/** Painting cycle used by the MINSA "Cíclico" mode. */
export const CYCLE: readonly ToothStatus[] = ['normal', 'caries', 'treated']

/** Mirror of the reference `applyClick` painting logic. */
export function nextStatus(current: ToothStatus, mode: 'cycle' | 'caries' | 'treated' | 'eraser'): ToothStatus {
  switch (mode) {
    case 'cycle':
      return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length] ?? 'normal'
    case 'eraser':
      return 'normal'
    case 'caries':
    case 'treated':
      return current === mode ? 'normal' : mode
  }
}

export function countStatuses(value: OdontogramValue): { caries: number; treated: number } {
  let caries = 0
  let treated = 0
  for (const tooth of Object.values(value)) {
    if (!tooth) continue
    for (const status of Object.values(tooth)) {
      if (status === 'caries') caries += 1
      else if (status === 'treated') treated += 1
    }
  }
  return { caries, treated }
}