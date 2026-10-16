import {
  TOOTH_PARTS,
  TOOTH_STATUSES,
} from '../components/Odontogram/serialization'

export type ToothNumber = number

/** Todos los estados clínicos que puede tener una cara del diente.
 *  Derivados de `TOOTH_STATUSES` para que las constantes de runtime y los
 *  tipos no puedan divergir (fuente única de verdad). */
export type ToothStatus = (typeof TOOTH_STATUSES)[number]

/** Las seis partes pintables de un diente, derivadas de `TOOTH_PARTS`. */
export type ToothPart = (typeof TOOTH_PARTS)[number]

export type ToothPartStatuses = Partial<Record<ToothPart, ToothStatus>>

export type OdontogramValue = Partial<Record<ToothNumber, ToothPartStatuses>>

/** Modo de pintado = estado que aplicar al hacer clic. No existe más el modo cíclico. */
export type PaintMode = Exclude<ToothStatus, 'normal'> | 'sano'

export type Dentition = 'all' | 'permanent' | 'deciduous'

export interface OdontogramProps {
  value?: OdontogramValue
  defaultValue?: OdontogramValue
  onChange?: (value: OdontogramValue) => void
  mode?: PaintMode
  defaultMode?: PaintMode
  onModeChange?: (mode: PaintMode) => void
  showToolbar?: boolean
  dentition?: Dentition
  disabled?: boolean
  readOnly?: boolean
  className?: string
}
