'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    setErrorMessage('')
    setLoading(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      )

      if (!response.ok) {
        setErrorMessage(
          'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.'
        )

        setLoading(false)
        return
      }

      const data = await response.json()

      // salva token
      localStorage.setItem('token', data.token)

      // salva token em cookie para middleware validar autenticacao
      const secureCookie =
        typeof window !== 'undefined' && window.location.protocol === 'https:'

      document.cookie = `token=${encodeURIComponent(data.token)}; path=/; max-age=2592000; samesite=lax${secureCookie ? '; secure' : ''}`

      // salva usuário
      localStorage.setItem('user', JSON.stringify(data.user))

      // redireciona
      const nextPath = searchParams.get('next')
      const redirectTo = nextPath && nextPath.startsWith('/')
        ? nextPath
        : '/projects'

      router.push(redirectTo)

    } catch (error) {
      console.error(error)

      setErrorMessage(
        'Não foi possível conectar ao servidor. Tente novamente em instantes.'
      )

      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* BACKGROUND IMAGE */}
      <div
        className="
          absolute
          inset-0
          bg-cover
          bg-center
          scale-105
        "
        style={{
          backgroundImage: "url('/login-bg.png')"
        }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/75" />

      {/* GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/90" />

      {/* CONTENT */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* LOGIN CARD */}
          <div
            className="
              backdrop-blur-2xl
              bg-black/30
              border
              border-white/10
              rounded-[40px]
              p-10
              shadow-2xl
              shadow-black/60
            "
          >
            {/* LOGO */}
            <div className="flex justify-center mb-10">
              <div
                className="
                  w-48
                  h-48
                  rounded-[40px]
                  bg-white
                  flex
                  items-center
                  justify-center
                  shadow-2xl
                  shadow-black/40
                  p-6
                  border
                  border-white/20
                "
              >
                <Image
                  src="/logo.png"
                  alt="Logo Canteiro de Obras"
                  width={170}
                  height={170}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* HEADER */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-3 text-white">
                Bem-vindo de volta
              </h2>

              <p className="text-zinc-300 leading-relaxed">
                Plataforma de gestão para obras,
                financeiro e acompanhamento executivo.
              </p>
            </div>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div
                className="
                  mb-5
                  rounded-2xl
                  border
                  border-red-500/30
                  bg-red-500/10
                  px-4
                  py-3
                  text-sm
                  text-red-200
                  backdrop-blur-md
                "
              >
                {errorMessage}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm text-zinc-300 mb-2">
                  E-mail
                </label>

                <input
                  type="email"
                  placeholder="admin@canteiro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full
                    h-14
                    px-5
                    rounded-2xl
                    bg-white/10
                    border
                    border-white/10
                    text-white
                    placeholder:text-zinc-400
                    outline-none
                    transition-all
                    focus:border-emerald-500
                    focus:bg-white/15
                  "
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-zinc-300">
                    Senha
                  </label>

                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="
                      text-sm
                      text-emerald-400
                      hover:text-emerald-300
                      transition-all
                    "
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full
                    h-14
                    px-5
                    rounded-2xl
                    bg-white/10
                    border
                    border-white/10
                    text-white
                    placeholder:text-zinc-400
                    outline-none
                    transition-all
                    focus:border-emerald-500
                    focus:bg-white/15
                  "
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  h-14
                  rounded-2xl
                  bg-emerald-500
                  text-black
                  font-semibold
                  transition-all
                  hover:scale-[1.02]
                  hover:shadow-2xl
                  hover:shadow-emerald-500/40
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                {loading ? 'Entrando...' : 'Entrar na plataforma'}
              </button>
            </form>

            {/* FOOTER */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-zinc-400">
                Sistema inteligente para gestão de obras
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}