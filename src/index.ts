export { Odontogram } from './components/Odontogram/Odontogram'
export {
  countStatuses,
  faceGeoms,
  faceLabel,
  LEGEND,
  mesialSide,
  nextStatus,
  quadrantOf,
  rootPath,
  TEETH_ROWS,
} from './components/Odontogram/data'
export type {
  LegendItem,
  LegendShape,
  StatusCounts,
  ToothFaceGeom,
  ToothRow,
} from './components/Odontogram/data'
export {
  diffValues,
  isEmptyValue,
  isEqualValue,
  migrateValue,
  normalizeValue,
  SCHEMA_VERSION,
  TOOTH_PARTS,
  TOOTH_STATUSES,
  validateValue,
} from './components/Odontogram/serialization'
export type {
  Dentition,
  OdontogramProps,
  OdontogramValue,
  PaintMode,
  PartChangeEvent,
  ToothNumber,
  ToothPart,
  ToothPartStatuses,
  ToothStatus,
} from './types'
