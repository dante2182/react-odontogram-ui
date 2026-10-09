import { useState } from 'react'
import { Odontogram } from './components/Odontogram/Odontogram'
import type { OdontogramValue } from './types'

function App() {
  const [value, setValue] = useState<OdontogramValue>({})

  return (
    <main style={{ maxWidth: 1250, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>odontogram-ui</h1>
      <p>
        Dev playground · Formato MINSA · Numeración FDI · Dentición permanente y
        temporal
      </p>
      <Odontogram value={value} onChange={setValue} />
      <pre style={{ marginTop: '1.5rem' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    </main>
  )
}

export default App