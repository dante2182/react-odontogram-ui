export type ToothNumber = number

export type ToothStatus = 'normal' | 'caries' | 'treated'

export type ToothPart =
  | 'root'
  | 'vestibular'
  | 'lingual'
  | 'mesial'
  | 'distal'
  | 'occlusal'

export type ToothPartStatuses = Partial<Record<ToothPart, ToothStatus>>

export type OdontogramValue = Partial<Record<ToothNumber, ToothPartStatuses>>

export type PaintMode = 'cycle' | 'caries' | 'treated' | 'eraser'

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