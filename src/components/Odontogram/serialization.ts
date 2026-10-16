/**
 * serialization.ts — Single source of truth for the persisted shape of an
 * odontogram, plus pure helpers to validate / normalize / migrate / diff
 * `OdontogramValue` payloads.
 *
 * This module is INTENTIONALLY free of React and CSS so it can be imported
 * from a Node/TypeScript backend (see `odontogram-ui/validate`).
 */
import type { OdontogramValue, ToothPartStatuses } from '../../types'
import { TEETH_ROWS } from './data'

/** The six individually paintable parts of a tooth. */
export const TOOTH_PARTS = [
  'root',
  'vestibular',
  'lingual',
  'mesial',
  'distal',
  'occlusal',
] as const

/** Every clinical status a tooth part may hold. */
export const TOOTH_STATUSES = [
  'normal',
  'caries',
  'restaurado',
  'extraido',
  'aExtraer',
  'ausente',
  'coronaBuena',
  'coronaMala',
  'selladoBueno',
  'selladoMalo',
  'protesisBuena',
  'protesisMala',
  'implanteBueno',
  'implanteMalo',
] as const

/**
 * Version of the persisted schema. Bump it whenever the shape or the set of
 * meanings changes in a way that requires a migration (see `migrateValue`).
 *
 * History:
 * - v1: `ToothStatus = 'normal' | 'caries' | 'treated'` (odontogram-ui 0.1.x)
 * - v2: 14 clinical statuses; `treated` was renamed to `restaurado`
 */
export const SCHEMA_VERSION = 2

/** Every valid FDI tooth number, derived from the rendered layout. */
export const VALID_TEETH: readonly number[] = Array.from(
  new Set(TEETH_ROWS.flatMap((row) => [...row.left, ...row.right])),
).sort((a, b) => a - b)

/** Fast lookup of the valid FDI tooth numbers. */
export const VALID_TOOTH_SET: ReadonlySet<number> = new Set(VALID_TEETH)

/* ────────────────────────────────────────────────────────────────────── */
/*  Internal helpers                                                     */
/* ────────────────────────────────────────────────────────────────────── */

/** Keys that could pollute the prototype chain if used as object keys. */
const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
  '__proto__',
  'constructor',
  'prototype',
])

