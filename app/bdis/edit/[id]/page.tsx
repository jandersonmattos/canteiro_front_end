'use client'

import Link from 'next/link'

import {
  useMemo,
  useState,
  useEffect
} from 'react'

import {
  useRouter,
  useParams
} from 'next/navigation'

import toast from 'react-hot-toast'

import Sidebar from '../../../../components/Sidebar'

import {
  ArrowLeft,
  Save,
  RefreshCcw,
  Plus,
  Trash2,
  Pencil
} from 'lucide-react'

type GrupoItem = {
  id?: string
  descricao: string
  valor: number
}

type Grupo = {
  id?: string
  key: string
  titulo: string
  descricao?: string
  itens: GrupoItem[]
}

export default function EditBDIPage() {

  const router = useRouter()

  const params = useParams()

  const bdiId =
    params.id as string

  const [loading, setLoading] =
    useState(false)

  const [loadingData, setLoadingData] =
    useState(true)

  const [nome, setNome] =
    useState('')

  const [descricao, setDescricao] =
    useState('')

  const [grupos, setGrupos] =
    useState<Grupo[]>([])

  const [percentualCache, setPercentualCache] =
    useState(0)

  const formula =
    '(((1+A+B+C)*(1+D)*(1+E)/(1-F))-1)'

  useEffect(() => {
    loadBDI()
  }, [])

  async function loadBDI() {

    try {

      setLoadingData(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/bdis/${bdiId}`
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao carregar BDI'
        )
      }

      const data =
        await response.json()

      setNome(
        data.nome || ''
      )

      setDescricao(
        data.descricao || ''
      )

      setPercentualCache(
        Number(
          data.percentual_total || 0
        )
      )

      const gruposFormatados =
        (data.grupos || []).map(
          (grupo: any) => ({
            id: grupo.id,

            key:
              grupo.codigo,

            titulo:
              grupo.titulo,

            descricao:
              grupo.descricao || '',

            itens:
              (grupo.itens || []).map(
                (item: any) => ({
                  id: item.id,

                  descricao:
                    item.descricao,

                  valor:
                    Number(
                      item.percentual || 0
                    )
                })
              )
          })
        )

      setGrupos(
        gruposFormatados
      )

    } catch (error: any) {

      console.error(error)

      toast.error(
        error.message ||
        'Erro ao carregar BDI'
      )

      router.push('/bdis')

    } finally {

      setLoadingData(false)
    }
  }

  function handleChangeValor(
    grupoKey: string,
    itemIndex: number,
    value: string
  ) {

    setGrupos((old) =>
      old.map((grupo) => {

        if (
          grupo.key !== grupoKey
        ) {
          return grupo
        }

        return {
          ...grupo,

          itens:
            grupo.itens.map(
              (item, index) => {

                if (
                  index !== itemIndex
                ) {
                  return item
                }

                return {
                  ...item,

                  valor:
                    Number(
                      value
                        .replace(',', '.')
                    ) || 0
                }
              }
            )
        }
      })
    )
  }

  function handleChangeDescricao(
    grupoKey: string,
    itemIndex: number,
    value: string
  ) {

    setGrupos((old) =>
      old.map((grupo) => {

        if (
          grupo.key !== grupoKey
        ) {
          return grupo
        }

        return {
          ...grupo,

          itens:
            grupo.itens.map(
              (item, index) => {

                if (
                  index !== itemIndex
                ) {
                  return item
                }

                return {
                  ...item,
                  descricao: value
                }
              }
            )
        }
      })
    )
  }

  function handleChangeTituloGrupo(
    grupoKey: string,
    value: string
  ) {

    setGrupos((old) =>
      old.map((grupo) => {

        if (
          grupo.key !== grupoKey
        ) {
          return grupo
        }

        return {
          ...grupo,
          titulo: value
        }
      })
    )
  }

  function handleChangeDescricaoGrupo(
    grupoKey: string,
    value: string
  ) {

    setGrupos((old) =>
      old.map((grupo) => {

        if (
          grupo.key !== grupoKey
        ) {
          return grupo
        }

        return {
          ...grupo,
          descricao: value
        }
      })
    )
  }

  function handleAddItem(
    grupoKey: string
  ) {

    setGrupos((old) =>
      old.map((grupo) => {

        if (
          grupo.key !== grupoKey
        ) {
          return grupo
        }

        return {
          ...grupo,

          itens: [
            ...grupo.itens,
            {
              descricao: '',
              valor: 0
            }
          ]
        }
      })
    )
  }

  function handleRemoveItem(
    grupoKey: string,
    itemIndex: number
  ) {

    setGrupos((old) =>
      old.map((grupo) => {

        if (
          grupo.key !== grupoKey
        ) {
          return grupo
        }

        return {
          ...grupo,

          itens:
            grupo.itens.filter(
              (_, index) =>
                index !== itemIndex
            )
        }
      })
    )
  }

  const totais = useMemo(() => {

    const result:
      Record<string, number> = {}

    grupos.forEach((grupo) => {

      result[grupo.key] =
        grupo.itens.reduce(
          (acc, item) =>
            acc + (
              Number(item.valor) || 0
            ),
          0
        )
    })

    return result

  }, [grupos])

  const bdiCalculado =
    useMemo(() => {

      const A =
        (totais.A || 0) / 100

      const B =
        (totais.B || 0) / 100

      const C =
        (totais.C || 0) / 100

      const D =
        (totais.D || 0) / 100

      const E =
        (totais.E || 0) / 100

      const F =
        (totais.F || 0) / 100

      const resultado =
        (
          (
            (
              (1 + A + B + C) *
              (1 + D) *
              (1 + E)
            ) /
            (1 - F)
          ) - 1
        ) * 100

      return resultado

    }, [totais])

  function handleRecalculate() {

    const valor =
      Number(
        bdiCalculado.toFixed(2)
      )

    setPercentualCache(
      valor
    )

    toast.success(
      `BDI recalculado: ${valor.toFixed(2)}%`
    )
  }

  async function handleSave() {

    if (!nome.trim()) {

      toast.error(
        'Informe o nome do BDI'
      )

      return
    }

    try {

      setLoading(true)

      const percentualFinal =
        Number(
          bdiCalculado.toFixed(2)
        )

      const payload = {
        nome,
        descricao,
        formula,

        percentual_total:
          percentualFinal,

        grupos:
          grupos.map(
            (
              grupo,
              grupoIndex
            ) => ({
              id: grupo.id,

              codigo:
                grupo.key,

              titulo:
                grupo.titulo,

              descricao:
                grupo.descricao || '',

              ordem:
                grupoIndex,

              total_percentual:
                totais[
                  grupo.key
                ] || 0,

              itens:
                grupo.itens.map(
                  (
                    item,
                    itemIndex
                  ) => ({
                    id: item.id,

                    descricao:
                      item.descricao,

                    percentual:
                      Number(
                        item.valor
                      ) || 0,

                    ordem:
                      itemIndex
                  })
                )
            })
          )
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/bdis/${bdiId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify(
            payload
          )
        }
      )

      if (!response.ok) {

        const error =
          await response.json()

        throw new Error(
          error.detail ||
          'Erro ao atualizar BDI'
        )
      }

      toast.success(
        'BDI atualizado com sucesso'
      )

      router.push('/bdis')

    } catch (error: any) {

      console.error(error)

      toast.error(
        error.message ||
        'Erro ao atualizar BDI'
      )

    } finally {

      setLoading(false)
    }
  }

  if (loadingData) {

    return (
      <div
        className="
          min-h-screen
          bg-black
          text-white
          flex
        "
      >

        <Sidebar />

        <main
          className="
            flex-1
            flex
            items-center
            justify-center
          "
        >

          <div
            className="
              text-zinc-400
              text-xl
            "
          >
            Carregando BDI...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div
      className="
        min-h-screen
        bg-black
        text-white
        flex
      "
    >

      <Sidebar />

      <main
        className="
          flex-1
          overflow-auto
        "
      >

        <div
          className="
            border-b
            border-white/10
            bg-black/70
            backdrop-blur-xl
          "
        >

          <div
            className="
              px-8
              py-6
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-5
                "
              >

                <Link
                  href="/bdis"
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

                  <h1
                    className="
                      text-4xl
                      font-bold
                      mb-2
                    "
                  >
                    Editar BDI
                  </h1>

                  <p
                    className="
                      text-zinc-400
                    "
                  >
                    Atualize a composição de BDI
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
                  : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>

        <div
          className="
            p-8
            space-y-8
          "
        >

          {grupos.map((grupo) => (

            <div
              key={grupo.key}
              className="
                rounded-[32px]
                border
                border-white/10
                bg-white/[0.03]
                overflow-hidden
              "
            >

              {/* HEADER */}
              <div
                className="
                  bg-zinc-900
                  px-6
                  py-6
                  border-b
                  border-white/10
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    lg:flex-row
                    gap-6
                  "
                >

                  {/* TAG */}
                  <div
                    className="
                      flex
                      items-start
                    "
                  >

                    <div
                      className="
                        px-4
                        h-12
                        rounded-2xl
                        bg-emerald-500/10
                        border
                        border-emerald-500/20
                        text-emerald-400
                        font-bold
                        flex
                        items-center
                      "
                    >
                      GRUPO {grupo.key}
                    </div>
                  </div>

                  {/* EDITÁVEL */}
                  <div
                    className="
                      flex-1
                      space-y-3
                    "
                  >

                    <div
                      className="
                        relative
                      "
                    >

                      <Pencil
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
                        value={
                          grupo.titulo
                        }
                        onChange={(e) =>
                          handleChangeTituloGrupo(
                            grupo.key,
                            e.target.value
                          )
                        }
                        placeholder="Título do grupo"
                        className="
                          w-full
                          h-12
                          rounded-2xl
                          border
                          border-white/10
                          bg-black/40
                          pl-11
                          pr-4
                          text-lg
                          font-semibold
                          outline-none
                          focus:border-emerald-500/40
                        "
                      />
                    </div>

                    <textarea
                      value={
                        grupo.descricao || ''
                      }
                      onChange={(e) =>
                        handleChangeDescricaoGrupo(
                          grupo.key,
                          e.target.value
                        )
                      }
                      placeholder="Descrição do grupo"
                      className="
                        w-full
                        min-h-[90px]
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/40
                        px-4
                        py-3
                        text-sm
                        text-zinc-300
                        outline-none
                        resize-none
                        focus:border-emerald-500/40
                      "
                    />
                  </div>
                </div>
              </div>

              {/* ITENS */}
              <div
                className="
                  divide-y
                  divide-white/5
                "
              >

                {grupo.itens.map(
                  (
                    item,
                    itemIndex
                  ) => (

                    <div
                      key={itemIndex}
                      className="
                        px-6
                        py-5
                      "
                    >

                      <div
                        className="
                          grid
                          grid-cols-12
                          gap-4
                          items-center
                        "
                      >

                        <div
                          className="
                            col-span-12
                            md:col-span-1
                            text-zinc-400
                          "
                        >
                          {itemIndex + 1}
                        </div>

                        <div
                          className="
                            col-span-12
                            md:col-span-6
                          "
                        >

                          <input
                            value={
                              item.descricao
                            }
                            onChange={(e) =>
                              handleChangeDescricao(
                                grupo.key,
                                itemIndex,
                                e.target.value
                              )
                            }
                            placeholder="Descrição do item"
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
                          />
                        </div>

                        <div
                          className="
                            col-span-10
                            md:col-span-4
                          "
                        >

                          <div
                            className="
                              relative
                            "
                          >

                            <input
                              type="number"
                              step="0.01"
                              value={
                                item.valor
                              }
                              onChange={(e) =>
                                handleChangeValor(
                                  grupo.key,
                                  itemIndex,
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
                                pr-10
                                outline-none
                                focus:border-emerald-500/40
                              "
                            />

                            <span
                              className="
                                absolute
                                right-4
                                top-1/2
                                -translate-y-1/2
                                text-zinc-500
                              "
                            >
                              %
                            </span>
                          </div>
                        </div>

                        <div
                          className="
                            col-span-2
                            md:col-span-1
                          "
                        >

                          <button
                            onClick={() =>
                              handleRemoveItem(
                                grupo.key,
                                itemIndex
                              )
                            }
                            className="
                              w-12
                              h-12
                              rounded-2xl
                              border
                              border-red-500/20
                              bg-red-500/10
                              flex
                              items-center
                              justify-center
                              text-red-400
                              hover:bg-red-500/20
                              transition-all
                            "
                          >

                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* FOOTER */}
              <div
                className="
                  px-6
                  py-5
                  border-t
                  border-white/10
                  bg-black/20
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                    gap-5
                  "
                >

                  <button
                    onClick={() =>
                      handleAddItem(
                        grupo.key
                      )
                    }
                    className="
                      h-12
                      px-5
                      rounded-2xl
                      bg-emerald-500
                      text-black
                      font-semibold
                      flex
                      items-center
                      gap-3
                      hover:bg-emerald-400
                      transition-all
                      w-fit
                    "
                  >

                    <Plus size={18} />

                    Adicionar item
                  </button>

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >

                    <span
                      className="
                        text-zinc-400
                      "
                    >
                      Total do grupo {grupo.key}
                    </span>

                    <span
                      className="
                        text-2xl
                        font-bold
                        text-emerald-400
                      "
                    >
                      {(
                        totais[
                          grupo.key
                        ] || 0
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* FORMULA */}
          <div
            className="
              rounded-[32px]
              border
              border-white/10
              bg-white/[0.03]
              overflow-hidden
            "
          >

            <div
              className="
                bg-zinc-900
                px-6
                py-5
                border-b
                border-white/10
              "
            >

              <div
                className="
                  grid
                  grid-cols-12
                  gap-4
                  items-center
                "
              >

                <div
                  className="
                    col-span-12
                    md:col-span-8
                    font-bold
                  "
                >
                  FÓRMULA PARA CÁLCULO DO B.D.I
                </div>

                <div
                  className="
                    col-span-12
                    md:col-span-4
                  "
                >

                  <input
                    disabled
                    value={formula}
                    className="
                      w-full
                      h-12
                      rounded-xl
                      border
                      border-white/10
                      bg-white
                      text-black
                      px-4
                    "
                  />
                </div>
              </div>
            </div>

            <div
              className="
                p-8
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  flex-col
                  lg:flex-row
                  gap-8
                "
              >

                <div>

                  <div
                    className="
                      text-3xl
                      text-zinc-300
                      mb-3
                    "
                  >
                    Benefícios e Despesas
                    Indiretas (B.D.I)
                  </div>

                  <div
                    className="
                      text-zinc-500
                    "
                  >
                    Percentual salvo:

                    <span
                      className="
                        text-white
                        ml-2
                        font-semibold
                      "
                    >
                      {percentualCache.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div
                  className="
                    text-6xl
                    font-black
                    text-emerald-400
                  "
                >
                  {bdiCalculado.toFixed(
                    2
                  )}%
                </div>
              </div>

              <div
                className="
                  flex
                  justify-end
                  mt-10
                  gap-4
                "
              >

                <button
                  onClick={
                    handleRecalculate
                  }
                  className="
                    h-12
                    px-6
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    text-white
                    font-semibold
                    flex
                    items-center
                    gap-3
                    hover:bg-white/[0.06]
                    transition-all
                  "
                >

                  <RefreshCcw size={18} />

                  Recalcular
                </button>

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
                    : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}