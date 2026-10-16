# odontogram-ui

A React component library for rendering interactive dental odontograms,
modeled after the Peruvian **MINSA** format with **FDI** tooth numbering.

- ⚛️ React 18+ (peer dependency)
- 🧩 TypeScript with generated type declarations
- 🎨 CSS Modules (exported as a single stylesheet), light-mode theme with customizable CSS variables
- 🦷 Permanent + deciduous dentition, part-level painting (root + 5 crown faces) and 14 whole-tooth clinical statuses
- 🛠️ Utility exports (countStatuses, nextStatus, faceGeoms, TEETH_ROWS, …)
- 🧪 Pure serialization helpers — `validateValue`, `normalizeValue`, `migrateValue`, `diffValues` — plus a framework-free `odontogram-ui/validate` entry point and a JSON Schema
- 📦 ESM + CJS builds
- ✅ Tested with Vitest + React Testing Library

## Installation

```bash
pnpm add odontogram-ui
# or
npm install odontogram-ui
```

React and React DOM are peer dependencies:

```bash
pnpm add react react-dom
```

## Usage

```tsx
import { useState } from 'react'
import { Odontogram } from 'odontogram-ui'
import type { OdontogramValue } from 'odontogram-ui'
import 'odontogram-ui/style.css'

export function DentalChart() {
  const [value, setValue] = useState<OdontogramValue>({})

  return <Odontogram value={value} onChange={setValue} />
}
```

### Uncontrolled

```tsx
import { Odontogram } from 'odontogram-ui'
import 'odontogram-ui/style.css'

export function ReadOnlyChart() {
  return (
    <Odontogram
      readOnly
      defaultValue={{
        18: { root: 'caries', vestibular: 'restaurado' },
        48: { occlusal: 'restaurado' },
      }}
    />
  )
}
```

## API

### `<Odontogram />`

| Prop             | Type                                  | Default    | Description                                                       |
| ---------------- | ------------------------------------- | ---------- | ----------------------------------------------------------------- |
| `value`          | `OdontogramValue`                     | —          | Controlled value. When provided the component is controlled.      |
| `defaultValue`   | `OdontogramValue`                     | `{}`       | Initial value for the uncontrolled component.                     |
| `onChange`       | `(value: OdontogramValue) => void`    | —          | Called with the updated value after a part is painted.            |
| `onPartChange`   | `(event: PartChangeEvent) => void`    | —          | Called once per click, only when the clicked part really changed. |
| `highlightTeeth` | `number[]`                            | —          | Tooth numbers to highlight (e.g. the result of `diffValues`).     |
| `mode`           | `PaintMode`                           | —          | Controlled paint mode.                                            |
| `defaultMode`    | `PaintMode`                           | `'caries'` | Initial mode for the uncontrolled mode state.                     |
| `onModeChange`   | `(mode: PaintMode) => void`           | —          | Called when the paint mode changes.                               |
| `showToolbar`    | `boolean`                             | `true`     | Show the mode legend, the reset button and the part counters.     |
| `dentition`      | `'all' \| 'permanent' \| 'deciduous'` | `'all'`    | Which tooth rows to render (52 / 32 / 20).                        |
| `disabled`       | `boolean`                             | `false`    | Disables all interactions.                                        |
| `readOnly`       | `boolean`                             | `false`    | Renders the chart without allowing interaction.                   |
| `className`      | `string`                              | —          | Extra class applied to the root element.                          |

### `onPartChange`

`onPartChange` reports the exact transition of a single click, which is handy for
auditing or versioning a consultation:

```tsx
<Odontogram
  value={value}
  onChange={setValue}
  onPartChange={({ tooth, part, from, to }) => {
    console.log(`Diente ${tooth} · ${part}: ${from} → ${to}`)
  }}
/>
```

- It fires **once per click**, alongside `onChange`, and only when `from !== to`.
- It is not fired when the component is `readOnly` or `disabled`.
- For whole-tooth modes (extraído, implante, corona, sellado, prótesis…) `part`
  is the part that was clicked and `from` / `to` describe that same part.

### `highlightTeeth`

Highlights specific teeth without affecting the stored value. Combined with
`diffValues` it is perfect to show what changed between two saved versions:

