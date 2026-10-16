import { describe, expect, it } from 'vitest'
import type { OdontogramValue } from '../../types'
import schemaRaw from '../../../schema/odontogram.schema.json?raw'
import {
  diffValues,
  isEmptyValue,
  isEqualValue,
  migrateValue,
  normalizeValue,
  SCHEMA_VERSION,
  TOOTH_PARTS,
  TOOTH_STATUSES,
  VALID_TEETH,
  validateValue,
} from './serialization'

/* ────────────────────────────────────────────────────────────────────── */
/*  Minimal JSON Schema (2020-12) evaluator, enough for the emitted file  */
/* ────────────────────────────────────────────────────────────────────── */

interface SchemaNode {
  title?: string
  type?: string
  enum?: readonly unknown[]
  properties?: Record<string, SchemaNode>
  additionalProperties?: boolean | SchemaNode
  propertyNames?: SchemaNode
  $ref?: string
  $defs?: Record<string, SchemaNode>
}

function resolveRef(root: SchemaNode, ref: string): SchemaNode | undefined {
  const match = /^#\/\$defs\/(.+)$/.exec(ref)
  return match ? root.$defs?.[match[1]] : undefined
}

function check(schema: SchemaNode, value: unknown, root: SchemaNode): boolean {
  if (schema.$ref) {
    const target = resolveRef(root, schema.$ref)
    return target ? check(target, value, root) : false
  }
  if (schema.enum && !schema.enum.includes(value)) return false

  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false
    }
    const record = value as Record<string, unknown>

    if (schema.propertyNames) {
      for (const key of Object.keys(record)) {
        if (!check(schema.propertyNames, key, root)) return false
      }
    }
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (key in record && !check(sub, record[key], root)) return false
    }
    if (schema.additionalProperties !== undefined) {
      for (const key of Object.keys(record)) {
        if (key in (schema.properties ?? {})) continue
        const extra = schema.additionalProperties
        if (extra === false) return false
        if (extra !== true && !check(extra, record[key], root)) return false
      }
    }
  }
  return true
}

const schema = JSON.parse(schemaRaw) as SchemaNode

const matchesSchema = (value: unknown): boolean => check(schema, value, schema)

/* ────────────────────────────────────────────────────────────────────── */
/*  validateValue                                                        */
/* ────────────────────────────────────────────────────────────────────── */

describe('validateValue', () => {
  it('accepts a valid value', () => {
    expect(
      validateValue({ 18: { root: 'caries', vestibular: 'restaurado' } }),
    ).toEqual([])
  })

  it('accepts an empty object', () => {
    expect(validateValue({})).toEqual([])
  })

  it('accepts deciduous teeth and empty tooth objects', () => {
    expect(validateValue({ 85: { occlusal: 'selladoBueno' }, 61: {} })).toEqual(
      [],
    )
  })

  it('rejects non object inputs', () => {
    expect(validateValue(null)).not.toEqual([])
    expect(validateValue([])).not.toEqual([])
    expect(validateValue('nope')).not.toEqual([])
    expect(validateValue(42)).not.toEqual([])
    expect(validateValue(undefined)).not.toEqual([])
  })

  it('rejects invalid tooth keys', () => {
    for (const key of ['19', '99', 'abc', '016', '1.5', '10', '']) {
      const errors = validateValue({ [key]: { root: 'caries' } })
      expect(errors, `expected "${key}" to be rejected`).not.toEqual([])
    }
  })

  it('rejects invalid parts and statuses', () => {
    expect(validateValue({ 11: { nope: 'caries' } })).not.toEqual([])
    expect(validateValue({ 11: { root: 'bogus' } })).not.toEqual([])
    expect(validateValue({ 11: { root: 5 } })).not.toEqual([])
  })

  it('rejects a non object tooth payload', () => {
    expect(validateValue({ 11: 'caries' })).not.toEqual([])
    expect(validateValue({ 11: null })).not.toEqual([])
    expect(validateValue({ 11: [] })).not.toEqual([])
  })

  it('rejects dangerous keys', () => {
    for (const key of ['__proto__', 'constructor', 'prototype']) {
      const errors = validateValue(JSON.parse(`{"${key}":{"root":"caries"}}`))
      expect(errors, `expected "${key}" to be rejected`).not.toEqual([])
    }
  })
})

/* ────────────────────────────────────────────────────────────────────── */
/*  JSON Schema <-> validateValue agreement                              */
/* ────────────────────────────────────────────────────────────────────── */

