import { memo, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import type { ToothNumber, ToothPart, ToothStatus } from '../../types'
import { faceLabel } from './data'
import styles from './Odontogram.module.css'

interface ToothFaceProps {
  tooth: ToothNumber
  part: ToothPart
  points?: string
  d?: string
  status: ToothStatus
  disabled: boolean
  onSelect: (tooth: ToothNumber, part: ToothPart) => void
}

export const ToothFace = memo(function ToothFace({
  tooth,
  part,
  points,
  d,
  status,
  disabled,
  onSelect,
}: ToothFaceProps) {
  const handleSelect = useCallback(() => {
    onSelect(tooth, part)
  }, [onSelect, part, tooth])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleSelect()
      }
    },
    [handleSelect],
  )

  const commonProps = {
    className: styles.part,
    'data-part': part,
    'data-status': status,
    role: 'button' as const,
    tabIndex: disabled ? -1 : 0,
    'aria-label': `Diente ${tooth} · ${faceLabel(part)}`,
    'aria-pressed': status !== 'normal',
    'aria-disabled': disabled,
    onKeyDown: disabled ? undefined : handleKeyDown,
    onClick: disabled ? undefined : handleSelect,
  }

  return (
    <g {...commonProps}>
      {d ? <path d={d} /> : <polygon points={points} />}
      <title>{`Diente ${tooth} · ${faceLabel(part)}`}</title>
    </g>
  )
})
