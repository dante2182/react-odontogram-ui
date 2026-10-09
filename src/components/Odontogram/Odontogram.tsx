import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  OdontogramProps,
  OdontogramValue,
  PaintMode,
  ToothPart,
  ToothStatus,
} from '../../types'
import { countStatuses, LEGEND, nextStatus, TEETH_ROWS } from './data'
import type { LegendItem, ToothRow } from './data'
import styles from './Odontogram.module.css'
import { Tooth } from './Tooth'

/* ─────────────────────────────────────────────────────────────── */
/*  Iconos SVG inline para cada chip de la leyenda horizontal     */
/* ─────────────────────────────────────────────────────────────── */

function SwatchSolid({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={color}
        stroke="#1f2937"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function SwatchRing({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.2"
        fill="#ffffff"
        stroke={color}
        strokeWidth="3"
      />
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="none"
        stroke="#1f2937"
        strokeWidth="0.8"
        opacity="0.18"
      />
    </svg>
  )
}

function SwatchRingProst({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="2"
        y="7"
        width="20"
        height="10"
        rx="5"
        fill="#ffffff"
        stroke={color}
        strokeWidth="3"
      />
    </svg>
  )
}

function SwatchLetterS({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill={color}
        stroke="#1f2937"
        strokeWidth="1.1"
      />
      <text
        x="12"
        y="13"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="12"
        fontWeight="800"
        fill="#ffffff"
        paintOrder="stroke"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.6"
      >
        S
      </text>
    </svg>
  )
}

function SwatchSquare({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        fill={color}
        stroke="#1f2937"
        strokeWidth="1.1"
      />
    </svg>
  )
}

function LegendIcon({ item }: { item: LegendItem }) {
  switch (item.shape) {
    case 'solid':
      return <SwatchSolid color={item.color} />
    case 'ring':
      return <SwatchRing color={item.color} />
    case 'ringProst':
      return <SwatchRingProst color={item.color} />
    case 'letterS':
      return <SwatchLetterS color={item.color} />
    case 'square':
      return <SwatchSquare color={item.color} />
  }
}

/** Modos que afectan AL DIENTE ENTERO, no solo una cara.
 *  Al clickear cualquier parte, se marca TODO el diente con ese estado
 *  y se renderiza un overlay SVG específico.
 *  Solo quedan por-cara: `caries`, `restaurado`, `sano` (borrador puntual). */
const WHOLE_TOOTH_MODES = new Set<PaintMode>([
  'extraido',
  'aExtraer',
  'ausente',
  'implanteBueno',
  'implanteMalo',
  'coronaBuena',
  'coronaMala',
  'selladoBueno',
  'selladoMalo',
  'protesisBuena',
  'protesisMala',
])

function applyPart(
  value: OdontogramValue,
  tooth: number,
  part: ToothPart,
  mode: PaintMode,
): OdontogramValue {
  // ── Modos de DIENTE ENTERO ──────────────────────────────────
  // Si el diente YA TIENE este estado → lo quitamos (limpio).
  // Si NO lo tiene → aplicamos este estado a TODAS las caras
  // (borrando cualquier otro que hubiera para garantizar override visual).
  if (WHOLE_TOOTH_MODES.has(mode)) {
    const alreadyApplied =
      value[tooth] && Object.values(value[tooth]!).every((s) => s === mode)

    const nextValue = { ...value }
    if (alreadyApplied) {
      // Toggle: lo quitamos
      delete nextValue[tooth]
    } else {
      // Sobreescribimos TODAS las partes con este modo. Así la Cruz
      // o el Implante aparecen instantáneamente sin pintar cara por cara.
      nextValue[tooth] = {
        root: mode as ToothStatus,
        vestibular: mode as ToothStatus,
        lingual: mode as ToothStatus,
        mesial: mode as ToothStatus,
        distal: mode as ToothStatus,
        occlusal: mode as ToothStatus,
      }
    }
    if (nextValue[tooth] === undefined && value[tooth] === undefined)
      return value
    return nextValue
  }

  // ── Modos POR CARA (restaurado, caries, corona*, sellado*, protesis*, sano) ──
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
  defaultMode = 'caries',
  onModeChange,
  showToolbar = true,
  dentition = 'all',
  disabled = false,
  readOnly = false,
  className,
}: OdontogramProps) {
  const [internalValue, setInternalValue] = useState<OdontogramValue>(
    defaultValue ?? {},
  )
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
        <>
          <div
            className={styles.legend}
            role="toolbar"
            aria-label="Leyenda y modos de pintado"
          >
            <span className={styles.legendTitle}>Leyenda:</span>
            {LEGEND.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.chip}
                aria-pressed={currentMode === item.id}
                aria-disabled={!interactive}
                disabled={!interactive}
                onClick={() => handleModeChange(item.id)}
              >
                <span className={styles.icon} aria-hidden="true">
                  <LegendIcon item={item} />
                </span>
                {item.label}
              </button>
            ))}
            <span className={styles.actions}>
              <button
                type="button"
                className={styles.chip}
                aria-disabled={!interactive}
                disabled={!interactive}
                onClick={handleReset}
              >
                🧹 Limpiar todo
              </button>
            </span>
          </div>
          <div className={styles.stats} aria-live="polite">
            <span>
              Caries: <b>{stats.caries}</b>
            </span>
            <span>
              Restaurados: <b>{stats.restaurado}</b>
            </span>
            <span>
              A extraer: <b>{stats.aExtraer}</b>
            </span>
            <span>
              Extraídos: <b>{stats.extraido}</b>
            </span>
            <span>
              Ausentes: <b>{stats.ausente}</b>
            </span>
            <span>
              Coronas: <b>{stats.corona}</b>
            </span>
            <span>
              Sellados: <b>{stats.sellado}</b>
            </span>
            <span>
              Prótesis: <b>{stats.protesis}</b>
            </span>
            <span>
              Implantes: <b>{stats.implante}</b>
            </span>
          </div>
        </>
      )}

      <div className={styles.scroll}>
        <div className={styles.chart}>
          {rows.map((row, index) => {
            const rowKey = `${row.upper ? 'upper' : 'lower'}-${row.deciduous ? 'deciduous' : 'permanent'}`
            if (index === 0) {
              return (
                <Row
                  key={rowKey}
                  row={row}
                  value={currentValue}
                  disabled={!interactive}
                  onSelect={handleSelect}
                />
              )
            }
            const crossesArch = row.upper !== rows[index - 1].upper
            return (
              <Fragment key={rowKey}>
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
