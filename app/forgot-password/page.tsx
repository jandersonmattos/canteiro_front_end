'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ForgotPasswordPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (
  e: React.FormEvent
) => {

  e.preventDefault()

  setLoading(true)

  setErrorMessage('')
  setSuccessMessage('')

  try {

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/forgot-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email
        })
      }
    )

    if (!response.ok) {

      const errorData = await response.json()

      setErrorMessage(
        errorData.detail || 'Erro ao enviar código.'
      )

      return
    }

    setSuccessMessage(
      'Se o e-mail existir, o código foi enviado.'
    )

    await new Promise(resolve =>
      setTimeout(resolve, 1500)
    )

    router.push(
      `/verify-code?email=${encodeURIComponent(email)}`
    )

  } catch (error) {

    console.error(error)

    setErrorMessage(
      'Erro ao conectar com servidor.'
    )

  } finally {

    setLoading(false)

  }
}

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* BACKGROUND */}
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

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/75" />

      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/90" />

      {/* CONTENT */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">

        <div className="w-full max-w-md">

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
                  w-40
                  h-40
                  rounded-[32px]
                  bg-emerald-500
                  flex
                  items-center
                  justify-center
                  shadow-2xl
                  shadow-emerald-500/30
                  p-5
                "
              >

                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={150}
                  height={150}
                  className="object-contain"
                />

              </div>

            </div>

            {/* HEADER */}
            <div className="text-center mb-8">

              <h1 className="text-3xl font-bold text-white mb-3">
                Recuperar senha
              </h1>

              <p className="text-zinc-300 leading-relaxed">
                Digite seu e-mail para receber um código de recuperação.
              </p>

            </div>

            {/* ALERTAS */}
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
                "
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                className="
                  mb-5
                  rounded-2xl
                  border
                  border-emerald-500/30
                  bg-emerald-500/10
                  px-4
                  py-3
                  text-sm
                  text-emerald-200
                "
              >
                {successMessage}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
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
                  required
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
                "
              >
                {loading
                  ? 'Enviando código...'
                  : 'Enviar código'}
              </button>

            </form>

            {/* VOLTAR */}
            <div className="mt-6 text-center">

              <button
                onClick={() => router.push('/login')}
                className="
                  text-sm
                  text-zinc-400
                  hover:text-white
                  transition-all
                "
              >
                Voltar para login
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}