describe('odontogram.schema.json', () => {
  it('is generated for the current schema version', () => {
    expect(schema.title).toBe('OdontogramValue')
    expect(VALID_TEETH).toHaveLength(52)
    expect(TOOTH_PARTS).toHaveLength(6)
    expect(TOOTH_STATUSES).toContain('restaurado')
    expect(TOOTH_STATUSES).not.toContain('treated')
  })

  const cases: { name: string; value: unknown; valid: boolean }[] = [
    { name: 'empty object', value: {}, valid: true },
    {
      name: 'single face',
      value: { 18: { root: 'caries' } },
      valid: true,
    },
    { name: 'normal status', value: { 18: { root: 'normal' } }, valid: true },
    {
      name: 'deciduous tooth',
      value: { 85: { vestibular: 'implanteBueno' } },
      valid: true,
    },
    { name: 'empty tooth', value: { 11: {} }, valid: true },
    { name: 'null', value: null, valid: false },
    { name: 'array', value: [], valid: false },
    { name: 'string', value: 'x', valid: false },
    {
      name: 'invalid tooth 19',
      value: { 19: { root: 'caries' } },
      valid: false,
    },
    {
      name: 'invalid tooth 99',
      value: { 99: { root: 'caries' } },
      valid: false,
    },
    {
      name: 'non numeric key',
      value: { abc: { root: 'caries' } },
      valid: false,
    },
    {
      name: 'leading zero key',
      value: { '016': { root: 'caries' } },
      valid: false,
    },
    {
      name: 'invalid part',
      value: { 11: { nope: 'caries' } },
      valid: false,
    },
    {
      name: 'invalid status',
      value: { 11: { root: 'bogus' } },
      valid: false,
    },
    {
      name: '__proto__ key',
      value: JSON.parse('{"__proto__":{"root":"caries"}}'),
      valid: false,
    },
    { name: 'tooth is a string', value: { 11: 'caries' }, valid: false },
  ]

  it.each(cases)('agrees with validateValue: $name', ({ value, valid }) => {
    const errors = validateValue(value)
    expect(errors.length === 0).toBe(valid)
    expect(matchesSchema(value)).toBe(valid)
  })
})

/* ────────────────────────────────────────────────────────────────────── */
/*  normalizeValue                                                       */
/* ────────────────────────────────────────────────────────────────────── */

describe('normalizeValue', () => {
  it('drops normal and undefined parts', () => {
    const value: OdontogramValue = {
      18: { root: 'normal', occlusal: 'caries' },
    }
    expect(normalizeValue(value)).toEqual({ 18: { occlusal: 'caries' } })
  })

  it('drops teeth left without parts', () => {
    expect(normalizeValue({ 18: { root: 'normal' }, 21: {} })).toEqual({})
  })

  it('does not mutate its input', () => {
    const value: OdontogramValue = {
      48: { root: 'caries', occlusal: 'normal' },
    }
    const snapshot = structuredClone(value)
    normalizeValue(value)
    expect(value).toEqual(snapshot)
  })

  it('returns a stable ascending key order', () => {
    const result = normalizeValue({
      48: { occlusal: 'caries' },
      11: { root: 'caries' },
      21: { root: 'restaurado' },
    })
    expect(Object.keys(result)).toEqual(['11', '21', '48'])
  })

  it('keeps the six parts of a whole-tooth mode untouched', () => {
    const whole: OdontogramValue = {
      18: {
        root: 'extraido',
        vestibular: 'extraido',
        lingual: 'extraido',
        mesial: 'extraido',
        distal: 'extraido',
        occlusal: 'extraido',
      },
    }
    expect(normalizeValue(whole)).toEqual(whole)
  })
})

/* ────────────────────────────────────────────────────────────────────── */
/*  migrateValue                                                         */
/* ────────────────────────────────────────────────────────────────────── */

describe('migrateValue', () => {
  it('renames the v1 `treated` status to `restaurado`', () => {
    const old = { 18: { root: 'treated', occlusal: 'caries' } }
    expect(migrateValue(old, 1)).toEqual({
      18: { root: 'restaurado', occlusal: 'caries' },
    })
  })

  it('is idempotent at the current version', () => {
    const current: OdontogramValue = { 18: { root: 'restaurado' } }
    expect(migrateValue(current, SCHEMA_VERSION)).toEqual(current)
    expect(migrateValue(current)).toEqual(current)
  })

  it('handles an empty / non object input without throwing', () => {
    expect(migrateValue({}, 1)).toEqual({})
    expect(migrateValue(undefined)).toBeUndefined()
    expect(migrateValue(null)).toBeNull()
  })

  it('keeps unknown statuses so validateValue can report them', () => {
    const value = migrateValue({ 11: { root: 'bogus' } }, 1)
    expect(value).toEqual({ 11: { root: 'bogus' } })
    expect(validateValue(value)).not.toEqual([])
  })
})

/* ────────────────────────────────────────────────────────────────────── */
/*  diffValues / isEqualValue / isEmptyValue                             */
/* ────────────────────────────────────────────────────────────────────── */

describe('diffValues / isEqualValue', () => {
  it('detects an added tooth', () => {
    expect(diffValues({}, { 11: { root: 'caries' } })).toEqual([11])
  })

  it('detects a removed tooth', () => {
    expect(diffValues({ 11: { root: 'caries' } }, {})).toEqual([11])
  })

  it('detects a modified tooth', () => {
    expect(
      diffValues({ 11: { root: 'caries' } }, { 11: { root: 'restaurado' } }),
    ).toEqual([11])
  })

  it('ignores key order and normal entries', () => {
    const a: OdontogramValue = {
      11: { root: 'caries', occlusal: 'restaurado' },
    }
    const b: OdontogramValue = {
      11: { occlusal: 'restaurado', root: 'caries' },
    }
    expect(diffValues(a, b)).toEqual([])
    expect(isEqualValue(a, b)).toBe(true)
    expect(isEqualValue({ 11: { root: 'normal' } }, {})).toBe(true)
  })

  it('sorts the changed teeth ascending', () => {
    expect(
      diffValues({}, { 48: { root: 'caries' }, 11: { root: 'caries' } }),
    ).toEqual([11, 48])
  })
})

describe('isEmptyValue', () => {
  it('is true for empty / normal-only values', () => {
    expect(isEmptyValue({})).toBe(true)
    expect(isEmptyValue({ 11: { root: 'normal' } })).toBe(true)
  })

  it('is false when a tooth holds a real status', () => {
    expect(isEmptyValue({ 11: { root: 'caries' } })).toBe(false)
  })
})
