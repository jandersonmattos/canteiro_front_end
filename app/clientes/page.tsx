'use client'

import Link from 'next/link'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import toast from 'react-hot-toast'

import Sidebar from '../../components/Sidebar'

import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  User,
  Building2,
  AlertTriangle,
  X
} from 'lucide-react'

interface Cliente {

  id: string

  nome: string

  tipo_pessoa?: 'PF' | 'PJ'

  telefone?: string

  celular?: string

  cep?: string

  endereco?: string

  numero?: string

  bairro?: string

  complemento?: string

  cidade?: string

  estado?: string

  pais?: string
}

export default function ClientsPage() {

  const [clientes, setClientes] =
    useState<Cliente[]>([])

  const [busca, setBusca] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [menuOpenId, setMenuOpenId] =
    useState<string | null>(null)

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      right: 0
    })

  const [
    clienteDelete,
    setClienteDelete
  ] = useState<Cliente | null>(null)

  const [deleting, setDeleting] =
    useState(false)

  // ======================================================
  // LOAD CLIENTS
  // ======================================================

  async function loadClients() {

    try {

      setLoading(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/clients`
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao carregar clientes'
        )
      }

      const data = await response.json()

      setClientes(data)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao carregar clientes'
      )

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    loadClients()

  }, [])

  // ======================================================
  // CLOSE MENU
  // ======================================================

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

  // ======================================================
  // DELETE CLIENT
  // ======================================================

  async function deleteCliente() {

    if (!clienteDelete) return

    try {

      setDeleting(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/clients/${clienteDelete.id}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao deletar cliente'
        )
      }

      setClientes((old) =>
        old.filter(
          (item) =>
            item.id !== clienteDelete.id
        )
      )

      toast.success(
        'Cliente deletado com sucesso'
      )

      setClienteDelete(null)

      setMenuOpenId(null)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao deletar cliente'
      )

    } finally {

      setDeleting(false)
    }
  }

  // ======================================================
  // FILTER
  // ======================================================

  const clientesFiltrados =
    useMemo(() => {

      return clientes.filter(cliente => {

        const texto =
          `
            ${cliente.nome || ''}
            ${cliente.endereco || ''}
            ${cliente.numero || ''}
            ${cliente.bairro || ''}
            ${cliente.cidade || ''}
            ${cliente.estado || ''}
            ${cliente.telefone || ''}
            ${cliente.celular || ''}
          `
            .toLowerCase()

        return texto.includes(
          busca.toLowerCase()
        )
      })

    }, [clientes, busca])

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
                    Clientes
                  </h1>

                  <p className="text-zinc-400">
                    Gerencie todos os clientes
                  </p>
                </div>

                <Link
                  href="/clientes/new"
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

                  Novo cliente
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

              <label
                className="
                  block
                  text-sm
                  text-zinc-400
                  mb-2
                "
              >
                Buscar cliente
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
                  placeholder="Digite o nome, endereço ou telefone..."
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
                        Tipo
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Telefone
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Endereço
                      </th>

                      <th className="text-center px-6 py-5 text-sm font-semibold w-[120px]">
                        Ações
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {loading && (

                      <tr>

                        <td
                          colSpan={5}
                          className="
                            text-center
                            py-10
                            text-zinc-400
                          "
                        >
                          Carregando clientes...
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      clientesFiltrados.length === 0 && (

                      <tr>

                        <td
                          colSpan={5}
                          className="
                            text-center
                            py-10
                            text-zinc-500
                          "
                        >
                          Nenhum cliente encontrado
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      clientesFiltrados.map(cliente => {

                      const enderecoCompleto = [
                        cliente.endereco,
                        cliente.numero,
                        cliente.complemento
                      ]
                        .filter(Boolean)
                        .join(', ')

                      const cidadeEstado = [
                        cliente.bairro,
                        cliente.cidade,
                        cliente.estado,
                        cliente.cep,
                        cliente.pais
                      ]
                        .filter(Boolean)
                        .join(' • ')

                      const tipoPessoa =
                        cliente.tipo_pessoa || '-'

                      return (

                        <tr
                          key={cliente.id}
                          className="
                            border-b
                            border-white/5
                            hover:bg-white/[0.03]
                            transition-all
                          "
                        >

                          {/* NOME */}
                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div
                                className="
                                  w-11
                                  h-11
                                  rounded-2xl
                                  bg-emerald-500/10
                                  border
                                  border-emerald-500/20
                                  flex
                                  items-center
                                  justify-center
                                "
                              >

                                {tipoPessoa === 'PF'
                                  ? (
                                    <User
                                      size={18}
                                      className="text-emerald-400"
                                    />
                                  )
                                  : (
                                    <Building2
                                      size={18}
                                      className="text-emerald-400"
                                    />
                                  )}
                              </div>

                              <div>

                                <p className="font-semibold">
                                  {cliente.nome}
                                </p>

                                <span className="text-xs text-zinc-500">
                                  {cliente.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* TIPO */}
                          <td className="px-6 py-5">

                            <div
                              className="
                                inline-flex
                                items-center
                                gap-2
                                px-3
                                py-1.5
                                rounded-full
                                text-xs
                                border
                                border-emerald-500/20
                                bg-emerald-500/10
                                text-emerald-400
                              "
                            >
                              {tipoPessoa}
                            </div>
                          </td>

                          {/* TELEFONE */}
                          <td className="px-6 py-5 text-zinc-300">
                            {cliente.celular || cliente.telefone || '-'}
                          </td>

                          {/* ENDEREÇO */}
                          <td className="px-6 py-5 text-zinc-300">

                            <div className="flex flex-col">

                              <span>
                                {enderecoCompleto || '-'}
                              </span>

                              <span className="text-xs text-zinc-500">
                                {cidadeEstado || '-'}
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
                                    menuOpenId === cliente.id
                                      ? null
                                      : cliente.id
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
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

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
              href={`/clientes/edit/${menuOpenId}`}
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

              Editar cliente
            </Link>

            <button
              onClick={() => {

                const cliente =
                  clientes.find(
                    item =>
                      item.id === menuOpenId
                  )

                if (cliente) {

                  setClienteDelete(
                    cliente
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

              Deletar cliente
            </button>
          </div>
        )}
      </div>

      {/* MODAL DELETE */}
      {clienteDelete && (

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
                  setClienteDelete(null)
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
                Deletar cliente
              </h2>

              <p className="text-zinc-400 leading-relaxed">
                Você está prestes a deletar o cliente{' '}
                <span className="text-white font-semibold">
                  {clienteDelete.nome}
                </span>.
                <br />
                Essa ação não poderá ser desfeita.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3">

              <button
                onClick={() =>
                  setClienteDelete(null)
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
                onClick={deleteCliente}
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