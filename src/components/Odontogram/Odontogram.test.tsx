import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { faceGeoms, mesialSide, rootPath, TEETH_ROWS } from './data'
import { Odontogram } from './Odontogram'
import styles from './Odontogram.module.css'

const teeth = TEETH_ROWS.flatMap((row) => [...row.left, ...row.right])

function parts(container: HTMLElement): Element[] {
  return Array.from(
    container.querySelectorAll('svg[role="group"] [role="button"]'),
  )
}

describe('data', () => {
  it('lists 52 teeth (32 permanent + 20 deciduous)', () => {
    expect(teeth).toHaveLength(52)
    const permanent = TEETH_ROWS.filter((row) => !row.deciduous)
    const deciduous = TEETH_ROWS.filter((row) => row.deciduous)
    expect(permanent.flatMap((r) => [...r.left, ...r.right])).toHaveLength(32)
    expect(deciduous.flatMap((r) => [...r.left, ...r.right])).toHaveLength(20)
  })

  it('maps mesial/distal faces per quadrant', () => {
    expect(mesialSide(18)).toBe('right')
    expect(mesialSide(11)).toBe('right')
    expect(mesialSide(21)).toBe('left')
    expect(mesialSide(48)).toBe('right')
    expect(mesialSide(31)).toBe('left')

    const mesial18 = faceGeoms(18, false).find((g) => g.part === 'mesial')
    const mesial21 = faceGeoms(21, false).find((g) => g.part === 'mesial')
    expect(mesial18?.points).toBe('48,0 48,48 34,34 34,14')
    expect(mesial21?.points).toBe('0,0 14,14 14,34 0,48')
  })

  it('uses the expected root outlines', () => {
    expect(rootPath(18, false)).toBe(
      'M3 46 L11 2 L17 40 L24 6 L31 40 L37 2 L45 46 Z',
    )
    expect(rootPath(48, false)).toBe('M4 46 L12 2 L24 36 L36 2 L44 46 Z')
    expect(rootPath(11, false)).toBe('M14 46 L24 2 L34 46 Z')
    expect(rootPath(55, true)).toBe('M14 46 L24 2 L34 46 Z')
  })
})

describe('Odontogram', () => {
  it('renders all 52 teeth with 6 paintable parts each', () => {
    const { container } = render(<Odontogram />)
    expect(container.querySelectorAll('svg[role="group"]')).toHaveLength(52)
    expect(parts(container)).toHaveLength(312)
  })

  it('filters rows by dentition', () => {
    const permanent = render(<Odontogram dentition="permanent" />)
    const deciduous = render(<Odontogram dentition="deciduous" />)
    expect(
      permanent.container.querySelectorAll('svg[role="group"]'),
    ).toHaveLength(32)
    expect(
      deciduous.container.querySelectorAll('svg[role="group"]'),
    ).toHaveLength(20)
  })

  it('cycles normal → caries → treated → normal on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Odontogram onChange={onChange} />)

    const part = screen.getByRole('button', { name: 'Diente 18 · Raíz' })
    await user.click(part)
    expect(onChange).toHaveBeenLastCalledWith({ 18: { root: 'caries' } })
    expect(part).toHaveAttribute('aria-pressed', 'true')

    await user.click(part)
    expect(onChange).toHaveBeenLastCalledWith({ 18: { root: 'treated' } })

    await user.click(part)
    expect(onChange).toHaveBeenLastCalledWith({})
    expect(part).toHaveAttribute('aria-pressed', 'false')
  })

  it('paints and unpaints with a fixed mode', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Odontogram mode="caries" onChange={onChange} />)

    const part = screen.getByRole('button', { name: 'Diente 48 · Oclusal' })
    await user.click(part)
    expect(onChange).toHaveBeenLastCalledWith({ 48: { occlusal: 'caries' } })

    await user.click(part)
    expect(onChange).toHaveBeenLastCalledWith({})
  })

  it('applies the eraser through the toolbar', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Odontogram
        defaultValue={{ 11: { root: 'caries' } }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Borrador' }))
    const part = screen.getByRole('button', { name: 'Diente 11 · Raíz' })
    expect(part).toHaveAttribute('data-status', 'caries')

    await user.click(part)
    expect(onChange).toHaveBeenLastCalledWith({})
  })

  it('switches paint mode from the toolbar', async () => {
    const user = userEvent.setup()
    render(<Odontogram />)

    const treatedButton = screen.getByRole('button', {
      name: 'Tratado / Buen estado',
    })
    expect(treatedButton).toHaveAttribute('aria-pressed', 'false')
    await user.click(treatedButton)
    expect(treatedButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Cíclico' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('resets the chart from the toolbar', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Odontogram onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Diente 21 · Mesial' }))
    await user.click(screen.getByRole('button', { name: 'Limpiar todo' }))
    expect(onChange).toHaveBeenLastCalledWith({})
  })

  it('shows part counters in the toolbar', () => {
    const { container } = render(
      <Odontogram
        defaultValue={{
          18: { root: 'caries', vestibular: 'treated' },
          48: { occlusal: 'caries' },
        }}
      />,
    )
    const values = Array.from(
      container.querySelectorAll(`.${styles.statValue}`),
    ).map((el) => el.textContent)
    expect(values).toEqual(['2', '1'])
    expect(
      screen.getByText('Caries / mal estado:', { exact: false }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Tratado / buen estado:', { exact: false }),
    ).toBeInTheDocument()
  })

  it('supports keyboard interaction', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Odontogram onChange={onChange} />)

    const part = screen.getByRole('button', { name: 'Diente 31 · Distal' })
    part.focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ 31: { distal: 'caries' } })
  })

  it('does not paint when disabled or readOnly', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Odontogram disabled onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Diente 18 · Raíz' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps a controlled value in sync with rendered DOM', () => {
    const { container } = render(
      <Odontogram value={{ 18: { root: 'caries' } }} />,
    )
    const part = within(container).getByRole('button', {
      name: 'Diente 18 · Raíz',
    })
    expect(part).toHaveAttribute('data-status', 'caries')
  })
})
