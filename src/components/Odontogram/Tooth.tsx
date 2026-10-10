import { memo, useMemo } from 'react'
import type {
  ToothNumber,
  ToothPart,
  ToothPartStatuses,
  ToothStatus,
} from '../../types'
import { faceGeoms } from './data'
import styles from './Odontogram.module.css'
import { ToothFace } from './ToothFace'

type ToothVisualOverride =
  | { kind: 'none' }
  | { kind: 'cross'; status: 'extraido' | 'aExtraer' | 'ausente' }
  | { kind: 'implant'; status: 'implanteBueno' | 'implanteMalo' }
  | { kind: 'crown'; status: 'coronaBuena' | 'coronaMala' }
  | { kind: 'sellado'; status: 'selladoBueno' | 'selladoMalo' }
  | { kind: 'prosthesis'; status: 'protesisBuena' | 'protesisMala' }

/** Estados que sustituyen la visualización del diente entero.
 *  Prioridad (si un diente tiene varios): Implante > Cruz > Corona > Prótesis > Sellado.
 *  Solo quedan «por cara»: caries, restaurado, sano (borrador puntual). */
const CROSS_STATUSES = ['extraido', 'aExtraer', 'ausente'] as const
const IMPLANT_STATUSES = ['implanteBueno', 'implanteMalo'] as const
const CORONA_STATUSES = ['coronaBuena', 'coronaMala'] as const
const SELLADO_STATUSES = ['selladoBueno', 'selladoMalo'] as const
const PROTESIS_STATUSES = ['protesisBuena', 'protesisMala'] as const

function findStatus<T extends ToothStatus>(
  all: ToothStatus[],
  allowed: readonly T[],
): T | undefined {
  return all.find((s): s is T =>
    (allowed as readonly ToothStatus[]).includes(s),
  )
}

