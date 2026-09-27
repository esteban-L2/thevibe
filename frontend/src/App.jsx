import { useEffect, useState } from 'react'

function App() {
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

  useEffect(() => {
    fetch(`${API_URL}/health`)
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