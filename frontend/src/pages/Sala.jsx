import { Link, useParams } from 'react-router-dom'

function Sala({ usuario }) {
  const { code } = useParams()

  return (
    <div className="relative z-10 flex flex-col items-center">
      <p className="text-xs uppercase tracking-widest text-neutral-500">sala</p>
      <h1 className="mt-2 font-mono text-5xl font-semibold tracking-widest text-violet-300">
        {code}
      </h1>
      <p className="mt-6 text-sm text-neutral-500">
        {usuario ? `estás dentro como ${usuario.id.slice(0, 8)}` : 'conectando…'}
      </p>

      <Link
        to="/"
        className="mt-10 text-sm text-neutral-500 transition-colors hover:text-violet-400"
      >
        ← volver al inicio
      </Link>
    </div>
  )
}

export default Sala