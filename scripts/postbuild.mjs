import { writeFile } from 'node:fs/promises'

await writeFile('dist/odontogram-ui.css.d.ts', 'export {}\n')
