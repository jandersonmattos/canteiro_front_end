'use client'

import Link from 'next/link'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import Sidebar from '../../components/Sidebar'

import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  X,
  FileText,
  Calculator
} from 'lucide-react'

interface Orcamento {
  id: string
  numero: string
  tipo: string
  cliente: string
  obra: string
  custo: number
  venda: number
  medicao: string
  medido: number
  aMedir: number
}

export default function BudgetsPage() {

  const [menuOpenId, setMenuOpenId] =
    useState<string | null>(null)

  const [menuPosition, setMenuPosition] =
    useState({
      top: 0,
      right: 0
    })

  const [busca, setBusca] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [orcamentos, setOrcamentos] =
    useState<Orcamento[]>([])

  const [
    orcamentoDelete,
    setOrcamentoDelete
  ] = useState<Orcamento | null>(null)

  const [deleting, setDeleting] =
    useState(false)

  // ============================================
  // CARREGAR ORÇAMENTOS
  // ============================================

  useEffect(() => {

    loadOrcamentos()

  }, [])

  async function loadOrcamentos() {

    try {

      setLoading(true)

      const response =
        await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/budgets`
        )

      if (!response.ok) {

        throw new Error(
          'Erro ao buscar orçamentos'
        )
      }

      const data =
        await response.json()

      setOrcamentos(data)

    } catch (error) {

      console.error(error)

    } finally {

      setLoading(false)
    }
  }

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
  // DELETE
  // ============================================

  async function deleteOrcamento() {

    if (!orcamentoDelete) {
      return
    }

    try {

      setDeleting(true)

      const response =
        await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/budgets/${orcamentoDelete.id}`,
          {
            method: 'DELETE'
          }
        )

      if (!response.ok) {

        throw new Error(
          'Erro ao deletar orçamento'
        )
      }

      setOrcamentos(prev =>
        prev.filter(
          item =>
            item.id !== orcamentoDelete.id
        )
      )

      setOrcamentoDelete(null)

      setMenuOpenId(null)

    } catch (error) {

      console.error(error)

    } finally {

      setDeleting(false)
    }
  }

  // ============================================
  // FILTRO
  // ============================================

  const orcamentosFiltrados =
    useMemo(() => {

      const termo =
        busca.toLowerCase()

      return orcamentos.filter(
        (orcamento) => {

          return (
            orcamento.numero
              ?.toLowerCase()
              .includes(termo) ||

            orcamento.cliente
              ?.toLowerCase()
              .includes(termo) ||

            orcamento.obra
              ?.toLowerCase()
              .includes(termo)
          )
        }
      )

    }, [
      busca,
      orcamentos
    ])

  // ============================================
  // CARDS
  // ============================================

  const totalOrcamentos =
    orcamentos.length

  const totalCusto =
    orcamentos.reduce(
      (acc, item) =>
        acc + (item.custo || 0),
      0
    )

  const totalVenda =
    orcamentos.reduce(
      (acc, item) =>
        acc + (item.venda || 0),
      0
    )

  const totalAMedir =
    orcamentos.reduce(
      (acc, item) =>
        acc + (item.aMedir || 0),
      0
    )

  // ============================================
  // FORMATAR MOEDA
  // ============================================

  function formatCurrency(
    value?: number
  ) {

    return (
      value || 0
    ).toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )
  }

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

                  <div className="flex items-center gap-3 mb-2">

                    <div
                      className="
                        w-12
                        h-12
                        rounded-2xl
                        bg-emerald-500/10
                        border
                        border-emerald-500/20
                        flex
                        items-center
                        justify-center
                      "
                    >

                      <Calculator
                        size={24}
                        className="text-emerald-400"
                      />
                    </div>

                    <div>

                      <h1 className="text-4xl font-bold">
                        Orçamentos
                      </h1>

                      <p className="text-zinc-400">
                        Consulte e gerencie todos os orçamentos da plataforma
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">

                  <Link
                    href="/orcamentos/new"
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

                    Novo orçamento
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-8">

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">

              <div
                className="
                  rounded-[28px]
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-6
                "
              >

                <p className="text-sm text-zinc-400 mb-2">
                  Total de orçamentos
                </p>

                <h3 className="text-3xl font-bold">
                  {totalOrcamentos}
                </h3>
              </div>

              <div
                className="
                  rounded-[28px]
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-6
                "
              >

                <p className="text-sm text-zinc-400 mb-2">
                  Total em custo
                </p>

                <h3 className="text-3xl font-bold">
                  R$ {formatCurrency(totalCusto)}
                </h3>
              </div>

              <div
                className="
                  rounded-[28px]
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-6
                "
              >

                <p className="text-sm text-zinc-400 mb-2">
                  Total venda + taxas
                </p>

                <h3 className="text-3xl font-bold">
                  R$ {formatCurrency(totalVenda)}
                </h3>
              </div>

              <div
                className="
                  rounded-[28px]
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-6
                "
              >

                <p className="text-sm text-zinc-400 mb-2">
                  Total a medir
                </p>

                <h3 className="text-3xl font-bold">
                  R$ {formatCurrency(totalAMedir)}
                </h3>
              </div>
            </div>

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

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

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
                    Buscar orçamento
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
                      placeholder="Número, cliente ou obra..."
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

                    <option>
                      Todos
                    </option>

                    <option>
                      Orçamento
                    </option>

                    <option>
                      Contrato
                    </option>
                  </select>
                </div>

                {/* BOTÃO */}
                <div className="flex items-end">

                  <button
                    className="
                      h-12
                      w-full
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
                overflow-hidden
              "
            >

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1300px]">

                  <thead
                    className="
                      bg-white/[0.03]
                      border-b
                      border-white/10
                    "
                  >

                    <tr>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Núm.
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Tipo
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Cliente
                      </th>

                      <th className="text-left px-6 py-5 text-sm font-semibold">
                        Obra
                      </th>

                      <th className="text-right px-6 py-5 text-sm font-semibold">
                        Custo (R$)
                      </th>

                      <th className="text-right px-6 py-5 text-sm font-semibold">
                        Venda+taxas (R$)
                      </th>

                      <th className="text-center px-6 py-5 text-sm font-semibold">
                        Medição
                      </th>

                      <th className="text-right px-6 py-5 text-sm font-semibold">
                        Medido (R$)
                      </th>

                      <th className="text-right px-6 py-5 text-sm font-semibold">
                        A medir (R$)
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
                          colSpan={10}
                          className="
                            text-center
                            py-10
                            text-zinc-400
                          "
                        >
                          Carregando orçamentos...
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      orcamentosFiltrados.map((orcamento) => (

                      <tr
                        key={orcamento.id}
                        className="
                          relative
                          border-b
                          border-white/5
                          hover:bg-white/[0.03]
                          transition-all
                        "
                      >

                        {/* NUMERO */}
                        <td className="px-6 py-5">

                          <div>

                            <p className="font-semibold">
                              {orcamento.numero || '-'}
                            </p>

                            <span className="text-xs text-zinc-500">
                              ID #{orcamento.id}
                            </span>
                          </div>
                        </td>

                        {/* TIPO */}
                        <td className="px-6 py-5">

                          <div
                            className={`
                              inline-flex
                              items-center
                              px-3
                              py-1
                              rounded-full
                              text-xs
                              border
                              ${
                                orcamento.tipo === 'Contrato'
                                  ? `
                                    border-blue-500/20
                                    bg-blue-500/10
                                    text-blue-400
                                  `
                                  : `
                                    border-emerald-500/20
                                    bg-emerald-500/10
                                    text-emerald-400
                                  `
                              }
                            `}
                          >
                            {orcamento.tipo || '-'}
                          </div>
                        </td>

                        {/* CLIENTE */}
                        <td className="px-6 py-5 text-sm text-zinc-300">
                          {orcamento.cliente || '-'}
                        </td>

                        {/* OBRA */}
                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                w-10
                                h-10
                                rounded-xl
                                bg-white/[0.04]
                                border
                                border-white/10
                                flex
                                items-center
                                justify-center
                              "
                            >

                              <FileText
                                size={16}
                                className="text-zinc-400"
                              />
                            </div>

                            <div>

                              <p className="font-medium">
                                {orcamento.obra || '-'}
                              </p>

                              <span className="text-xs text-zinc-500">
                                Obra vinculada
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* CUSTO */}
                        <td className="px-6 py-5 text-right font-medium">
                          {formatCurrency(
                            orcamento.custo
                          )}
                        </td>

                        {/* VENDA */}
                        <td className="px-6 py-5 text-right font-medium text-emerald-400">
                          {formatCurrency(
                            orcamento.venda
                          )}
                        </td>

                        {/* MEDICAO */}
                        <td className="px-6 py-5 text-center text-sm text-zinc-300">
                          {orcamento.medicao || '-'}
                        </td>

                        {/* MEDIDO */}
                        <td className="px-6 py-5 text-right font-medium">
                          {formatCurrency(
                            orcamento.medido
                          )}
                        </td>

                        {/* A MEDIR */}
                        <td className="px-6 py-5 text-right font-semibold text-yellow-400">
                          {formatCurrency(
                            orcamento.aMedir
                          )}
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
                                  menuOpenId === orcamento.id
                                    ? null
                                    : orcamento.id
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
                      orcamentosFiltrados.length === 0 && (

                      <tr>

                        <td
                          colSpan={10}
                          className="
                            text-center
                            py-10
                            text-zinc-500
                          "
                        >
                          Nenhum orçamento encontrado
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
            href={`/orcamentos/edit/${menuOpenId}`}
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

            Editar orçamento
          </Link>

          <button
            onClick={() => {

              const orcamento =
                orcamentos.find(
                  item =>
                    item.id === menuOpenId
                )

              if (orcamento) {

                setOrcamentoDelete(
                  orcamento
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

            Deletar orçamento
          </button>
        </div>
      )}

      {/* MODAL DELETE */}
      {orcamentoDelete && (

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
                  setOrcamentoDelete(null)
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
                Deletar orçamento
              </h2>

              <p className="text-zinc-400 leading-relaxed">
                Você está prestes a deletar o orçamento{' '}
                <span className="text-white font-semibold">
                  {orcamentoDelete.numero}
                </span>.
                <br />
                Essa ação não poderá ser desfeita.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center justify-end gap-3">

              <button
                onClick={() =>
                  setOrcamentoDelete(null)
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
                onClick={deleteOrcamento}
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