/**
 * Generates `schema/odontogram.schema.json` from the runtime constants so the
 * JSON Schema and `validateValue` can never drift apart.
 *
 * It runs as part of the build (`postbuild`) and imports the already-built
 * `dist/validate.js`, which is framework-free (no React, no CSS).
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const { TOOTH_PARTS, TOOTH_STATUSES, VALID_TEETH, SCHEMA_VERSION } =
  await import(new URL('../dist/validate.js', import.meta.url))

/** A tooth: an object whose keys are parts and values are statuses. */
const toothSchema = {
  type: 'object',
  description:
    'Un diente: mapa de parte (root, vestibular, lingual, mesial, distal, occlusal) a estado clínico.',
  properties: Object.fromEntries(
    TOOTH_PARTS.map((part) => [part, { $ref: '#/$defs/status' }]),
  ),
  additionalProperties: false,
}

const schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://github.com/dante2182/odontogram-ui/schema/odontogram.schema.json',
  title: 'OdontogramValue',
  description: `Odontograma persistido por consulta (esquema v${SCHEMA_VERSION}). Las claves son dientes FDI y los valores son mapas de parte a estado.`,
  type: 'object',
  propertyNames: {
    enum: VALID_TEETH.map(String),
  },
  additionalProperties: { $ref: '#/$defs/tooth' },
  $defs: {
    tooth: toothSchema,
    status: {
      description: 'Estado clínico de una parte del diente.',
      enum: [...TOOTH_STATUSES],
    },
  },
}

const outFile = resolve(root, 'schema/odontogram.schema.json')
await mkdir(dirname(outFile), { recursive: true })
await writeFile(outFile, `${JSON.stringify(schema, null, 2)}\n`)

console.log(
  `schema/odontogram.schema.json · v${SCHEMA_VERSION} · ${VALID_TEETH.length} dientes · ${TOOTH_STATUSES.length} estados`,
)