const TOOTH_PART_SET: ReadonlySet<string> = new Set(TOOTH_PARTS)
const TOOTH_STATUS_SET: ReadonlySet<string> = new Set(TOOTH_STATUSES)

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function describe(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/**
 * Parses an FDI tooth key coming from JSON (always a string).
 * Rejects leading zeros ("016"), decimals ("1.5"), letters ("abc") and any
 * number that is not part of the rendered dentition.
 */
function parseToothKey(key: string): number | null {
  // Two digits, quadrant 1-8 and tooth 1-8; this rejects leading zeros,
  // decimals and any non numeric character in one shot.
  if (!/^[1-8][1-8]$/.test(key)) return null
  const value = Number(key)
  return VALID_TOOTH_SET.has(value) ? value : null
}

/* ────────────────────────────────────────────────────────────────────── */
/*  validateValue                                                        */
/* ────────────────────────────────────────────────────────────────────── */

/**
 * Validates an unknown payload against the persisted schema.
 *
 * @returns a list of human readable errors; an empty array means the value is
 * valid. It never throws — malformed input is reported as errors instead.
 */
export function validateValue(input: unknown): string[] {
  const errors: string[] = []
  try {
    if (!isPlainObject(input)) {
      errors.push(
        `Se esperaba un objeto OdontogramValue, se recibio ${describe(input)}`,
      )
      return errors
    }

    for (const key of Object.keys(input)) {
      if (DANGEROUS_KEYS.has(key)) {
        errors.push(`Clave no permitida: "${key}"`)
        continue
      }

      const tooth = parseToothKey(key)
      if (tooth === null) {
        errors.push(`Diente FDI invalido: "${key}"`)
        continue
      }

      const parts = input[key]
      if (!isPlainObject(parts)) {
        errors.push(
          `Diente ${tooth}: se esperaba un objeto de partes, se recibio ${describe(
            parts,
          )}`,
        )
        continue
      }

      for (const part of Object.keys(parts)) {
        if (!TOOTH_PART_SET.has(part)) {
          errors.push(`Diente ${tooth}: parte invalida "${part}"`)
          continue
        }
        const status = parts[part]
        if (typeof status !== 'string' || !TOOTH_STATUS_SET.has(status)) {
          errors.push(
            `Diente ${tooth} · ${part}: estado invalido "${String(status)}"`,
          )
        }
      }
    }
  } catch (error) {
    errors.push(`Error inesperado al validar: ${describe(error)}`)
  }
  return errors
}

/* ────────────────────────────────────────────────────────────────────── */
/*  normalizeValue / migrateValue                                        */
/* ────────────────────────────────────────────────────────────────────── */

/**
 * Returns a cleaned, immutable copy of a value: drops `normal` / `undefined`
 * parts and removes teeth that end up with no parts.
 *
 * Whole-tooth modes keep their 6 identical parts untouched (the component
 * relies on that layout), and keys come out in a stable ascending order.
 */
export function normalizeValue(value: OdontogramValue): OdontogramValue {
  const result: OdontogramValue = {}
  const teeth = Object.keys(value)
    .map((key) => Number(key))
    .filter((tooth) => !Number.isNaN(tooth))
    .sort((a, b) => a - b)

  for (const tooth of teeth) {
    const source = value[tooth]
    if (!source) continue

    const parts: ToothPartStatuses = {}
    for (const part of TOOTH_PARTS) {
      const status = source[part]
      if (status === undefined || status === 'normal') continue
      parts[part] = status
    }

    if (Object.keys(parts).length > 0) {
      result[tooth] = parts
    }
  }

  return result
}

type MigrationFn = (value: unknown) => unknown

/** Recursively renames statuses inside a raw value, preserving everything else. */
function renameStatuses(
  value: unknown,
  rename: Record<string, string>,
): unknown {
  if (!isPlainObject(value)) return value

  const result: Record<string, unknown> = {}
  for (const [tooth, parts] of Object.entries(value)) {
    if (!isPlainObject(parts)) {
      result[tooth] = parts
      continue
    }

    const nextParts: Record<string, unknown> = {}
    for (const [part, status] of Object.entries(parts)) {
      nextParts[part] =
        typeof status === 'string' && Object.hasOwn(rename, status)
          ? rename[status]
          : status
    }
    result[tooth] = nextParts
  }
  return result
}

/** Migration steps keyed by the version they upgrade FROM. */
const MIGRATIONS: Record<number, MigrationFn> = {
  // v1 → v2: the old `treated` status was renamed to `restaurado`.
  1: (value) => renameStatuses(value, { treated: 'restaurado' }),
}

/**
 * Migrates a raw payload to the current `SCHEMA_VERSION` by applying every
 * migration chained from `fromVersion` (defaults to the oldest version).
 *
 * Unknown statuses are left untouched on purpose so `validateValue` can report
 * them instead of silently dropping data.
 */
export function migrateValue(value: unknown, fromVersion = 1): OdontogramValue {
  if (fromVersion >= SCHEMA_VERSION) return value as OdontogramValue

  let current: unknown = value
  for (let version = fromVersion; version < SCHEMA_VERSION; version += 1) {
    const migrate = MIGRATIONS[version]
    if (migrate) current = migrate(current)
  }
  return current as OdontogramValue
}

/* ────────────────────────────────────────────────────────────────────── */
/*  diffValues / isEqualValue / isEmptyValue                             */
/* ────────────────────────────────────────────────────────────────────── */

/** Order-independent signature of a single tooth's meaningful parts. */
function toothSignature(parts: ToothPartStatuses | undefined): string {
  if (!parts) return ''
  const tokens: string[] = []
  for (const part of TOOTH_PARTS) {
    const status = parts[part]
    if (status === undefined || status === 'normal') continue
    tokens.push(`${part}=${status}`)
  }
  return tokens.join(',')
}

/**
 * Tooth numbers whose content differs between `a` and `b`, ascending.
 * The comparison ignores key order and `normal` / `undefined` entries.
 */
export function diffValues(a: OdontogramValue, b: OdontogramValue): number[] {
  const teeth = new Set<number>()
  for (const key of Object.keys(a)) {
    const tooth = Number(key)
    if (!Number.isNaN(tooth)) teeth.add(tooth)
  }
  for (const key of Object.keys(b)) {
    const tooth = Number(key)
    if (!Number.isNaN(tooth)) teeth.add(tooth)
  }

  const changed: number[] = []
  for (const tooth of teeth) {
    if (toothSignature(a[tooth]) !== toothSignature(b[tooth])) {
      changed.push(tooth)
    }
  }
  return changed.sort((x, y) => x - y)
}

/** Structural equality based on `diffValues`. */
export function isEqualValue(a: OdontogramValue, b: OdontogramValue): boolean {
  return diffValues(a, b).length === 0
}

/** True when no tooth holds a meaningful (non `normal`) status. */
export function isEmptyValue(value: OdontogramValue): boolean {
  for (const parts of Object.values(value)) {
    if (!parts) continue
    for (const status of Object.values(parts)) {
      if (status !== undefined && status !== 'normal') return false
    }
  }
  return true
}