function resolveOverride(
  statuses: ToothPartStatuses | undefined,
): ToothVisualOverride {
  if (!statuses) return { kind: 'none' }
  const all = Object.values(statuses).filter(
    (s): s is ToothStatus => s !== undefined,
  )

  const implant = findStatus(all, IMPLANT_STATUSES)
  if (implant) return { kind: 'implant', status: implant }

  const cross = findStatus(all, CROSS_STATUSES)
  if (cross) return { kind: 'cross', status: cross }

  const crown = findStatus(all, CORONA_STATUSES)
  if (crown) return { kind: 'crown', status: crown }

  const prosth = findStatus(all, PROTESIS_STATUSES)
  if (prosth) return { kind: 'prosthesis', status: prosth }

  const sell = findStatus(all, SELLADO_STATUSES)
  if (sell) return { kind: 'sellado', status: sell }

  return { kind: 'none' }
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Overlay CRUZ (X) — para Extraído / A Extraer / Ausente            */
/*  Zona de la corona (y=0..48 en el sistema «corona hacia arriba»)   */
/* ──────────────────────────────────────────────────────────────────── */
function CrossOverlay({
  status,
}: {
  status: 'extraido' | 'aExtraer' | 'ausente'
}) {
  const varName =
    status === 'extraido'
      ? 'var(--odonto-extraido)'
      : status === 'aExtraer'
        ? 'var(--odonto-a-extraer)'
        : 'var(--odonto-ausente)'
  return (
    <g className={styles.crossOverlay} aria-hidden="true">
      <line
        x1="6"
        y1="6"
        x2="42"
        y2="42"
        stroke={varName}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="6"
        x2="6"
        y2="42"
        stroke={varName}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Overlay CORONA — anillo grande AZUL/ROJO que envuelve la corona   */
/* ──────────────────────────────────────────────────────────────────── */
function CrownRingOverlay({
  status,
}: {
  status: 'coronaBuena' | 'coronaMala'
}) {
  const color =
    status === 'coronaBuena'
      ? 'var(--odonto-corona-buena)'
      : 'var(--odonto-corona-mala)'
  return (
    <g className={styles.toothRingOverlay} aria-hidden="true">
      <circle
        cx="24"
        cy="24"
        r="21.5"
        fill="none"
        stroke={color}
        strokeWidth="4.5"
      />
    </g>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Overlay SELLADO — círculo borde NEGRO + letra S (AZUL/ROJO) centro */
/* ──────────────────────────────────────────────────────────────────── */
function SelladoMarkOverlay({
  status,
}: {
  status: 'selladoBueno' | 'selladoMalo'
}) {
  const letterColor =
    status === 'selladoBueno'
      ? 'var(--odonto-corona-buena)'
      : 'var(--odonto-corona-mala)'
  return (
    <g className={styles.toothRingOverlay} aria-hidden="true">
      {/* Borde negro grueso del medallón */}
      <circle
        cx="24"
        cy="24"
        r="11"
        fill="#ffffff"
        stroke="#111827"
        strokeWidth="3.5"
      />
      {/* Letra S con contorno negro para contraste */}
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontSize="15"
        fontWeight="900"
        fill={letterColor}
        paintOrder="stroke"
        stroke="#ffffff"
        strokeWidth="1.2"
      >
        S
      </text>
    </g>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Overlay PRÓTESIS — anillo APaisado (elíptico) más grande que corona */
/* ──────────────────────────────────────────────────────────────────── */
function ProsthesisRingOverlay({
  status,
}: {
  status: 'protesisBuena' | 'protesisMala'
}) {
  const color =
    status === 'protesisBuena'
      ? 'var(--odonto-protesis-buena)'
      : 'var(--odonto-protesis-mala)'
  return (
    <g className={styles.toothRingOverlay} aria-hidden="true">
      <rect
        x="-1"
        y="9"
        width="50"
        height="32"
        rx="18"
        ry="17"
        fill="none"
        stroke={color}
        strokeWidth="5.5"
      />
    </g>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  IMPLANTE — SVG de tornillo dental (cabeza arriba, tornillo abajo) */
/*  Flip vertical solo en el arco superior para alinearse.           */
/* ──────────────────────────────────────────────────────────────────── */
function ImplantSvg({ status }: { status: 'implanteBueno' | 'implanteMalo' }) {
  const fill =
    status === 'implanteBueno'
      ? 'var(--odonto-implante-bueno)'
      : 'var(--odonto-implante-malo)'
  const stroke =
    status === 'implanteBueno'
      ? 'var(--odonto-corona-buena)'
      : 'var(--odonto-corona-mala)'
  return (
    <g className={styles.implant}>
      {/* Cabeza (cuadrado) — zona de la corona */}
      <rect
        x="9"
        y="8"
        width="30"
        height="28"
        rx="5"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
      />
      {/* Tornillo (cuerpo + roscas) */}
      <rect
        x="16"
        y="36"
        width="16"
        height="52"
        rx="3"
        fill="#ffffff"
        stroke={stroke}
        strokeWidth="1.6"
      />
      {/* Roscas (líneas diagonales en zig-zag) */}
      <g stroke={stroke} strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M16 44 L32 48" />
        <path d="M16 52 L32 56" />
        <path d="M16 60 L32 64" />
        <path d="M16 68 L32 72" />
        <path d="M16 76 L32 80" />
      </g>
      {/* Punta cónica */}
      <polygon
        points="16,88 32,88 24,96"
        fill="#ffffff"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </g>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Componente Tooth                                                  */
/* ──────────────────────────────────────────────────────────────────── */
interface ToothProps {
  tooth: ToothNumber
  upper: boolean
  deciduous: boolean
  statuses: ToothPartStatuses | undefined
  disabled: boolean
  onSelect: (tooth: ToothNumber, part: ToothPart) => void
}

export const Tooth = memo(function Tooth({
  tooth,
  upper,
  deciduous,
  statuses,
  disabled,
  onSelect,
}: ToothProps) {
  const geoms = useMemo(() => faceGeoms(tooth, deciduous), [deciduous, tooth])
  const override = useMemo(() => resolveOverride(statuses), [statuses])

  // Todos los overlays (excepto Implante completo) van en la zona corona (48x48).
  const rootTransform = upper ? undefined : 'translate(0,96) scale(1,-1)'
  const crownTransform = `translate(0,${upper ? 48 : 0})`
  const implantFlip = upper ? 'translate(0,96) scale(1,-1)' : undefined
  const overlayZone = `translate(0,${upper ? 48 : 0})` // zona 48x48 de la corona

  // Atenuación: solo la cruz "apaga" visualmente el diente de base
  const dimTooth = override.kind === 'cross'
  // Implante = borramos completamente diente normal (SVG reemplazante)
  const skipTooth = override.kind === 'implant'

  return (
    <div className={styles.tooth}>
      <span className={styles.toothNumber}>{tooth}</span>
      <svg
        className={styles.toothSvg}
        viewBox="0 0 48 96"
        role="group"
        aria-label={`Diente ${tooth}`}
      >
        {/* Diente original (corona + raíz) */}
        {!skipTooth && (
          <g className={dimTooth ? styles.dimTooth : undefined}>
            <g transform={rootTransform}>
              {geoms
                .filter((geom) => geom.part === 'root')
                .map((geom) => (
                  <ToothFace
                    key={geom.part}
                    tooth={tooth}
                    part={geom.part}
                    d={geom.d}
                    status={statuses?.[geom.part] ?? 'normal'}
                    disabled={disabled}
                    onSelect={onSelect}
                  />
                ))}
            </g>
            <g transform={crownTransform}>
              {geoms
                .filter((geom) => geom.part !== 'root')
                .map((geom) => (
                  <ToothFace
                    key={geom.part}
                    tooth={tooth}
                    part={geom.part}
                    points={geom.points}
                    status={statuses?.[geom.part] ?? 'normal'}
                    disabled={disabled}
                    onSelect={onSelect}
                  />
                ))}
            </g>
          </g>
        )}

        {/* Overlays EN LA ZONA CORONA (48x48 local) — no bloquean clicks */}
        {(override.kind === 'cross' ||
          override.kind === 'crown' ||
          override.kind === 'sellado' ||
          override.kind === 'prosthesis') && (
          <g transform={overlayZone}>
            {override.kind === 'cross' && (
              <CrossOverlay status={override.status} />
            )}
            {override.kind === 'crown' && (
              <CrownRingOverlay status={override.status} />
            )}
            {override.kind === 'sellado' && (
              <SelladoMarkOverlay status={override.status} />
            )}
            {override.kind === 'prosthesis' && (
              <ProsthesisRingOverlay status={override.status} />
            )}
          </g>
        )}

        {/* Implante (reemplaza todo el diente) */}
        {override.kind === 'implant' && (
          <g transform={implantFlip}>
            <ImplantSvg status={override.status} />
            {/* Superficie clickeable invisible que cubre todo el implante, */}
            {/* para que onSelect siga propagando a la raíz.                */}
            <rect
              x="0"
              y="0"
              width="48"
              height="96"
              fill="transparent"
              className={styles.implantHit}
              onClick={disabled ? undefined : () => onSelect(tooth, 'root')}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
              aria-hidden="true"
            />
          </g>
        )}
      </svg>
    </div>
  )
})