```tsx
import { diffValues } from 'odontogram-ui'

const changed = diffValues(previousVersion, currentVersion)

<Odontogram value={currentVersion} readOnly highlightTeeth={changed} />
```

Highlighted teeth get `data-highlighted="true"` and are styled through the
`--odonto-highlight` CSS variable (see [Theming](#theming)).

### Paint modes

Each legend chip paints a **direct** status (no cycling):

- `caries` and `restaurado` paint a single part; clicking a painted part again
  clears it.
- `sano` always clears the clicked part back to `normal` (eraser).
- The remaining modes are **whole-tooth** modes: `extraido`, `aExtraer`,
  `ausente`, `implanteBueno`, `implanteMalo`, `coronaBuena`, `coronaMala`,
  `selladoBueno`, `selladoMalo`, `protesisBuena`, `protesisMala`. One click
  applies the status to the six parts of the tooth (and clicking again clears
  it).

### Types

```ts
type ToothStatus =
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

type ToothPart =
  'root' | 'vestibular' | 'lingual' | 'mesial' | 'distal' | 'occlusal'

type ToothPartStatuses = Partial<Record<ToothPart, ToothStatus>>

type OdontogramValue = Partial<Record<number, ToothPartStatuses>>

type PaintMode = Exclude<ToothStatus, 'normal'> | 'sano'

interface PartChangeEvent {
  tooth: number
  part: ToothPart
  from: ToothStatus
  to: ToothStatus
}
```

Every tooth renders 6 individually paintable SVG parts: the root and the five
crown faces. The mesial/distal faces are mapped automatically from the FDI
quadrant.

## Theming

The component exposes CSS custom properties that can be overridden using the
`className` prop or a wrapper selector:

```css
.my-dental-chart {
  --odonto-bg: #eef2f6;
  --odonto-card: #f8fafc;
  --odonto-text: #1f2937;
  --odonto-muted: #64748b;
  --odonto-line: #1f2937;
  --odonto-tooth: #ffffff;
  --odonto-border: #d5dce5;

  /* Clinical palette */
  --odonto-caries: #ef4444;
  --odonto-restaurado: #3b82f6;
  --odonto-extraido: #4f46e5;
  --odonto-a-extraer: #f87171;
  --odonto-ausente: #374151;
  --odonto-corona-buena: #2563eb;
  --odonto-corona-mala: #dc2626;
  --odonto-sellado-bueno: #1d4ed8;
  --odonto-sellado-malo: #b91c1c;
  --odonto-protesis-buena: #2563eb;
  --odonto-protesis-mala: #dc2626;
  --odonto-implante-bueno: #60a5fa;
  --odonto-implante-malo: #f87171;

  /* Highlight used by `highlightTeeth` */
  --odonto-highlight: #f59e0b;
}
```

```tsx
<Odontogram className="my-dental-chart" />
```

## Extras

Helper utilities are available from the package entry point:

```ts
import {
  countStatuses, // counts parts grouped by clinical status
  nextStatus, // computes the next status given the current one and mode
  faceLabel, // localized face name (Spanish)
  faceGeoms, // geometry definitions for a tooth's 6 paintable parts
  mesialSide, // 'left' | 'right' — where the mesial face sits for an FDI number
  quadrantOf, // extracts the FDI quadrant from a tooth number
  rootPath, // SVG path for a tooth root
  TEETH_ROWS, // layout rows for permanent + deciduous arches
} from 'odontogram-ui'
```

The persisted-value helpers are also exported from the main entry point:

```ts
import {
  SCHEMA_VERSION, // current persisted schema version (2)
  TOOTH_PARTS, // ['root', 'vestibular', …]
  TOOTH_STATUSES, // the 14 clinical statuses
  validateValue,
  normalizeValue,
  migrateValue,
  diffValues,
  isEqualValue,
  isEmptyValue,
} from 'odontogram-ui'
```

## Integración con un backend

La librería **no hace llamadas de red ni conoce ningún backend**: solo recibe
`value` / `defaultValue` y emite `onChange` / `onPartChange`. Guardar, cargar,
versionar y transportar los datos es responsabilidad de la app consumidora.

### Flujo recomendado

```ts
import {
  Odontogram,
  migrateValue,
  normalizeValue,
  SCHEMA_VERSION,
} from 'odontogram-ui'

// 1. Al cargar la versión guardada de la consulta:
//    migra desde la versión en la que fue guardada hasta la actual.
const value = migrateValue(row.odontogram, row.schema_version)

// 2. Render controlado:
<Odontogram value={value} onChange={setValue} />

// 3. Al guardar: limpia el payload y anota la versión junto a los datos.
const payload = normalizeValue(value)
// POST { odontogram: payload, schema_version: SCHEMA_VERSION }
```

1. La librería **no** hace peticiones de red; la app guarda y carga.
2. Flujo: cargar → `migrateValue` → `<Odontogram value onChange />` → al guardar
   `normalizeValue` + `SCHEMA_VERSION` → el backend ejecuta `validateValue`.
3. Guarda **una versión por consulta** (no sobrescribas la anterior) y **no**
   hagas un `POST` en cada `onChange`.
4. En Node usa `odontogram-ui/validate`; en otros lenguajes usa el JSON Schema.
5. Historial: renderiza versiones antiguas con `readOnly` y resalta las
   diferencias con `diffValues` + `highlightTeeth`.
6. `onPartChange` y `highlightTeeth` están documentados en la
   [tabla de props](#odontogram-).

### Validar en Node/TypeScript (`odontogram-ui/validate`)

El subpath `odontogram-ui/validate` reexporta SOLO las utilidades puras (sin
React ni CSS), de modo que un backend puede importarlo sin cargar el
componente:

```ts
import {
  validateValue,
  normalizeValue,
  SCHEMA_VERSION,
} from 'odontogram-ui/validate'

const errors = validateValue(body.odontogram)
if (errors.length > 0) {
  return res.status(422).json({ errors })
}

const payload = normalizeValue(body.odontogram)
await db.query(
  'insert into consultations (odontogram, schema_version) values ($1, $2)',
  [payload, SCHEMA_VERSION],
)
```

`validateValue` nunca lanza: devuelve una lista de errores legibles (vacía si el
payload es válido).

### Validar en otros lenguajes (JSON Schema)

El paquete publica `odontogram-ui/schema.json`
([`schema/odontogram.schema.json`](./schema/odontogram.schema.json)), un
[JSON Schema draft 2020-12](https://json-schema.org/draft/2020-12) generado a
partir de las mismas constantes que usa `validateValue`, de modo que ambos dan
exactamente el mismo resultado:

```json
{
  "type": "object",
  "propertyNames": { "enum": ["11", "12", "…", "85"] },
  "additionalProperties": { "$ref": "#/$defs/tooth" },
  "$defs": {
    "tooth": {
      "type": "object",
      "properties": { "root": { "$ref": "#/$defs/status" }, "…": {} },
      "additionalProperties": false
    },
    "status": { "enum": ["normal", "caries", "restaurado", "…"] }
  }
}
```

### Historial de versiones

```tsx
import { Odontogram, diffValues, type OdontogramValue } from 'odontogram-ui'

export function History({
  previous,
  current,
}: {
  previous: OdontogramValue
  current: OdontogramValue
}) {
  return (
    <Odontogram
      readOnly
      value={current}
      highlightTeeth={diffValues(previous, current)}
    />
  )
}
```

### Versionado del esquema

`SCHEMA_VERSION` (actualmente `2`) viaja junto a los datos guardados. Al leer,
pasa la versión con la que se guardó a `migrateValue(value, fromVersion)` para
aplicar las migraciones encadenadas (por ejemplo, el estado `treated` de la
versión `0.1.x` se renombró a `restaurado` en el esquema `v2`).

## Development

```bash
pnpm install
pnpm dev           # playground at http://localhost:5173
pnpm build         # build the library to dist/ (also emits schema/)
pnpm test          # run tests in watch mode
pnpm test:run      # run tests once
pnpm lint          # lint the project
pnpm format        # format the project with Prettier
pnpm format:check  # verify formatting without writing
pnpm typecheck     # typecheck the project
```

### Editor setup

The project uses [Prettier](https://prettier.io) (single quotes, no
semicolons) and ESLint. Install the recommended VS Code extensions
(**Prettier** and **ESLint**) when prompted, then saving a file (`Ctrl+S`)
formats it and applies ESLint fixes automatically. Files are also formatted and
linted before every commit via Husky + lint-staged.

## License

[MIT](./LICENSE) © dante2182
