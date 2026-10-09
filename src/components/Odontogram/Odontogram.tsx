import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  OdontogramProps,
  OdontogramValue,
  PaintMode,
  ToothPart,
  ToothStatus,
} from '../../types'
import { countStatuses, nextStatus, TEETH_ROWS } from './data'
import type { ToothRow } from './data'
import styles from './Odontogram.module.css'
import { Tooth } from './Tooth'

const TOOLS: { mode: PaintMode; label: string; swatch?: 'caries' | 'treated' }[] = [
  { mode: 'cycle', label: 'Cíclico' },
  { mode: 'caries', label: 'Caries / Mal estado', swatch: 'caries' },
  { mode: 'treated', label: 'Tratado / Buen estado', swatch: 'treated' },
  { mode: 'eraser', label: 'Borrador' },
]

function applyPart(
  value: OdontogramValue,
  tooth: number,
  part: ToothPart,
  mode: PaintMode,
): OdontogramValue {
  const current: ToothStatus = value[tooth]?.[part] ?? 'normal'
  const next = nextStatus(current, mode)

  const toothParts = { ...(value[tooth] ?? {}) }
  if (next === 'normal') {
    delete toothParts[part]
  } else {
    toothParts[part] = next
  }

  if (Object.keys(toothParts).length === 0) {
    if (value[tooth] === undefined) return value
    const nextValue = { ...value }
    delete nextValue[tooth]
    return nextValue
  }
  return { ...value, [tooth]: toothParts }
}

export function Odontogram({
  value,
  defaultValue,
  onChange,
  mode,
  defaultMode = 'cycle',
  onModeChange,
  showToolbar = true,
  dentition = 'all',
  disabled = false,
  readOnly = false,
  className,
}: OdontogramProps) {
  const [internalValue, setInternalValue] = useState<OdontogramValue>(defaultValue ?? {})
  const [internalMode, setInternalMode] = useState<PaintMode>(defaultMode)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue
  const currentMode = mode !== undefined ? mode : internalMode
  const interactive = !disabled && !readOnly

  const valueRef = useRef(currentValue)
  useEffect(() => {
    valueRef.current = currentValue
  }, [currentValue])

  const modeRef = useRef(currentMode)
  useEffect(() => {
    modeRef.current = currentMode
  }, [currentMode])

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const onModeChangeRef = useRef(onModeChange)
  useEffect(() => {
    onModeChangeRef.current = onModeChange
  }, [onModeChange])

  const handleSelect = useCallback(
    (tooth: number, part: ToothPart) => {
      const next = applyPart(valueRef.current, tooth, part, modeRef.current)
      if (!isControlled) {
        setInternalValue(next)
      }
      onChangeRef.current?.(next)
    },
    [isControlled],
  )

  const handleModeChange = useCallback(
    (next: PaintMode) => {
      if (mode === undefined) {
        setInternalMode(next)
      }
      onModeChangeRef.current?.(next)
    },
    [mode],
  )

  const handleReset = useCallback(() => {
    if (!isControlled) {
      setInternalValue({})
    }
    onChangeRef.current?.({})
  }, [isControlled])

  const rows = useMemo(
    () =>
      TEETH_ROWS.filter((row) =>
        dentition === 'all'
          ? true
          : dentition === 'permanent'
            ? !row.deciduous
            : row.deciduous,
      ),
    [dentition],
  )

  const stats = useMemo(() => countStatuses(currentValue), [currentValue])

  const rootClassName = className ? `${styles.root} ${className}` : styles.root

  return (
    <div className={rootClassName}>
      {showToolbar && (
        <div className={styles.toolbar}>
          <span className={styles.toolbarTitle}>Modo de pintado:</span>
          {TOOLS.map((tool) => (
            <button
              key={tool.mode}
              type="button"
              className={styles.mode}
              aria-pressed={currentMode === tool.mode}
              disabled={!interactive}
              onClick={() => handleModeChange(tool.mode)}
            >
              <span
                className={[
                  styles.swatch,
                  tool.swatch === 'caries'
                    ? styles.swatchCaries
                    : tool.swatch === 'treated'
                      ? styles.swatchTreated
                      : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              />
              {tool.label}
            </button>
          ))}
          <span className={styles.spacer} />
          <button
            type="button"
            className={styles.mode}
            disabled={!interactive}
            onClick={handleReset}
          >
            Limpiar todo
          </button>
          <div className={styles.stats}>
            <span>
              Caries / mal estado: <b className={styles.statValue}>{stats.caries}</b>
            </span>
            <span>
              Tratado / buen estado: <b className={styles.statValue}>{stats.treated}</b>
            </span>
            <span>Cíclico: Blanco → Rojo → Azul → Blanco</span>
          </div>
        </div>
      )}

      <div className={styles.scroll}>
        <div className={styles.chart}>
          {rows.map((row, index) => {
            if (index === 0) {
              return (
                <Row
                  key={row.upper ? 'upper' : 'lower'}
                  row={row}
                  value={currentValue}
                  disabled={!interactive}
                  onSelect={handleSelect}
                />
              )
            }
            const crossesArch = row.upper !== rows[index - 1].upper
            return (
              <Fragment key={row.upper ? 'upper' : 'lower'}>
                {crossesArch ? (
                  <hr className={styles.separator} aria-hidden="true" />
                ) : (
                  <div className={styles.gap} aria-hidden="true" />
                )}
                <Row
                  row={row}
                  value={currentValue}
                  disabled={!interactive}
                  onSelect={handleSelect}
                />
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  row: ToothRow
  value: OdontogramValue
  disabled: boolean
  onSelect: (tooth: number, part: ToothPart) => void
}

function Row({ row, value, disabled, onSelect }: RowProps) {
  return (
    <div className={styles.row}>
      <div className={`${styles.half} ${styles.halfLeft}`}>
        {row.left.map((tooth) => (
          <Tooth
            key={tooth}
            tooth={tooth}
            upper={row.upper}
            deciduous={row.deciduous}
            statuses={value[tooth]}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className={`${styles.half} ${styles.halfRight}`}>
        {row.right.map((tooth) => (
          <Tooth
            key={tooth}
            tooth={tooth}
            upper={row.upper}
            deciduous={row.deciduous}
            statuses={value[tooth]}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}