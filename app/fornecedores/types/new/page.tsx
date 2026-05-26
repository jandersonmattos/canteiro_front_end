'use client'

import Link from 'next/link'

import {
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import toast from 'react-hot-toast'

import Sidebar from '../../../../components/Sidebar'

import {
  ArrowLeft,
  Save
} from 'lucide-react'

export default function NewSupplierTypePage() {

  const router = useRouter()

  const [nome, setNome] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  async function handleSave() {

    if (!nome.trim()) {

      toast.error(
        'Informe o nome do tipo'
      )

      return
    }

    try {

      setLoading(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/supplier-types`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            nome
          })
        }
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao salvar tipo'
        )
      }

      toast.success(
        'Tipo criado com sucesso'
      )

      router.push(
        '/fornecedores/types'
      )

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao salvar tipo'
      )

    } finally {

      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <main className="flex-1 overflow-auto">

        {/* HEADER */}
        <div
          className="
            border-b
            border-white/10
            bg-black/70
            backdrop-blur-xl
          "
        >

          <div className="px-8 py-6">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-5">

                <Link
                  href="/fornecedores/types"
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    flex
                    items-center
                    justify-center
                    hover:bg-white/[0.06]
                    transition-all
                  "
                >

                  <ArrowLeft size={18} />
                </Link>

                <div>

                  <h1 className="text-4xl font-bold mb-2">
                    Novo tipo de fornecedor
                  </h1>

                  <p className="text-zinc-400">
                    Cadastre um novo tipo de fornecedor
                  </p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="
                  h-12
                  px-6
                  rounded-2xl
                  bg-emerald-500
                  text-black
                  font-semibold
                  flex
                  items-center
                  gap-3
                  hover:bg-emerald-400
                  transition-all
                  disabled:opacity-50
                "
              >

                <Save size={18} />

                {loading
                  ? 'Salvando...'
                  : 'Salvar tipo'}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8">

          <div
            className="
              w-full
              rounded-[32px]
              border
              border-white/10
              bg-white/[0.03]
              p-8
            "
          >

            <div className="mb-8">

              <h2 className="text-3xl font-bold mb-2">
                Dados do tipo
              </h2>

              <p className="text-zinc-400">
                Informe o nome do tipo de fornecedor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="md:col-span-2">

                <label
                  className="
                    block
                    text-sm
                    text-zinc-400
                    mb-2
                  "
                >
                  Nome *
                </label>

                <input
                  value={nome}
                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }
                  placeholder="Digite o nome do tipo"
                  className="
                    w-full
                    h-14
                    rounded-2xl
                    border
                    border-white/10
                    bg-black/40
                    px-5
                    outline-none
                    focus:border-emerald-500/40
                  "
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">

              <Link
                href="/fornecedores/types"
                className="
                  h-12
                  px-6
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  flex
                  items-center
                  justify-center
                  hover:bg-white/[0.06]
                  transition-all
                "
              >
                Cancelar
              </Link>

              <button
                onClick={handleSave}
                disabled={loading}
                className="
                  h-12
                  px-6
                  rounded-2xl
                  bg-emerald-500
                  text-black
                  font-semibold
                  hover:bg-emerald-400
                  transition-all
                  disabled:opacity-50
                "
              >
                {loading
                  ? 'Salvando...'
                  : 'Salvar tipo'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}