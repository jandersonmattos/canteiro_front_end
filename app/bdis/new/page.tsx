'use client'

import Link from 'next/link'

import {
  useMemo,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import toast from 'react-hot-toast'

import Sidebar from '../../../components/Sidebar'

import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Pencil
} from 'lucide-react'

type GrupoItem = {
  descricao: string
  valor: number
}

type Grupo = {
  key: string
  titulo: string
  descricao?: string
  itens: GrupoItem[]
}

export default function NewBDIPage() {

  const router = useRouter()

  const [loading, setLoading] =
    useState(false)

  const [nome, setNome] =
    useState('')

  const [descricao, setDescricao] =
    useState('')

  const [bdiResultado, setBdiResultado] =
    useState(0)

  const [grupos, setGrupos] =
    useState<Grupo[]>([
      {
        key: 'A',

        titulo:
          'TAXA ADMINISTRATIVA DA ADMINISTRAÇÃO CENTRAL',

        descricao:
          'Custos administrativos centrais da empresa.',

        itens: [
          {
            descricao:
              'Administração Central',

            valor: 2.00
          }
        ]
      },

      {
        key: 'B',

        titulo:
          'TAXA REPRESENTATIVA DOS RISCOS',

        descricao:
          'Percentual relacionado aos riscos da operação.',

        itens: [
          {
            descricao: 'Riscos',

            valor: 0.71
          }
        ]
      },

      {
        key: 'C',

        titulo:
          'TAXA REPRESENTATIVA SEGURO GARANTIA',

        descricao:
          'Custos relacionados ao seguro garantia.',

        itens: [
          {
            descricao: 'Risco',

            valor: 0.70
          }
        ]
      },

      {
        key: 'D',

        titulo:
          'TAXA REPRESENTATIVA DAS DESPESAS FINANCEIRAS',

        descricao:
          'Despesas financeiras da operação.',

        itens: [
          {
            descricao:
              'Despesas Financeiras',

            valor: 0.55
          }
        ]
      },

      {
        key: 'E',

        titulo:
          'TAXA REPRESENTATIVA DO LUCRO',

        descricao:
          'Margem de lucro esperada.',

        itens: [
          {
            descricao: 'Lucro',

            valor: 1.00
          }
        ]
      },

      {
        key: 'F',

        titulo:
          'TAXA REPRESENTATIVA DA INCIDÊNCIA DOS IMPOSTOS ( SOBRE O FATURAMENTO DA EMPRESA )',

        descricao:
          'Tributos incidentes sobre o faturamento.',

        itens: [
          {
            descricao:
              'ISS (IMPOSTO SOBRE SERVIÇOS) - MUNICIPAL',

            valor: 3.07
          },

          {
            descricao:
              'COFINS - FEDERAL',

            valor: 1.86
          },

          {
            descricao:
              'PIS (PROGRAMA DE INTEGRAÇÃO SOCIAL) - FEDERAL',

            valor: 0.42
          },

          {
            descricao:
              'CRB - CONTRIBUIÇÃO INSS (DESONERAÇÃO)',

            valor: 4.50
          }
        ]
      }
    ])

  const formula =
    '(((1+A+B+C)*(1+D)*(1+E)/(1-F))-1)'

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
                      value.replace(',', '.')
                    ) || 0
                }
              }
            )
        }
      })
    )
  }

  function handleChangeDescricaoItem(
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
            acc + item.valor,
          0
        )
    })

    return result

  }, [grupos])

  function calcularBDI() {

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

    setBdiResultado(resultado)
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

      const payload = {
        nome,

        descricao,

        formula,

        percentual_total:
          Number(
            bdiResultado.toFixed(2)
          ),

        grupos: grupos.map(
          (
            grupo,
            grupoIndex
          ) => ({

            codigo:
              grupo.key,

            titulo:
              grupo.titulo,

            descricao:
              grupo.descricao || '',

            ordem:
              grupoIndex,

            total_percentual:
              Number(
                (
                  totais[
                    grupo.key
                  ] || 0
                ).toFixed(2)
              ),

            itens:
              grupo.itens.map(
                (
                  item,
                  itemIndex
                ) => ({

                  descricao:
                    item.descricao,

                  percentual:
                    Number(
                      item.valor.toFixed(2)
                    ),

                  ordem:
                    itemIndex
                })
              )
          })
        )
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/bdis`,
        {
          method: 'POST',

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
          'Erro ao salvar BDI'
        )
      }

      toast.success(
        'BDI cadastrado com sucesso'
      )

      router.push('/bdis')

    } catch (error: any) {

      console.error(error)

      toast.error(
        error.message ||
        'Erro ao salvar BDI'
      )

    } finally {

      setLoading(false)
    }
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

        {/* HEADER */}
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
                    Novo BDI
                  </h1>

                  <p
                    className="
                      text-zinc-400
                    "
                  >
                    Cadastre uma nova composição de BDI
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
                  : 'Salvar BDI'}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="
            p-8
            space-y-8
          "
        >

          {/* DADOS */}
          <div
            className="
              rounded-[32px]
              border
              border-white/10
              bg-white/[0.03]
              p-8
            "
          >

            <div
              className="
                mb-8
              "
            >

              <h2
                className="
                  text-3xl
                  font-bold
                  mb-2
                "
              >
                Dados do BDI
              </h2>

              <p
                className="
                  text-zinc-400
                "
              >
                Informe os dados principais
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
              "
            >

              <div
                className="
                  md:col-span-2
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
                  Nome *
                </label>

                <input
                  value={nome}
                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }
                  placeholder="Digite o nome do BDI"
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

              <div
                className="
                  md:col-span-2
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
                  Descrição
                </label>

                <textarea
                  value={descricao}
                  onChange={(e) =>
                    setDescricao(
                      e.target.value
                    )
                  }
                  placeholder="Digite uma descrição para o BDI"
                  className="
                    w-full
                    min-h-[120px]
                    rounded-2xl
                    border
                    border-white/10
                    bg-black/40
                    px-5
                    py-4
                    outline-none
                    resize-none
                    focus:border-emerald-500/40
                  "
                />
              </div>
            </div>
          </div>

          {/* GRUPOS */}
          <div
            className="
              space-y-6
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
                                handleChangeDescricaoItem(
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
                        {(totais[
                          grupo.key
                        ] || 0).toFixed(2)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

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

                <div
                  className="
                    text-3xl
                    text-zinc-300
                  "
                >
                  Benefícios e Despesas
                  Indiretas (B.D.I) =
                </div>

                <div
                  className="
                    text-6xl
                    font-black
                    text-emerald-400
                  "
                >
                  {bdiResultado.toFixed(2)} %
                </div>
              </div>

              <div
                className="
                  flex
                  justify-end
                  mt-10
                "
              >

                <button
                  onClick={calcularBDI}
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
                  Recalcular fórmula
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}