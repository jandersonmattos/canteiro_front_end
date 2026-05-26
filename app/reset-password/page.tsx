'use client'

import Image from 'next/image'

import {
  useRouter,
  useSearchParams
} from 'next/navigation'

import {
  useEffect,
  useState
} from 'react'

export default function ResetPasswordPage() {

  const router = useRouter()

  const searchParams = useSearchParams()

  const email = searchParams.get('email') || ''

  const codigo = searchParams.get('codigo') || ''

  const [novaSenha, setNovaSenha] = useState('')

  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [loading, setLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')

  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {

    if (!email || !codigo) {

      router.push('/forgot-password')

    }

  }, [email, codigo, router])

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    if (!novaSenha || !confirmarSenha) {

      setErrorMessage(
        'Preencha todos os campos.'
      )

      return
    }

    if (novaSenha.length < 6) {

      setErrorMessage(
        'A senha deve ter no mínimo 6 caracteres.'
      )

      return
    }

    if (novaSenha !== confirmarSenha) {

      setErrorMessage(
        'As senhas não coincidem.'
      )

      return
    }

    setLoading(true)

    try {

      const response = await fetch(
        '${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            codigo,
            nova_senha: novaSenha
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {

        setErrorMessage(
          data.detail || 'Erro ao redefinir senha.'
        )

        setLoading(false)

        return
      }

      setSuccessMessage(
        'Senha redefinida com sucesso.'
      )

      setTimeout(() => {

        router.push('/login')

      }, 2000)

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
                Redefinir senha
              </h1>

              <p className="text-zinc-300 leading-relaxed">
                Digite sua nova senha.
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
              className="space-y-5"
            >

              {/* NOVA SENHA */}
              <div>

                <label className="block text-sm text-zinc-300 mb-2">
                  Nova senha
                </label>

                <input
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={novaSenha}
                  onChange={(e) =>
                    setNovaSenha(e.target.value)
                  }
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

              {/* CONFIRMAR SENHA */}
              <div>

                <label className="block text-sm text-zinc-300 mb-2">
                  Confirmar senha
                </label>

                <input
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmarSenha}
                  onChange={(e) =>
                    setConfirmarSenha(e.target.value)
                  }
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
                  ? 'Salvando...'
                  : 'Redefinir senha'}
              </button>

            </form>

            {/* FOOTER */}
            <div className="mt-8 text-center">

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