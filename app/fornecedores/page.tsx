'use client'

import Link from 'next/link'

import {
  useEffect,
  useState
} from 'react'

import toast from 'react-hot-toast'

import Sidebar from '../../components/Sidebar'

import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Tags,
  Search,
  AlertTriangle,
  X
} from 'lucide-react'

interface TipoFornecedor {
  id: number
  nome: string
}

interface Fornecedor {
  id: number
  nome: string
  email: string
  telefone: string
  celular: string
  tipos: TipoFornecedor[]
}

export default function SuppliersPage() {

  const [menuOpenId, setMenuOpenId] =
    useState<number | null>(null)

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      right: 0
    })

  const [fornecedores, setFornecedores] =
    useState<Fornecedor[]>([])

  const [loading, setLoading] =
    useState(true)

  const [busca, setBusca] =
    useState('')

  const [tipoSelecionado, setTipoSelecionado] =
    useState('')

  const [tipos, setTipos] =
    useState<TipoFornecedor[]>([])

  const [
    fornecedorDelete,
    setFornecedorDelete
  ] = useState<Fornecedor | null>(null)

  const [deleting, setDeleting] =
    useState(false)

  // ============================================
  // BUSCAR FORNECEDORES
  // ============================================

  async function fetchFornecedores() {

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/suppliers`
      )

      const data = await response.json()

      setFornecedores(data)

    } catch (error) {

      console.error(
        'Erro ao buscar fornecedores',
        error
      )

    } finally {

      setLoading(false)
    }
  }

  // ============================================
  // BUSCAR TIPOS
  // ============================================

  async function fetchTipos() {

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/supplier-types`
      )

      const data = await response.json()

      setTipos(data)

    } catch (error) {

      console.error(
        'Erro ao buscar tipos',
        error
      )
    }
  }

  // ============================================
  // DELETE
  // ============================================

  async function deleteFornecedor() {

    if (!fornecedorDelete) return

    try {

      setDeleting(true)

      await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/suppliers/${fornecedorDelete.id}`,
        {
          method: 'DELETE'
        }
      )

      setFornecedores((old) =>
        old.filter(
          (item) =>
            item.id !== fornecedorDelete.id
        )
      )

      toast.success(
        'Fornecedor deletado com sucesso'
      )

      setFornecedorDelete(null)

      setMenuOpenId(null)

    } catch (error) {

      console.error(
        'Erro ao deletar fornecedor',
        error
      )

      toast.error(
        'Erro ao deletar fornecedor'
      )

    } finally {

      setDeleting(false)
    }
  }

  // ============================================
  // LOAD
  // ============================================

  useEffect(() => {

    fetchFornecedores()

    fetchTipos()

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

  // ============================================
  // FILTRO
  // ============================================

  const fornecedoresFiltrados =
    fornecedores.filter((fornecedor) => {

      const matchBusca =
        fornecedor.nome
          .toLowerCase()
          .includes(busca.toLowerCase())

      const matchTipo =
        !tipoSelecionado ||
        fornecedor.tipos.some(
          tipo =>
            tipo.nome === tipoSelecionado
        )

      return matchBusca && matchTipo
    })

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
                    Fornecedores
                  </h1>

                  <p className="text-zinc-400">
                    Gerencie todos os fornecedores da plataforma
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <Link
                    href="/fornecedores/types"
                    className="
                      h-12
                      px-6
                      rounded-2xl
                      border
                      border-white/10
                      bg-white/[0.03]
                      font-semibold
                      flex
                      items-center
                      gap-3
                      hover:bg-white/[0.06]
                      transition-all
                    "
                  >

                    <Tags size={18} />

                    Tipos de fornecedores
                  </Link>

                  <Link
                    href="/fornecedores/new"
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

                    Novo fornecedor
                  </Link>
                </div>
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
                <div>

                  <label
                    className="
                      block
                      text-sm
                      text-zinc-400
                      mb-2
                    "
                  >
                    Buscar fornecedor
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
                        setBusca(e.target.value)
                      }
                      placeholder="Digite o nome..."
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

                {/* TIPO */}
                <div>

                  <label
                    className="
                      block
                      text-sm
                      text-zinc-400
                      mb-2
                    "
                  >
                    Tipo
                  </label>

                  <select
                    value={tipoSelecionado}
                    onChange={(e) =>
                      setTipoSelecionado(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      h-12
                      rounded-2xl
                      border
                      border-white/10
                      bg-black/40
                      px-4
                      outline-none
                      focus:border-emerald-500/40
                    "
                  >

                    <option value="">
                      Todos os tipos
                    </option>

                    {tipos.map((tipo) => (

                      <option
                        key={tipo.id}
                        value={tipo.nome}
                      >
                        {tipo.nome}
                      </option>
                    ))}
                  </select>
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
                        E-mail
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Telefone
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Celular/WhatsApp
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Tipos
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
                          colSpan={6}
                          className="
                            text-center
                            py-10
                            text-zinc-400
                          "
                        >
                          Carregando fornecedores...
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      fornecedoresFiltrados.map((fornecedor) => (

                      <tr
                        key={fornecedor.id}
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
                              {fornecedor.nome}
                            </p>

                            <span className="text-xs text-zinc-500">
                              ID #{fornecedor.id}
                            </span>
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td className="px-6 py-5 text-sm text-zinc-300">
                          {fornecedor.email || '-'}
                        </td>

                        {/* TELEFONE */}
                        <td className="px-6 py-5 text-sm text-zinc-300">
                          {fornecedor.telefone || '-'}
                        </td>

                        {/* CELULAR */}
                        <td className="px-6 py-5 text-sm text-zinc-300">
                          {fornecedor.celular || '-'}
                        </td>

                        {/* TIPOS */}
                        <td className="px-6 py-5">

                          <div className="flex flex-wrap gap-2">

                            {fornecedor.tipos?.map(tipo => (

                              <div
                                key={tipo.id}
                                className="
                                  px-3
                                  py-1
                                  rounded-full
                                  text-xs
                                  border
                                  border-emerald-500/20
                                  bg-emerald-500/10
                                  text-emerald-400
                                "
                              >
                                {tipo.nome}
                              </div>
                            ))}
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
                                  menuOpenId === fornecedor.id
                                    ? null
                                    : fornecedor.id
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
                      fornecedoresFiltrados.length === 0 && (

                      <tr>

                        <td
                          colSpan={6}
                          className="
                            text-center
                            py-10
                            text-zinc-500
                          "
                        >
                          Nenhum fornecedor encontrado
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
            href={`/fornecedores/edit/${menuOpenId}`}
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

            Editar fornecedor
          </Link>

          <button
            onClick={() => {

              const fornecedor =
                fornecedores.find(
                  item =>
                    item.id === menuOpenId
                )

              if (fornecedor) {
                setFornecedorDelete(
                  fornecedor
                )
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

            Deletar fornecedor
          </button>
        </div>
      )}

      {/* MODAL DELETE */}
      {fornecedorDelete && (

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
                  setFornecedorDelete(null)
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
                Deletar fornecedor
              </h2>

              <p className="text-zinc-400 leading-relaxed">
                Você está prestes a deletar o fornecedor{' '}
                <span className="text-white font-semibold">
                  {fornecedorDelete.nome}
                </span>.
                <br />
                Essa ação não poderá ser desfeita.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3">

              <button
                onClick={() =>
                  setFornecedorDelete(null)
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
                onClick={deleteFornecedor}
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