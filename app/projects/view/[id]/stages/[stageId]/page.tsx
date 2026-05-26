'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  useParams
} from 'next/navigation'

import Sidebar from '../../../../../../components/Sidebar'

import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react'

type LooseObject = Record<string, unknown>

type StageMeta = {
  id: string
  name: string
  workStageId: string
  plannedStartDate: string
  plannedEndDate: string
  realStartDate: string
  realEndDate: string
}

type CostEntry = {
  id: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  plannedValue: number
  paidValue: number
  date: string
  notes: string
}

type CostItem = {
  id: string
  name: string
  entries: CostEntry[]
}

type DraftEntry = {
  description: string
  unit: string
  quantity: string
  unitPrice: string
  totalPrice: string
  plannedValue: string
  paidValue: string
  date: string
  notes: string
}

type StageTotals = {
  totalStage: number
  totalPaid: number
  totalToPay: number
}

const UNIT_OPTIONS = [
  'Barra',
  'CJ',
  'dia',
  'hora',
  'kg',
  'm',
  'm linear',
  'm2',
  'm3',
  'Mês',
  'Milheiro',
  't',
  'unit',
  'verba'
]

function makeId() {
  const perfNow =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? Math.round(performance.now() * 1000)
      : 0

  const randomPart = Math.random().toString(16).slice(2)

  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${crypto.randomUUID()}-${perfNow}-${randomPart}`
  }

  return `${Date.now()}-${perfNow}-${randomPart}`
}

function pickString(...values: unknown[]) {
  const found = values.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  )

  return typeof found === 'string' ? found : ''
}

function normalizeProjectName(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return ''
  }

  const item = raw as LooseObject

  return pickString(item.nome, item.name)
}

function normalizeStageMeta(raw: unknown, index: number): StageMeta | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const value = raw as LooseObject

  const id = pickString(
    value.project_stage_id,
    value.projeto_etapa_id,
    value.projectStageId,
    value.id_projeto_etapa,
    (value.project_stage as LooseObject | undefined)?.id,
    (value.projeto_etapa as LooseObject | undefined)?.id,
    value.id,
    value.stage_id,
    (value.stage as LooseObject | undefined)?.id
  )

  const name = pickString(
    value.name,
    value.nome,
    value.stage_name,
    (value.stage as LooseObject | undefined)?.name,
    (value.stage as LooseObject | undefined)?.nome
  )

  if (!id && !name) {
    return null
  }

  return {
    id: id || `stage-${index}`,
    name: name || `Etapa ${index + 1}`,
    workStageId: pickString(
      value.etapaid,
      value.etapa_id,
      value.stage_id,
      (value.stage as LooseObject | undefined)?.id,
      (value.etapa as LooseObject | undefined)?.id
    ),
    plannedStartDate: pickString(
      value.data_inicio_prevista,
      value.planned_start_date,
      value.data_inicio,
      value.start_date,
      value.inicio
    ),
    plannedEndDate: pickString(
      value.data_fim_prevista,
      value.planned_end_date,
      value.data_fim,
      value.end_date,
      value.fim
    ),
    realStartDate: pickString(
      value.data_inicio_real,
      value.real_start_date
    ),
    realEndDate: pickString(
      value.data_fim_real,
      value.real_end_date
    )
  }
}

function parseStages(raw: unknown): StageMeta[] {
  const root = raw && typeof raw === 'object' ? (raw as LooseObject) : {}

  const source = (
    Array.isArray(raw)
      ? raw
      : Array.isArray(root.stages)
      ? root.stages
      : Array.isArray(root.etapas)
      ? root.etapas
      : []
  ) as unknown[]

  const result = source
    .map((item, index) => {
      if (typeof item === 'string' || typeof item === 'number') {
        const stringValue = String(item)

        return {
          id: stringValue,
          name: `Etapa ${stringValue}`,
          workStageId: '',
          plannedStartDate: '',
          plannedEndDate: '',
          realStartDate: '',
          realEndDate: ''
        }
      }

      return normalizeStageMeta(item, index)
    })
    .filter(Boolean) as StageMeta[]

  return result
}

function formatDateLabel(value: string) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('pt-BR')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

function formatCurrencyInputBRL(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(digits) / 100)
}

function formatPeriodRange(startDate: string, endDate: string) {
  const start = formatDateLabel(startDate)
  const end = formatDateLabel(endDate)

  if (start === '-' && end === '-') {
    return '-'
  }

  return `${start} - ${end}`
}

function toDateInputValue(value: string) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

function parseInputDate(value: string) {
  const normalized = toDateInputValue(value)

  if (!normalized) {
    return null
  }

  const [year, month, day] = normalized.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDateForApi(value: Date | null) {
  if (!value) {
    return null
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parsePositiveNumber(value: string) {
  if (!value.trim()) {
    return 0
  }

  const normalized = value
    .trim()
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return 0
}

function normalizeStageTotals(raw: unknown): StageTotals {
  const item = raw && typeof raw === 'object'
    ? raw as Record<string, unknown>
    : {}

  const totalStage = pickNumber(
    item.total_da_etapa,
    item.total_etapa,
    item.total_stage,
    item.total,
    item.valor_total
  )

  const totalPaid = pickNumber(
    item.total_pago,
    item.total_paid,
    item.pago,
    item.valor_pago
  )

  const totalToPayRaw = pickNumber(
    item.total_a_pagar,
    item.total_to_pay,
    item.a_pagar,
    item.valor_a_pagar
  )

  const totalToPay = totalToPayRaw > 0
    ? totalToPayRaw
    : Math.max(totalStage - totalPaid, 0)

  return {
    totalStage,
    totalPaid,
    totalToPay
  }
}

function emptyDraft(): DraftEntry {
  return {
    description: '',
    unit: 'unit',
    quantity: '1',
    unitPrice: '',
    totalPrice: '',
    plannedValue: '',
    paidValue: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  }
}

export default function ProjectStageDetailsPage() {

  const params = useParams<{
    id: string
    stageId: string
  }>()

  const projectId = params.id
  const stageId = decodeURIComponent(params.stageId || '')

  const [loadingContext, setLoadingContext] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [stageMeta, setStageMeta] = useState<StageMeta | null>(null)

  const [costItems, setCostItems] = useState<CostItem[]>([])

  const [newItemName, setNewItemName] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [savingEntryItemId, setSavingEntryItemId] = useState<string | null>(null)
  const [entryDraft, setEntryDraft] = useState<DraftEntry>(emptyDraft)
  const [plannedStartDate, setPlannedStartDate] = useState<Date | null>(null)
  const [plannedEndDate, setPlannedEndDate] = useState<Date | null>(null)
  const [realStartDate, setRealStartDate] = useState<Date | null>(null)
  const [realEndDate, setRealEndDate] = useState<Date | null>(null)
  const [savingStageDates, setSavingStageDates] = useState(false)
  const [loadingStageTotals, setLoadingStageTotals] = useState(false)
  const [stageTotals, setStageTotals] = useState<StageTotals>({
    totalStage: 0,
    totalPaid: 0,
    totalToPay: 0
  })

  const totalLaunches = useMemo(
    () => costItems.reduce((sum, item) => sum + item.entries.length, 0),
    [costItems]
  )

  useEffect(() => {
    setPlannedStartDate(parseInputDate(stageMeta?.plannedStartDate || ''))
    setPlannedEndDate(parseInputDate(stageMeta?.plannedEndDate || ''))
    setRealStartDate(parseInputDate(stageMeta?.realStartDate || ''))
    setRealEndDate(parseInputDate(stageMeta?.realEndDate || ''))
  }, [
    stageMeta?.plannedStartDate,
    stageMeta?.plannedEndDate,
    stageMeta?.realStartDate,
    stageMeta?.realEndDate
  ])

  useEffect(() => {
    if (!projectId || !stageId) {
      return
    }

    loadStageContext()
    loadStageItems()
    loadStageTotals()
  }, [projectId, stageId])

  async function loadStageItems() {
    if (!projectId || !stageId) {
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages/${encodeURIComponent(stageId)}/items`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      if (!Array.isArray(data)) {
        setCostItems([])
        return
      }

      const normalized = data
        .map((rawItem) => {
          if (!rawItem || typeof rawItem !== 'object') {
            return null
          }

          const item = rawItem as Record<string, unknown>
          const itemName = pickString(item.nome, item.name)

          if (!itemName) {
            return null
          }

          const subitemsRaw = Array.isArray(item.subitens) ? item.subitens : []

          const entries = subitemsRaw
            .map((rawSubitem) => {
              if (!rawSubitem || typeof rawSubitem !== 'object') {
                return null
              }

              const subitem = rawSubitem as Record<string, unknown>
              const quantityValue = pickNumber(subitem.quantidade, subitem.quantity)
              const quantity = quantityValue > 0 ? quantityValue : 1
              const unitPrice = pickNumber(
                subitem.valor_unitario,
                subitem.unit_price,
                subitem.unitPrice
              )
              const totalRaw = pickNumber(
                subitem.total,
                subitem.valor_total,
                subitem.total_price,
                subitem.totalPrice
              )

              return {
                id: pickString(subitem.id) || makeId(),
                description: pickString(subitem.descricao, subitem.description),
                unit: pickString(subitem.unidade, subitem.recurso_nome, subitem.unit) || 'unit',
                quantity,
                unitPrice,
                totalPrice: totalRaw > 0 ? totalRaw : quantity * unitPrice,
                plannedValue: pickNumber(
                  subitem.valor_previsto,
                  subitem.planned_value,
                  subitem.plannedValue
                ),
                paidValue: pickNumber(
                  subitem.valor_pago,
                  subitem.paid_value,
                  subitem.paidValue
                ),
                date: pickString(subitem.data, subitem.date),
                notes: pickString(subitem.observacoes, subitem.notes)
              }
            })
            .filter(Boolean) as CostEntry[]

          return {
            id: pickString(item.id) || makeId(),
            name: itemName,
            entries
          }
        })
        .filter(Boolean) as CostItem[]

      setCostItems(normalized)
    } catch (error) {
      console.error(error)
      setCostItems([])
      toast.error('Nao foi possivel carregar os itens da etapa')
    }
  }

  async function loadStageContext() {
    try {
      setLoadingContext(true)

      const [projectResponse, stageResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}`),
        fetch(`${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages`)
      ])

      if (projectResponse.ok) {
        const projectData = await projectResponse.json()
        setProjectName(normalizeProjectName(projectData))
      }

      if (stageResponse.ok) {
        const stageData = await stageResponse.json()
        const stageList = parseStages(stageData)

        const found = stageList.find(
          (item) => String(item.id) === String(stageId)
        )

        setStageMeta(found || null)
      }
    } catch (error) {
      console.error(error)
      toast.error('Nao foi possivel carregar os dados da etapa')
    } finally {
      setLoadingContext(false)
    }
  }

  async function loadStageTotals() {
    if (!projectId || !stageId) {
      return
    }

    try {
      setLoadingStageTotals(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages/${encodeURIComponent(stageId)}/totals`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      setStageTotals(normalizeStageTotals(data))
    } catch (error) {
      console.error(error)
      setStageTotals({
        totalStage: 0,
        totalPaid: 0,
        totalToPay: 0
      })
    } finally {
      setLoadingStageTotals(false)
    }
  }

  async function handleCreateItem() {
    const normalizedName = newItemName.trim()

    if (!normalizedName) {
      toast.error('Informe o nome do item')
      return
    }

    const duplicated = costItems.some(
      (item) => item.name.toLowerCase() === normalizedName.toLowerCase()
    )

    if (duplicated) {
      toast.error('Ja existe um item com esse nome')
      return
    }

    if (!projectId) {
      toast.error('Projeto invalido para criar item')
      return
    }

    if (!stageId) {
      toast.error('Etapa invalida para criar item')
      return
    }

    try {
      setCreatingItem(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages/${encodeURIComponent(stageId)}/items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: normalizedName
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail =
          typeof errorData?.detail === 'string'
            ? errorData.detail
            : 'Erro ao criar item'

        throw new Error(detail)
      }

      const responseData = await response.json().catch(() => null)
      const createdItemId = pickString(responseData?.id)

      const created: CostItem = {
        id: createdItemId || makeId(),
        name: normalizedName,
        entries: []
      }

      setCostItems((current) => [...current, created])
      setNewItemName('')
      setActiveItemId(created.id)
      setEntryDraft(emptyDraft())
      toast.success('Item criado')

      void loadStageItems()

      // Keep financial summary in sync after each launch operation.
      void loadStageTotals()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar item')
    } finally {
      setCreatingItem(false)
    }
  }

  function handleDeleteItem(itemId: string) {
    setCostItems((current) => current.filter((item) => item.id !== itemId))

    if (activeItemId === itemId) {
      setActiveItemId(null)
      setEntryDraft(emptyDraft())
    }
  }

  async function handleAddEntry(itemIndex: number) {
    const selectedItem = costItems[itemIndex]

    if (!selectedItem) {
      toast.error('Item invalido para lancamento')
      return
    }

    if (!projectId) {
      toast.error('Projeto invalido para lancamento')
      return
    }

    const description = entryDraft.description.trim()
    const unit = entryDraft.unit.trim()
    const quantity = parsePositiveNumber(entryDraft.quantity)
    let unitPrice = parsePositiveNumber(entryDraft.unitPrice)
    let totalPrice = parsePositiveNumber(entryDraft.totalPrice)
    const plannedValue = parsePositiveNumber(entryDraft.plannedValue)
    const paidValue = parsePositiveNumber(entryDraft.paidValue)

    if (!description) {
      toast.error('Descreva o subitem')
      return
    }

    if (!unit) {
      toast.error('Selecione a unidade')
      return
    }

    if (quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    if (totalPrice <= 0) {
      totalPrice = quantity * unitPrice
    }

    if (totalPrice < 0) {
      totalPrice = 0
    }

    if (unitPrice <= 0) {
      unitPrice = totalPrice > 0
        ? totalPrice / quantity
        : 0
    }

    try {
      setSavingEntryItemId(selectedItem.id)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/costs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            descricao: description,
            quantidade: quantity,
            valor_unitario: unitPrice,
            valor_previsto: plannedValue,
            valor_pago: paidValue,
            data: entryDraft.date || null,
            etapa_id: stageMeta?.workStageId || null,
            item_id: selectedItem.id,
            recurso_nome: selectedItem.name,
            recurso_id: null,
            categoria_id: null
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail =
          typeof errorData?.detail === 'string'
            ? errorData.detail
            : 'Erro ao salvar subitem'

        throw new Error(detail)
      }

      const responseData = await response.json().catch(() => null)
      const savedId = pickString(
        responseData?.id,
        responseData?.cost_id,
        responseData?.custo_id
      )

      const createdEntry: CostEntry = {
        id: savedId || makeId(),
        description,
        unit,
        quantity,
        unitPrice,
        totalPrice,
        plannedValue,
        paidValue,
        date: entryDraft.date,
        notes: entryDraft.notes.trim()
      }

      setCostItems((current) =>
        current.map((item, currentItemIndex) =>
          currentItemIndex === itemIndex
            ? {
                ...item,
                entries: [...item.entries, createdEntry]
              }
            : item
        )
      )

      setEntryDraft(emptyDraft())
      toast.success('Lancamento adicionado')

      void loadStageItems()

      // Keep financial summary in sync after each launch operation.
      void loadStageTotals()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar subitem')
    } finally {
      setSavingEntryItemId(null)
    }
  }

  function handleDeleteEntry(itemIndex: number, entryIndex: number) {
    setCostItems((current) =>
      current.map((item, currentItemIndex) =>
        currentItemIndex === itemIndex
          ? {
              ...item,
              entries: item.entries.filter((_, index) => index !== entryIndex)
            }
          : item
      )
    )

    // Keep financial summary in sync after each launch operation.
    void loadStageTotals()
  }

  async function handleSaveStageDates() {
    if (!stageId) {
      toast.error('Etapa invalida para atualizacao')
      return
    }

    try {
      setSavingStageDates(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/project-stages/${encodeURIComponent(stageId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            data_inicio_prevista: formatDateForApi(plannedStartDate),
            data_fim_prevista: formatDateForApi(plannedEndDate),
            data_inicio_real: formatDateForApi(realStartDate),
            data_fim_real: formatDateForApi(realEndDate)
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail =
          typeof errorData?.detail === 'string'
            ? errorData.detail
            : 'Erro ao atualizar datas da etapa'

        throw new Error(detail)
      }

      toast.success('Datas da etapa atualizadas com sucesso')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar datas da etapa')
    } finally {
      setSavingStageDates(false)
    }
  }

  const resolvedStageName = stageMeta?.name || stageId || 'Etapa'

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        <div className="border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="px-6 lg:px-8 py-7">

            <div className="flex items-center gap-4">
              <Link
                href={`/projects/view/${projectId}`}
                className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.06] transition-all"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <h1 className="text-4xl font-bold">Detalhes da etapa</h1>
                <p className="text-zinc-400 mt-1">Lancamentos de custo por item e subitens</p>
              </div>
            </div>

          </div>
        </div>

        <div className="p-6 lg:p-8 space-y-6">

          {loadingContext ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 flex items-center gap-3 text-zinc-300">
              <Loader2 size={18} className="animate-spin" />
              Carregando dados da etapa...
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:p-7 space-y-6">

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-3 text-emerald-300 mb-3">
                    <ClipboardList size={18} />
                    <p className="text-sm uppercase tracking-wide">Etapa selecionada</p>
                  </div>

                  <h2 className="text-2xl font-bold break-all">{resolvedStageName}</h2>

                  <p className="mt-2 text-zinc-400 text-sm">
                    {projectName ? `Obra: ${projectName}` : 'Obra selecionada'}
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
                      Prazos da etapa
                    </p>

                    <div className="space-y-2">
                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 space-y-2">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Periodo previsto</p>

                        <DatePicker
                          selectsRange
                          startDate={plannedStartDate}
                          endDate={plannedEndDate}
                          onChange={(dates) => {
                            const [start, end] = dates
                            setPlannedStartDate(start)
                            setPlannedEndDate(end)
                          }}
                          placeholderText="Selecione o periodo previsto"
                          dateFormat="dd/MM/yyyy"
                          monthsShown={2}
                          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-emerald-400/50"
                          calendarClassName="!bg-zinc-950"
                        />

                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 space-y-2">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Periodo real</p>

                        <DatePicker
                          selectsRange
                          startDate={realStartDate}
                          endDate={realEndDate}
                          onChange={(dates) => {
                            const [start, end] = dates
                            setRealStartDate(start)
                            setRealEndDate(end)
                          }}
                          placeholderText="Selecione o periodo real"
                          dateFormat="dd/MM/yyyy"
                          monthsShown={2}
                          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-emerald-400/50"
                          calendarClassName="!bg-zinc-950"
                        />

                      </div>

                      <button
                        type="button"
                        onClick={handleSaveStageDates}
                        disabled={savingStageDates}
                        className="h-10 px-4 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                      >
                        {savingStageDates && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                        Salvar prazos
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
                      Resumo financeiro
                    </p>

                    <div className="space-y-2">
                      {loadingStageTotals ? (
                        <div className="flex items-center gap-2 text-zinc-400 text-sm px-1 py-2">
                          <Loader2 size={14} className="animate-spin" />
                          Carregando totais...
                        </div>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-black/20 px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wide text-emerald-300/90">Total da etapa</p>
                            <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-300">
                              {formatCurrency(stageTotals.totalStage)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                            <span className="text-zinc-300 text-sm">Total pago:</span>
                            <span className="text-emerald-300 font-semibold">{formatCurrency(stageTotals.totalPaid)}</span>
                          </div>

                          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                            <span className="text-zinc-300 text-sm">Total a pagar:</span>
                            <span className="text-emerald-300 font-semibold">{formatCurrency(stageTotals.totalToPay)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:p-7 space-y-6">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Lancamentos de custo</h3>
                    <p className="text-zinc-400 mt-1 text-sm">
                      Estruture seus custos em itens principais e subitens de lancamento.
                    </p>
                  </div>

                  <div className="text-sm text-zinc-300 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
                    {totalLaunches} lancamentos registrados
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-sm text-zinc-300 mb-3">Novo item (grupo de custo)</p>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newItemName}
                      onChange={(event) => setNewItemName(event.target.value)}
                      placeholder="Ex.: Fundacao, Alvenaria, Instalacoes"
                      className="h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                    />

                    <button
                      type="button"
                      onClick={() => void handleCreateItem()}
                      disabled={creatingItem}
                      className="h-11 px-4 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingItem ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Criar item
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {costItems.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-zinc-400 text-sm">
                    Nenhum item cadastrado ainda. Crie um item e comece a lancar os subitens de custo.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {costItems.map((item, itemIndex) => {
                      const itemTotal = item.entries.reduce(
                        (sum, entry) => sum + entry.totalPrice,
                        0
                      )

                      return (
                        <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-zinc-500">Item</p>
                              <h4 className="text-lg font-semibold">{item.name}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-emerald-300 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                                {formatCurrency(itemTotal)}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveItemId(item.id)
                                  setEntryDraft(emptyDraft())
                                }}
                                className="h-9 px-3 rounded-lg border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] transition-all text-sm"
                              >
                                Novo subitem
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="w-9 h-9 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 flex items-center justify-center"
                                title="Remover item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {activeItemId === item.id && (
                            <div className="p-4 border-b border-white/10 bg-black/25 space-y-3">
                              <p className="text-sm text-zinc-300">Novo subitem de custo</p>

                              <div className="grid grid-cols-1 lg:grid-cols-10 gap-3">
                                <input
                                  value={entryDraft.description}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      ...current,
                                      description: event.target.value
                                    }))
                                  }
                                  placeholder="Descricao"
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50 lg:col-span-2"
                                />

                                <select
                                  value={entryDraft.unit}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      ...current,
                                      unit: event.target.value
                                    }))
                                  }
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                                >
                                  {UNIT_OPTIONS.map((unitOption) => (
                                    <option key={unitOption} value={unitOption} className="bg-zinc-950 text-white">
                                      {unitOption}
                                    </option>
                                  ))}
                                </select>
                              
                                <input
                                  value={entryDraft.quantity}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      // Keep total in sync when quantity changes.
                                      ...current,
                                      quantity: event.target.value,
                                      totalPrice:
                                        parsePositiveNumber(current.unitPrice) > 0
                                          ? formatCurrency(
                                              parsePositiveNumber(event.target.value) *
                                              parsePositiveNumber(current.unitPrice)
                                            )
                                          : current.totalPrice
                                    }))
                                  }
                                  placeholder="Qtd"
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                                />

                                <input
                                  value={entryDraft.unitPrice}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      // Recalculate total as soon as unit price changes.
                                      ...current,
                                      unitPrice: formatCurrencyInputBRL(event.target.value),
                                      totalPrice:
                                        parsePositiveNumber(current.quantity) > 0
                                          ? formatCurrency(
                                              parsePositiveNumber(current.quantity) *
                                              parsePositiveNumber(formatCurrencyInputBRL(event.target.value))
                                            )
                                          : current.totalPrice
                                    }))
                                  }
                                  placeholder="Valor unitario"
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                                />

                                <input
                                  value={entryDraft.totalPrice}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      // If total is edited manually, infer unit price.
                                      ...current,
                                      totalPrice: formatCurrencyInputBRL(event.target.value),
                                      unitPrice:
                                        parsePositiveNumber(current.quantity) > 0
                                          ? formatCurrency(
                                              parsePositiveNumber(formatCurrencyInputBRL(event.target.value)) /
                                              parsePositiveNumber(current.quantity)
                                            )
                                          : current.unitPrice
                                    }))
                                  }
                                  placeholder="Valor total"
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                                />

                                <input
                                  value={entryDraft.plannedValue}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      ...current,
                                      plannedValue: formatCurrencyInputBRL(event.target.value)
                                    }))
                                  }
                                  placeholder="Valor previsto"
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                                />

                                <input
                                  value={entryDraft.paidValue}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      ...current,
                                      paidValue: formatCurrencyInputBRL(event.target.value)
                                    }))
                                  }
                                  placeholder="Valor pago"
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                                />

                                <input
                                  type="date"
                                  value={entryDraft.date}
                                  onChange={(event) =>
                                    setEntryDraft((current) => ({
                                      ...current,
                                      date: event.target.value
                                    }))
                                  }
                                  className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                                />

                                <button
                                  type="button"
                                  onClick={() => void handleAddEntry(itemIndex)}
                                  disabled={savingEntryItemId === item.id}
                                  className="h-10 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {savingEntryItemId === item.id ? 'Salvando...' : 'Salvar'}
                                </button>
                              </div>

                              <textarea
                                value={entryDraft.notes}
                                onChange={(event) =>
                                  setEntryDraft((current) => ({
                                    ...current,
                                    notes: event.target.value
                                  }))
                                }
                                placeholder="Observacoes (opcional)"
                                rows={2}
                                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-400/50"
                              />
                            </div>
                          )}

                          {item.entries.length === 0 ? (
                            <div className="px-4 py-4 text-sm text-zinc-500">
                              Nenhum subitem lancado neste item.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[980px] text-sm">
                                <thead>
                                  <tr className="bg-black/40 text-left text-zinc-400 border-b border-white/10">
                                    <th className="px-4 py-2.5 font-medium">Subitem</th>
                                    <th className="px-4 py-2.5 font-medium">Unidade</th>
                                    <th className="px-4 py-2.5 font-medium">Qtd</th>
                                    <th className="px-4 py-2.5 font-medium">Valor unitario</th>
                                    <th className="px-4 py-2.5 font-medium">Total</th>
                                    <th className="px-4 py-2.5 font-medium">Valor previsto</th>
                                    <th className="px-4 py-2.5 font-medium">Valor pago</th>
                                    <th className="px-4 py-2.5 font-medium">Data</th>
                                    <th className="px-4 py-2.5 font-medium text-right">Acao</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.entries.map((entry, entryIndex) => (
                                    <tr key={`${entry.id}-${entryIndex}`} className="border-b border-white/5">
                                      <td className="px-4 py-3 text-zinc-100">{entry.description}</td>
                                      <td className="px-4 py-3 text-zinc-300">{entry.unit}</td>
                                      <td className="px-4 py-3 text-zinc-300">{entry.quantity}</td>
                                      <td className="px-4 py-3 text-zinc-300">{formatCurrency(entry.unitPrice)}</td>
                                      <td className="px-4 py-3 text-emerald-300 font-medium">
                                        {formatCurrency(entry.totalPrice)}
                                      </td>
                                      <td className="px-4 py-3 text-zinc-300">{formatCurrency(entry.plannedValue)}</td>
                                      <td className="px-4 py-3 text-zinc-300">{formatCurrency(entry.paidValue)}</td>
                                      <td className="px-4 py-3 text-zinc-300">{formatDateLabel(entry.date)}</td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteEntry(itemIndex, entryIndex)}
                                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                          title="Excluir subitem"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  )
}
