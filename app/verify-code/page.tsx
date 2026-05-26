'use client'

import Image from 'next/image'

import {
  useRouter,
  useSearchParams
} from 'next/navigation'

import {
  Suspense,
  useEffect,
  useRef,
  useState
} from 'react'

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-white">Carregando...</p></div>}>
      <VerifyCodeContent />
    </Suspense>
  )
}

function VerifyCodeContent() {

  const router = useRouter()

  const searchParams = useSearchParams()

  const email = searchParams.get('email') || ''

  const [loading, setLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')

  const [successMessage, setSuccessMessage] = useState('')

  const [code, setCode] = useState([
    '',
    '',
    '',
    '',
    '',
    ''
  ])

  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {

    if (!email) {

      router.push('/forgot-password')

      return

    }

    inputsRef.current[0]?.focus()

  }, [email, router])

  const handleChange = (
    index: number,
    value: string
  ) => {

    if (!/^\d*$/.test(value)) {
      return
    }

    const digit = value.slice(-1)

    const newCode = [...code]

    newCode[index] = digit

    setCode(newCode)

    if (digit && index < 5) {

      inputsRef.current[index + 1]?.focus()

    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {

    if (
      e.key === 'Backspace' &&
      !code[index] &&
      index > 0
    ) {

      inputsRef.current[index - 1]?.focus()

    }
  }

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {

    e.preventDefault()

    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)

    if (pasted.length === 6) {

      const newCode = pasted.split('')

      setCode(newCode)

      inputsRef.current[5]?.focus()

    }
  }

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    const finalCode = code.join('')

    if (!email) {

      setErrorMessage(
        'E-mail inválido.'
      )

      return
    }

    if (finalCode.length !== 6) {

      setErrorMessage(
        'Digite o código completo.'
      )

      return
    }

    setLoading(true)

    setErrorMessage('')
    setSuccessMessage('')

    try {

      const response = await fetch(
        '${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/verify-reset-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            codigo: finalCode
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {

        setErrorMessage(
          data.detail || 'Código inválido.'
        )

        return
      }

      setSuccessMessage(
        'Código validado com sucesso.'
      )

      setTimeout(() => {

        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&codigo=${finalCode}`
        )

      }, 1200)

    } catch (error) {

      console.error(error)

      setErrorMessage(
        'Erro ao validar código.'
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
                  w-36
                  h-36
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
                  width={130}
                  height={130}
                  className="object-contain"
                />

              </div>

            </div>

            {/* HEADER */}
            <div className="text-center mb-8">

              <h1 className="text-3xl font-bold text-white mb-3">
                Verificar código
              </h1>

              <p className="text-zinc-300 leading-relaxed">
                Digite o código enviado para:
              </p>

              <p className="text-emerald-400 mt-2 text-sm break-all">
                {email}
              </p>

            </div>

            {/* ERROR */}
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

            {/* SUCCESS */}
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
              className="space-y-8"
            >

              {/* CODE INPUTS */}
              <div className="flex justify-center gap-3">

                {code.map((digit, index) => (

                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleChange(
                        index,
                        e.target.value
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(index, e)
                    }
                    onPaste={handlePaste}
                    className="
                      w-14
                      h-16
                      rounded-2xl
                      bg-white/10
                      border
                      border-white/10
                      text-white
                      text-center
                      text-2xl
                      font-bold
                      outline-none
                      transition-all
                      focus:border-emerald-500
                      focus:bg-white/15
                    "
                  />

                ))}

              </div>

              {/* BUTTON */}
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
                  ? 'Validando...'
                  : 'Continuar'}
              </button>

            </form>

            {/* FOOTER */}
            <div className="mt-8 text-center">

              <button
                onClick={() => router.push('/forgot-password')}
                className="
                  text-sm
                  text-zinc-400
                  hover:text-white
                  transition-all
                "
              >
                Voltar
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}