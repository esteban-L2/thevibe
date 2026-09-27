import { useEffect, useState } from 'react'

function App() {
  const [estado, setEstado] = useState('consultando...')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data) => setEstado(data.status))
      .catch((err) => setEstado('error: ' + err.message))
  }, [])

  return (
    <div>
      <h1>thevibe</h1>
      <p>Backend: {estado}</p>
    </div>
  )
}

export default App