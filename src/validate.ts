/**
 * `odontogram-ui/validate` — framework-free entry point.
 *
 * Re-exports only the pure serialization utilities (no React, no CSS) so a
 * Node/TypeScript backend can validate, normalize, migrate and diff
 * `OdontogramValue` payloads without loading the React component.
 */
export {
  diffValues,
  isEmptyValue,
  isEqualValue,
  migrateValue,
  normalizeValue,
  SCHEMA_VERSION,
  TOOTH_PARTS,
  TOOTH_STATUSES,
  VALID_TEETH,
  validateValue,
} from './components/Odontogram/serialization'
export type {
  OdontogramValue,
  ToothNumber,
  ToothPart,
  ToothPartStatuses,
  ToothStatus,
} from './types'
