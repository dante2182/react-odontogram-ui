import { memo, useMemo } from 'react'
import type { ToothNumber, ToothPart, ToothPartStatuses } from '../../types'
import { faceGeoms } from './data'
import styles from './Odontogram.module.css'
import { ToothFace } from './ToothFace'

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
  const rootTransform = upper ? undefined : 'translate(0,96) scale(1,-1)'
  const crownTransform = `translate(0,${upper ? 48 : 0})`

  return (
    <div className={styles.tooth}>
      <span className={styles.toothNumber}>{tooth}</span>
      <svg
        className={styles.toothSvg}
        viewBox="0 0 48 96"
        role="group"
        aria-label={`Diente ${tooth}`}
      >
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
      </svg>
    </div>
  )
})
