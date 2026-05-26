'use client'

import Link from 'next/link'

import {
  useEffect,
  useState
} from 'react'

import toast from 'react-hot-toast'

import Sidebar from '../../../components/Sidebar'

import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  X
} from 'lucide-react'

interface TipoFornecedor {
  id: number
  nome: string
}

export default function SupplierTypesPage() {

  const [menuOpenId, setMenuOpenId] =
    useState<number | null>(null)

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      right: 0
    })

  const [tipos, setTipos] = useState<
    TipoFornecedor[]
  >([])

  const [loading, setLoading] =
    useState(true)

  const [
    deletingTipo,
    setDeletingTipo
  ] = useState<TipoFornecedor | null>(
    null
  )

  const [deleting, setDeleting] =
    useState(false)

  async function loadTipos() {

    try {

      const response = await fetch(
         `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/supplier-types`
      )

      const data = await response.json()

      setTipos(data)

    } catch (error) {

      console.error(
        'Erro ao buscar tipos:',
        error
      )

      toast.error(
        'Erro ao carregar tipos'
      )

    } finally {

      setLoading(false)
    }
  }

  async function handleDeleteTipo() {

    if (!deletingTipo) return

    try {

      setDeleting(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/supplier-types/${deletingTipo.id}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao deletar'
        )
      }

      setTipos((old) =>
        old.filter(
          (item) =>
            item.id !== deletingTipo.id
        )
      )

      toast.success(
        'Tipo deletado com sucesso'
      )

      setDeletingTipo(null)

      setMenuOpenId(null)

    } catch (error) {

      console.error(
        'Erro ao deletar tipo:',
        error
      )

      toast.error(
        'Erro ao deletar tipo'
      )

    } finally {

      setDeleting(false)
    }
  }

  useEffect(() => {
    loadTipos()
  }, [])

  // ============================================
  // FECHAR MENU AO CLICAR FORA
  // ============================================

  useEffect(() => {

    function handleClickOutside() {
      setMenuOpenId(null)
    }

    if (menuOpenId !== null) {
      window.addEventListener(
        'click',
        handleClickOutside
      )
    }

    return () => {
      window.removeEventListener(
        'click',
        handleClickOutside
      )
    }

  }, [menuOpenId])

  return (
    <>
      <div className="min-h-screen bg-black text-white flex">

        <Sidebar />

        <main className="flex-1 overflow-visible">

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
                    href="/fornecedores"
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
                      Tipos de fornecedores
                    </h1>

                    <p className="text-zinc-400">
                      Gerencie os tipos utilizados nos fornecedores
                    </p>
                  </div>
                </div>

                <Link
                  href="/fornecedores/types/new"
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
                  "
                >

                  <Plus size={18} />

                  Novo tipo de fornecedor
                </Link>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8">

            <div
              className="
                rounded-[28px]
                border
                border-white/10
                bg-white/[0.03]
              "
            >

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead
                    className="
                      bg-white/[0.03]
                      border-b
                      border-white/10
                    "
                  >

                    <tr>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Nome
                      </th>

                      <th className="text-center px-6 py-5 text-sm font-semibold w-[140px]">
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {loading && (

                      <tr>

                        <td
                          colSpan={2}
                          className="
                            px-6
                            py-10
                            text-center
                            text-zinc-400
                          "
                        >
                          Carregando tipos...
                        </td>
                      </tr>
                    )}

                    {!loading && tipos.length === 0 && (

                      <tr>

                        <td
                          colSpan={2}
                          className="
                            px-6
                            py-10
                            text-center
                            text-zinc-400
                          "
                        >
                          Nenhum tipo encontrado
                        </td>
                      </tr>
                    )}

                    {tipos.map((tipo) => (

                      <tr
                        key={tipo.id}
                        className="
                          relative
                          border-b
                          border-white/5
                          hover:bg-white/[0.03]
                          transition-all
                        "
                      >

                        {/* NOME */}
                        <td className="px-6 py-5">

                          <div>

                            <p className="font-semibold">
                              {tipo.nome}
                            </p>

                            <span className="text-xs text-zinc-500">
                              ID #{tipo.id}
                            </span>
                          </div>
                        </td>

                        {/* AÇÕES */}
                        <td className="px-6 py-5">

                          <div className="flex justify-center">

                            <button
                              onClick={(e) => {

                                e.stopPropagation()

                                const rect =
                                  e.currentTarget.getBoundingClientRect()

                                setMenuPosition({
                                  top: rect.bottom + 10,
                                  right:
                                    window.innerWidth - rect.right
                                })

                                setMenuOpenId(
                                  menuOpenId === tipo.id
                                    ? null
                                    : tipo.id
                                )
                              }}
                              className="
                                w-10
                                h-10
                                rounded-xl
                                border
                                border-white/10
                                bg-black/40
                                flex
                                items-center
                                justify-center
                                hover:bg-white/10
                                transition-all
                              "
                            >

                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MENU FIXO */}
      {menuOpenId && (

        <div
          onClick={(e) =>
            e.stopPropagation()
          }
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`
          }}
          className="
            fixed
            w-52
            rounded-2xl
            border
            border-white/10
            bg-zinc-950
            overflow-hidden
            shadow-[0_20px_60px_rgba(0,0,0,0.7)]
            z-[9999]
            animate-in
            fade-in
            zoom-in-95
            duration-100
            backdrop-blur-xl
          "
        >

          <Link
            href={`/fornecedores/types/edit/${menuOpenId}`}
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              hover:bg-white/[0.05]
              transition-all
              text-sm
            "
          >

            <Pencil size={16} />

            Editar tipo
          </Link>

          <button
            onClick={() => {

              const tipo =
                tipos.find(
                  item =>
                    item.id === menuOpenId
                )

              if (tipo) {
                setDeletingTipo(tipo)
              }
            }}
            className="
              w-full
              flex
              items-center
              gap-3
              px-4
              py-3
              hover:bg-red-500/10
              transition-all
              text-sm
              text-red-400
            "
          >

            <Trash2 size={16} />

            Deletar tipo
          </button>
        </div>
      )}

      {/* MODAL DELETE */}
      {deletingTipo && (

        <div
          className="
            fixed
            inset-0
            z-[999]
            flex
            items-center
            justify-center
            bg-black/70
            backdrop-blur-md
            p-4
          "
        >

          <div
            className="
              w-full
              max-w-md
              rounded-[32px]
              border
              border-white/10
              bg-zinc-950
              p-7
              shadow-2xl
              animate-in
              fade-in
              zoom-in-95
              duration-200
            "
          >

            <div className="flex items-start justify-between mb-6">

              <div
                className="
                  w-14
                  h-14
                  rounded-2xl
                  bg-red-500/10
                  border
                  border-red-500/20
                  flex
                  items-center
                  justify-center
                "
              >

                <AlertTriangle
                  size={26}
                  className="text-red-400"
                />
              </div>

              <button
                onClick={() =>
                  setDeletingTipo(null)
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  hover:bg-white/[0.05]
                  flex
                  items-center
                  justify-center
                  transition-all
                "
              >

                <X size={18} />
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-3">
              Deletar tipo
            </h2>

            <p className="text-zinc-400 leading-relaxed mb-8">
              Tem certeza que deseja deletar o tipo{' '}
              <span className="text-white font-semibold">
                {deletingTipo.nome}
              </span>
              ?
              <br />
              Essa ação não poderá ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3">

              <button
                onClick={() =>
                  setDeletingTipo(null)
                }
                className="
                  h-12
                  px-5
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  hover:bg-white/[0.06]
                  transition-all
                  font-medium
                "
              >
                Cancelar
              </button>

              <button
                onClick={handleDeleteTipo}
                disabled={deleting}
                className="
                  h-12
                  px-5
                  rounded-2xl
                  bg-red-500
                  hover:bg-red-400
                  transition-all
                  text-white
                  font-semibold
                  disabled:opacity-50
                  flex
                  items-center
                  gap-2
                "
              >

                <Trash2 size={16} />

                {deleting
                  ? 'Deletando...'
                  : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}