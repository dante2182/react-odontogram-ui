/**
 * serialization.ts — Single source of truth for the persisted shape of an
 * odontogram, plus pure helpers to validate / normalize / migrate / diff
 * `OdontogramValue` payloads.
 *
 * This module is INTENTIONALLY free of React and CSS so it can be imported
 * from a Node/TypeScript backend (see `odontogram-ui/validate`).
 */
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
