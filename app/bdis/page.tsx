'use client'

import Link from 'next/link'

import {
  useEffect,
  useState
} from 'react'

import Sidebar from '../../components/Sidebar'

import toast from 'react-hot-toast'

import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  Percent,
  AlertTriangle,
  X
} from 'lucide-react'

interface BDI {
  id: number
  nome: string
  descricao: string
  percentual_total: number
}

export default function BDIsPage() {

  const [menuOpenId, setMenuOpenId] =
    useState<number | null>(null)

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      right: 0
    })

  const [loading, setLoading] =
    useState(true)

  const [busca, setBusca] =
    useState('')

  const [deleting, setDeleting] =
    useState(false)

  const [bdiDelete, setBdiDelete] =
    useState<BDI | null>(null)

  const [bdis, setBdis] =
    useState<BDI[]>([])

  // ============================================
  // FETCH BDIs
  // ============================================

  async function fetchBDIs() {

    try {

      setLoading(true)

      const response = await fetch(
        'http://localhost:8000/bdis'
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao buscar BDIs'
        )
      }

      const data = await response.json()

      setBdis(data)

    } catch (error) {

      console.error(
        'Erro ao buscar BDIs',
        error
      )

      toast.error(
        'Erro ao carregar BDIs'
      )

    } finally {

      setLoading(false)
    }
  }

  // ============================================
  // DELETE
  // ============================================

  async function deleteBDI() {

    if (!bdiDelete) return

    try {

      setDeleting(true)

      const response = await fetch(
        `http://localhost:8000/bdis/${bdiDelete.id}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao deletar BDI'
        )
      }

      setBdis((old) =>
        old.filter(
          item =>
            item.id !== bdiDelete.id
        )
      )

      toast.success(
        'BDI deletado com sucesso'
      )

      setBdiDelete(null)

      setMenuOpenId(null)

    } catch (error) {

      console.error(
        'Erro ao deletar BDI',
        error
      )

      toast.error(
        'Erro ao deletar BDI'
      )

    } finally {

      setDeleting(false)
    }
  }

  // ============================================
  // LOAD
  // ============================================

  useEffect(() => {

    fetchBDIs()

  }, [])

  // ============================================
  // FECHAR MENU
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

  // ============================================
  // FILTRO
  // ============================================

  const bdisFiltrados =
    bdis.filter((bdi) =>
      (bdi.nome || '')
        .toLowerCase()
        .includes(
          busca.toLowerCase()
        )
    )

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

                <div>

                  <h1 className="text-4xl font-bold mb-2">
                    BDIs
                  </h1>

                  <p className="text-zinc-400">
                    Gerencie todos os BDIs da plataforma
                  </p>
                </div>

                <Link
                  href="/bdis/new"
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

                  Novo BDI
                </Link>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8">

            {/* FILTROS */}
            <div
              className="
                mb-6
                rounded-[28px]
                border
                border-white/10
                bg-white/[0.03]
                p-5
              "
            >

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* BUSCA */}
                <div className="lg:col-span-2">

                  <label
                    className="
                      block
                      text-sm
                      text-zinc-400
                      mb-2
                    "
                  >
                    Buscar BDI
                  </label>

                  <div className="relative">

                    <Search
                      size={16}
                      className="
                        absolute
                        left-4
                        top-1/2
                        -translate-y-1/2
                        text-zinc-500
                      "
                    />

                    <input
                      value={busca}
                      onChange={(e) =>
                        setBusca(
                          e.target.value
                        )
                      }
                      placeholder="Digite o nome do BDI..."
                      className="
                        w-full
                        h-12
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/40
                        pl-11
                        pr-4
                        outline-none
                        focus:border-emerald-500/40
                      "
                    />
                  </div>
                </div>

                {/* BOTÃO */}
                <div className="flex items-end">

                  <button
                    className="
                      h-12
                      px-6
                      rounded-2xl
                      bg-emerald-500
                      text-black
                      font-semibold
                      hover:bg-emerald-400
                      transition-all
                    "
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </div>

            {/* TABELA */}
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

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Percentual
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Descrição
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
                          colSpan={4}
                          className="
                            text-center
                            py-10
                            text-zinc-400
                          "
                        >
                          Carregando BDIs...
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      bdisFiltrados.map((bdi) => (

                      <tr
                        key={bdi.id}
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
                              {bdi.nome}
                            </p>

                            <span className="text-xs text-zinc-500">
                              ID #{bdi.id}
                            </span>
                          </div>
                        </td>

                        {/* PERCENTUAL */}
                        <td className="px-6 py-5">

                          <div
                            className="
                              inline-flex
                              items-center
                              gap-2
                              px-3
                              py-1
                              rounded-full
                              border
                              border-emerald-500/20
                              bg-emerald-500/10
                              text-emerald-400
                              text-sm
                            "
                          >

                            <Percent size={14} />

                            {Number(
                              bdi.percentual_total || 0
                            ).toFixed(2)}%
                          </div>
                        </td>

                        {/* DESCRIÇÃO */}
                        <td className="px-6 py-5 text-sm text-zinc-300">
                          {bdi.descricao}
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
                                  menuOpenId === bdi.id
                                    ? null
                                    : bdi.id
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

                    {!loading &&
                      bdisFiltrados.length === 0 && (

                      <tr>

                        <td
                          colSpan={4}
                          className="
                            text-center
                            py-10
                            text-zinc-500
                          "
                        >
                          Nenhum BDI encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MENU */}
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
            w-56
            rounded-2xl
            border
            border-white/10
            bg-zinc-950
            overflow-hidden
            shadow-[0_20px_60px_rgba(0,0,0,0.7)]
            z-[9999]
          "
        >

          <Link
            href={`/bdis/edit/${menuOpenId}`}
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

            Editar BDI
          </Link>

          <button
            onClick={() => {

              const bdi =
                bdis.find(
                  item =>
                    item.id === menuOpenId
                )

              if (bdi) {
                setBdiDelete(bdi)
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

            Deletar BDI
          </button>
        </div>
      )}

      {/* MODAL DELETE */}
      {bdiDelete && (

        <div
          className="
            fixed
            inset-0
            z-[999]
            bg-black/70
            backdrop-blur-sm
            flex
            items-center
            justify-center
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
            "
          >

            {/* HEADER */}
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
                  setBdiDelete(null)
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  hover:bg-white/5
                  flex
                  items-center
                  justify-center
                  transition-all
                "
              >

                <X size={18} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="mb-8">

              <h2 className="text-2xl font-bold mb-3">
                Deletar BDI
              </h2>

              <p className="text-zinc-400 leading-relaxed">
                Você está prestes a deletar o BDI{' '}
                <span className="text-white font-semibold">
                  {bdiDelete.nome}
                </span>.
                <br />
                Essa ação não poderá ser desfeita.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3">

              <button
                onClick={() =>
                  setBdiDelete(null)
                }
                className="
                  h-12
                  px-5
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  font-medium
                  hover:bg-white/[0.06]
                  transition-all
                "
              >
                Cancelar
              </button>

              <button
                onClick={deleteBDI}
                disabled={deleting}
                className="
                  h-12
                  px-5
                  rounded-2xl
                  bg-red-500
                  text-white
                  font-semibold
                  hover:bg-red-400
                  transition-all
                  disabled:opacity-50
                "
              >
                {deleting
                  ? 'Deletando...'
                  : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}