import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          Mattos Incorporadora
        </h1>

        <p className="text-zinc-400 mb-8">
          Protótipo Next.js baseado no projeto Streamlit
        </p>

        <Link
          href="/login"
          className="px-6 py-4 rounded-2xl bg-emerald-500 text-black font-semibold"
        >
          Acessar sistema
        </Link>
      </div>
    </div>
  )
}