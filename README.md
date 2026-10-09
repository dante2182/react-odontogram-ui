# odontogram-ui

A React component library for rendering interactive dental odontograms,
modeled after the Peruvian **MINSA** format with **FDI** tooth numbering.

- ⚛️ React 18+ (peer dependency)
- 🧩 TypeScript with generated type declarations
- 🎨 CSS Modules (exported as a single stylesheet), light-mode theme with customizable CSS variables
- 🦷 Permanent + deciduous dentition, part-level painting (root + 5 crown faces)
- 🛠️ Utility exports (countStatuses, nextStatus, faceGeoms, TEETH_ROWS, etc.)
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
  const [mode, setMode] = useState('cycle')

  return (
    <Odontogram
      value={value}
      onChange={setValue}
      mode={mode}
      onModeChange={setMode}
    />
  )
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
        18: { root: 'caries', vestibular: 'treated' },
        48: { occlusal: 'treated' },
      }}
    />
  )
}
```

## API

### `<Odontogram />`

| Prop           | Type                                  | Default   | Description                                                  |
| -------------- | ------------------------------------- | --------- | ------------------------------------------------------------ |
| `value`        | `OdontogramValue`                     | —         | Controlled value. When provided the component is controlled. |
| `defaultValue` | `OdontogramValue`                     | `{}`      | Initial value for the uncontrolled component.                |
| `onChange`     | `(value: OdontogramValue) => void`    | —         | Called with the updated value after a part is painted.       |
| `mode`         | `PaintMode`                           | —         | Controlled paint mode.                                       |
| `defaultMode`  | `PaintMode`                           | `'cycle'` | Initial mode for the uncontrolled mode state.                |
| `onModeChange` | `(mode: PaintMode) => void`           | —         | Called when the paint mode changes.                          |
| `showToolbar`  | `boolean`                             | `true`    | Show the paint-mode buttons, reset and part counters.        |
| `dentition`    | `'all' \| 'permanent' \| 'deciduous'` | `'all'`   | Which tooth rows to render (52 / 32 / 20).                   |
| `disabled`     | `boolean`                             | `false`   | Disables all interactions.                                   |
| `readOnly`     | `boolean`                             | `false`   | Renders the chart without allowing interaction.              |
| `className`    | `string`                              | —         | Extra class applied to the root element.                     |

### Paint modes

`cycle` cycles a clicked part through `normal → caries → treated → normal`.
`caries` / `treated` paint with that status (click again to unpaint).
`eraser` always sets the part back to `normal`.

### Types

```ts
type ToothStatus = 'normal' | 'caries' | 'treated'

type ToothPart =
  'root' | 'vestibular' | 'lingual' | 'mesial' | 'distal' | 'occlusal'

type ToothPartStatuses = Partial<Record<ToothPart, ToothStatus>>

type OdontogramValue = Partial<Record<number, ToothPartStatuses>>

type PaintMode = 'cycle' | 'caries' | 'treated' | 'eraser'
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
  --odonto-caries: #e5383b;
  --odonto-treated: #1d6fe0;
  --odonto-border: #d5dce5;
}
```

```tsx
<Odontogram className="my-dental-chart" />
```

## Extras

Helper utilities are available from the package entry point:

```ts
import {
  countStatuses, // counts caries/treated parts in a value
  nextStatus, // computes the next status given the current one and mode
  faceLabel, // localized face name (Spanish)
  faceGeoms, // geometry definitions for a tooth's 6 paintable parts
  mesialSide, // 'left' | 'right' — where the mesial face sits for an FDI number
  quadrantOf, // extracts the FDI quadrant from a tooth number
  rootPath, // SVG path for a tooth root
  TEETH_ROWS, // layout rows for permanent + deciduous arches
  CYCLE, // ['normal', 'caries', 'treated']
} from 'odontogram-ui'
```

## Development

```bash
pnpm install
pnpm dev           # playground at http://localhost:5173
pnpm build         # build the library to dist/
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
