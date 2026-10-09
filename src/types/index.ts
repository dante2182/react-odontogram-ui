export type ToothNumber = number

/** Todos los estados clínicos que puede tener una cara del diente. */
export type ToothStatus =
  | 'normal'
  | 'caries'
  | 'restaurado'
  | 'extraido'
  | 'aExtraer'
  | 'ausente'
  | 'coronaBuena'
  | 'coronaMala'
  | 'selladoBueno'
  | 'selladoMalo'
  | 'protesisBuena'
  | 'protesisMala'
  | 'implanteBueno'
  | 'implanteMalo'

export type ToothPart =
  'root' | 'vestibular' | 'lingual' | 'mesial' | 'distal' | 'occlusal'

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
