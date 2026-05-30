'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  useParams,
  useRouter
} from 'next/navigation'

import Sidebar from '../../../../components/Sidebar'
import ProjectDashboardPanel from '../../../../components/ProjectDashboardPanel'

import {
  ArrowLeft,
  Loader2,
  MapPin,
  Home,
  Folder,
  FolderPlus,
  Upload,
  FileText,
  ImageIcon,
  Trash2,
  Download,
  MoreVertical,
  X,
  ChevronRight
} from 'lucide-react'

type LooseObject = Record<string, unknown>

type StageRow = {
  id: string
  name: string
  kind: 'Padrao' | 'Customizada'
  order: number
  startDate: string
  endDate: string
  realizedStartDate: string
  realizedEndDate: string
  totalCost: string
}

type FolderType = {
  id: string
  name: string
  parent_id: string | null
  isNew?: boolean
}

type FileType = {
  id: string
  name: string
  url: string
  mime_type?: string
}

type ProjectInfoType = {
  id: string
  name: string
  imageUrl: string
  category: string
  status: string
  quantityUnits: string
  owner: string
  ownerEmail: string
  ownerPhone: string
  cep: string
  address: string
  number: string
  neighborhood: string
  city: string
  state: string
  description: string
  builtArea: string
  startDate: string
  endDate: string
}

type TabButtonProps = {
  label: string
  active: boolean
  onClick: () => void
}

type FolderCardProps = {
  folder: FolderType
  editingFolderId: string | null
  editingName: string
  setEditingName: (value: string) => void
  setEditingFolderId: (value: string | null) => void
  onSave: () => void
  onDelete: () => void
  onOpen: () => void
}

type FileCardProps = {
  file: FileType
  onDelete: () => void
}

function pickString(
  ...values: unknown[]
) {
  const found = values.find(
    (value) =>
      typeof value === 'string' &&
      value.trim().length > 0
  )

  return typeof found === 'string'
    ? found
    : ''
}

function pickStringOrNumber(
  ...values: unknown[]
) {

  const found = values.find(
    (value) =>
      (typeof value === 'string' &&
        value.trim().length > 0) ||
      typeof value === 'number'
  )

  if (typeof found === 'number') {
    return String(found)
  }

  return typeof found === 'string'
    ? found
    : ''
}

function detectBase64Mime(
  base64: string
) {

  if (base64.startsWith('/9j/')) {
    return 'image/jpeg'
  }

  if (base64.startsWith('iVBORw0KGgo')) {
    return 'image/png'
  }

  if (base64.startsWith('R0lGOD')) {
    return 'image/gif'
  }

  if (base64.startsWith('UklGR')) {
    return 'image/webp'
  }

  return 'image/jpeg'
}

function normalizeProjectImage(
  raw: unknown
) {

  const imageValue = pickString(raw)

  if (!imageValue) {
    return ''
  }

  if (
    imageValue.startsWith('data:image') ||
    imageValue.startsWith('http')
  ) {
    return imageValue
  }

  const mime = detectBase64Mime(
    imageValue
  )

  return `data:${mime};base64,${imageValue}`
}

function normalizeProjectInfo(
  raw: unknown,
  fallbackId: string
): ProjectInfoType {

  const item =
    raw && typeof raw === 'object'
      ? raw as LooseObject
      : {}

  return {
    id: pickString(item.id) || fallbackId,
    name: pickString(item.nome, item.name),
    imageUrl: normalizeProjectImage(
      pickString(
        item.imagem,
        item.image,
        item.image_url,
        item.imageUrl,
        item.foto,
        item.thumbnail,
        item.capa,
        item.cover
      )
    ),
    category: pickString(
      item.categoria,
      item.category
    ),
    status: pickString(item.status),
    quantityUnits: pickStringOrNumber(
      item.quantidade_unidades,
      item.quantity_units,
      item.quantityUnits,
      item.unidades
    ),
    owner: pickString(
      item.proprietario,
      item.owner
    ),
    ownerEmail: pickString(
      item.proprietario_email,
      item.email_proprietario,
      item.ownerEmail,
      item.owner_email
    ),
    ownerPhone: pickString(
      item.proprietario_telefone,
      item.telefone_proprietario,
      item.ownerPhone,
      item.owner_phone
    ),
    cep: pickString(item.cep),
    address: pickString(
      item.endereco,
      item.address
    ),
    number: pickString(
      item.numero,
      item.number
    ),
    neighborhood: pickString(
      item.bairro,
      item.neighborhood
    ),
    city: pickString(
      item.cidade,
      item.city
    ),
    state: pickString(
      item.estado,
      item.state
    ),
    description: pickString(
      item.descricao,
      item.description
    ),
    builtArea: pickString(
      item.area_construida,
      item.built_area,
      item.builtArea
    ),
    startDate: pickString(
      item.data_inicio,
      item.start_date,
      item.startDate
    ),
    endDate: pickString(
      item.data_fim,
      item.end_date,
      item.endDate
    )
  }
}

function normalizeFolder(
  raw: unknown,
  fallbackName = 'Pasta sem nome'
): FolderType | null {

  if (!raw || typeof raw !== 'object') {
    return null
  }

  const item = raw as LooseObject

  const id = pickString(
    item.id,
    item.folder_id,
    (item.folder as LooseObject | undefined)?.id
  )

  if (!id) {
    return null
  }

  const parentIdCandidate = pickString(
    item.parent_id,
    item.parentId,
    (item.folder as LooseObject | undefined)?.parent_id
  )

  const name = pickString(
    item.name,
    item.folder_name,
    item.title,
    (item.folder as LooseObject | undefined)?.name
  ) || fallbackName

  return {
    id,
    name,
    parent_id: parentIdCandidate || null,
    isNew: Boolean(item.isNew)
  }
}

function normalizeFile(
  raw: unknown,
  fallbackName = 'Arquivo sem nome'
): FileType | null {

  if (!raw || typeof raw !== 'object') {
    return null
  }

  const item = raw as LooseObject

  const id = pickString(
    item.id,
    item.file_id
  )

  if (!id) {
    return null
  }

  const name = pickString(
    item.name,
    item.file_name,
    item.original_name
  ) || fallbackName

  const url = pickString(
    item.url,
    item.path,
    item.download_url
  )

  return {
    id,
    name,
    url,
    mime_type: pickString(
      item.mime_type,
      item.mimeType
    ) || undefined
  }
}

function parseProjectStages(
  raw: unknown
): StageRow[] {

  const root =
    raw && typeof raw === 'object'
      ? raw as LooseObject
      : {}

  const customDetailsSource =
    (Array.isArray(root.etapas_customizadas_detalhes)
      ? root.etapas_customizadas_detalhes
      : Array.isArray(root.custom_stages_details)
      ? root.custom_stages_details
      : []) as unknown[]

  const customNamesSource =
    (Array.isArray(root.etapas_customizadas)
      ? root.etapas_customizadas
      : Array.isArray(root.custom_stages)
      ? root.custom_stages
      : []) as unknown[]

  const customNameMap = new Map<string, string>()

  try {
    const stored = window.localStorage.getItem('canteiro-custom-stages')

    if (stored) {
      const parsed = JSON.parse(stored)

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (!item || typeof item !== 'object') {
            return
          }

          const value = item as LooseObject
          const id = pickString(value.id)
          const name = pickString(value.name)

          if (id && name) {
            customNameMap.set(id, name)
          }
        })
      }
    }
  } catch (error) {
    console.error(error)
  }

  const source =
    (Array.isArray(raw)
      ? raw
      : Array.isArray(root.stages)
      ? root.stages
      : Array.isArray(root.etapas)
      ? root.etapas
      : []) as unknown[]

  const detailedSource =
    (Array.isArray(root.project_stages)
      ? root.project_stages
      : Array.isArray(root.projeto_etapas)
      ? root.projeto_etapas
      : Array.isArray(root.stages_details)
      ? root.stages_details
      : Array.isArray(root.etapas_detalhes)
      ? root.etapas_detalhes
      : []) as unknown[]

  const stageDetailsById = new Map<string, LooseObject>()

  detailedSource.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return
    }

    const value = item as LooseObject
    const id = pickString(
      value.project_stage_id,
      value.projeto_etapa_id,
      value.projectStageId,
      value.id_projeto_etapa,
      (value.project_stage as LooseObject | undefined)?.id,
      (value.projeto_etapa as LooseObject | undefined)?.id,
      value.id,
      value.stage_id,
      (value.stage as LooseObject | undefined)?.id,
      value.etapaid,
      value.etapa_id
    )

    if (id) {
      stageDetailsById.set(id, value)
    }
  })

  const customDetailsAsStages = customDetailsSource
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...(item as LooseObject),
      customizada: true
    }))

  const customNamesAsStages = customNamesSource
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return {
          customizada: true,
          nome: String(item)
        }
      }

      if (item && typeof item === 'object') {
        return {
          ...(item as LooseObject),
          customizada: true
        }
      }

      return null
    })
    .filter(Boolean) as LooseObject[]

  const mergedSource = [
    ...source,
    ...customDetailsAsStages,
    ...customNamesAsStages
  ]

  const usedKeys = new Set<string>()

  return mergedSource
    .map((item, index) => {

      if (
        typeof item === 'string' ||
        typeof item === 'number'
      ) {
        const value = String(item)
        const detail = stageDetailsById.get(value)

        if (detail) {
          return {
            ...detail,
            id: value,
            stage_id: pickString(detail.stage_id) || value
          }
        }

        const isCustomFromId = value.startsWith('custom-stage:')

        const customName = customNameMap.get(value)

        return {
          id: value,
          name: customName || `Etapa ${value}`,
          kind: isCustomFromId ? 'Customizada' as const : 'Padrao' as const,
          order: index + 1,
          startDate: '-',
          endDate: '-',
          realizedStartDate: '-',
          realizedEndDate: '-',
          totalCost: '-'
        }
      }

      if (!item || typeof item !== 'object') {
        return null
      }

      const value = item as LooseObject

      const explicitId = pickString(
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

      const isCustom =
        Boolean(value.customizada) ||
        Boolean(value.custom)

      const startDateRaw = pickString(
        value.data_inicio_prevista,
        value.planned_start_date,
        value.data_inicio,
        value.start_date,
        value.inicio,
        (value.project_stage as LooseObject | undefined)?.data_inicio_prevista,
        (value.project_stage as LooseObject | undefined)?.planned_start_date,
        (value.project_stage as LooseObject | undefined)?.data_inicio,
        (value.project_stage as LooseObject | undefined)?.start_date,
        (value.projeto_etapa as LooseObject | undefined)?.data_inicio_prevista,
        (value.projeto_etapa as LooseObject | undefined)?.planned_start_date,
        (value.projeto_etapa as LooseObject | undefined)?.data_inicio,
        (value.projeto_etapa as LooseObject | undefined)?.start_date
      )

      const endDateRaw = pickString(
        value.data_fim_prevista,
        value.planned_end_date,
        value.data_fim,
        value.end_date,
        value.fim,
        (value.project_stage as LooseObject | undefined)?.data_fim_prevista,
        (value.project_stage as LooseObject | undefined)?.planned_end_date,
        (value.project_stage as LooseObject | undefined)?.data_fim,
        (value.project_stage as LooseObject | undefined)?.end_date,
        (value.projeto_etapa as LooseObject | undefined)?.data_fim_prevista,
        (value.projeto_etapa as LooseObject | undefined)?.planned_end_date,
        (value.projeto_etapa as LooseObject | undefined)?.data_fim,
        (value.projeto_etapa as LooseObject | undefined)?.end_date
      )

      const realizedStartDateRaw = pickString(
        value.data_inicio_real,
        value.real_start_date,
        (value.project_stage as LooseObject | undefined)?.data_inicio_real,
        (value.project_stage as LooseObject | undefined)?.real_start_date,
        (value.projeto_etapa as LooseObject | undefined)?.data_inicio_real,
        (value.projeto_etapa as LooseObject | undefined)?.real_start_date
      )

      const realizedEndDateRaw = pickString(
        value.data_fim_real,
        value.real_end_date,
        (value.project_stage as LooseObject | undefined)?.data_fim_real,
        (value.project_stage as LooseObject | undefined)?.real_end_date,
        (value.projeto_etapa as LooseObject | undefined)?.data_fim_real,
        (value.projeto_etapa as LooseObject | undefined)?.real_end_date
      )

      const orderRaw = pickStringOrNumber(
        value.ordem,
        value.order,
        (value.project_stage as LooseObject | undefined)?.ordem,
        (value.project_stage as LooseObject | undefined)?.order,
        (value.projeto_etapa as LooseObject | undefined)?.ordem,
        (value.projeto_etapa as LooseObject | undefined)?.order
      )

      const totalCostRaw = pickStringOrNumber(
        value.custo_total,
        value.total_cost,
        value.cost_total,
        value.total,
        value.total_da_etapa,
        value.total_etapa,
        value.total_stage,
        value.valor_total,
        (value.totals as LooseObject | undefined)?.total_da_etapa,
        (value.totals as LooseObject | undefined)?.total_etapa,
        (value.totals as LooseObject | undefined)?.total_stage,
        (value.totals as LooseObject | undefined)?.total,
        (value.totals as LooseObject | undefined)?.valor_total,
        (value.project_stage as LooseObject | undefined)?.custo_total,
        (value.project_stage as LooseObject | undefined)?.total_cost,
        (value.project_stage as LooseObject | undefined)?.total_da_etapa,
        (value.project_stage as LooseObject | undefined)?.total_etapa,
        (value.project_stage as LooseObject | undefined)?.valor_total,
        (value.projeto_etapa as LooseObject | undefined)?.custo_total,
        (value.projeto_etapa as LooseObject | undefined)?.total_cost,
        (value.projeto_etapa as LooseObject | undefined)?.total_da_etapa,
        (value.projeto_etapa as LooseObject | undefined)?.total_etapa,
        (value.projeto_etapa as LooseObject | undefined)?.valor_total
      )

      const resolvedName =
        name ||
        (explicitId
          ? customNameMap.get(explicitId) || ''
          : '')

      const normalizedId =
        explicitId || `custom-${index}`

      const dedupeKey = `${normalizedId}::${resolvedName || 'sem-nome'}`

      if (usedKeys.has(dedupeKey)) {
        return null
      }

      usedKeys.add(dedupeKey)

      const stageName =
        resolvedName ||
        (isCustom
          ? 'Etapa personalizada'
          : `Etapa ${normalizedId}`)

      const normalizedCost =
        typeof totalCostRaw === 'string'
          ? totalCostRaw
            .trim()
            .replace(/\s/g, '')
            .replace(/R\$/gi, '')
            .replace(/[^\d,.-]/g, '')
            .replace(/\.(?=\d{3}(\D|$))/g, '')
            .replace(',', '.')
          : String(totalCostRaw)

      const totalCostNumber = Number(normalizedCost)

      const totalCost =
        !Number.isNaN(totalCostNumber) && normalizedCost !== ''
          ? new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totalCostNumber)
          : '-'

      const parsedOrder = Number(orderRaw)
      const order =
        Number.isFinite(parsedOrder) && parsedOrder > 0
          ? parsedOrder
          : index + 1

      return {
        id: normalizedId,
        name: stageName,
        kind: isCustom ? 'Customizada' : 'Padrao',
        order,
        startDate: startDateRaw ? formatDate(startDateRaw) : '-',
        endDate: endDateRaw ? formatDate(endDateRaw) : '-',
        realizedStartDate: realizedStartDateRaw ? formatDate(realizedStartDateRaw) : '-',
        realizedEndDate: realizedEndDateRaw ? formatDate(realizedEndDateRaw) : '-',
        totalCost
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order) as StageRow[]
}

function formatDate(
  value: string
) {

  if (!value) {
    return '-'
  }

  const normalized = value.trim()

  const brMatch = normalized.match(/^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/)
  if (brMatch) {
    const day = Number(brMatch[1])
    const month = Number(brMatch[2])
    const year = Number(brMatch[3])

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    }
  }

  const isoDateMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1])
    const month = Number(isoDateMatch[2])
    const day = Number(isoDateMatch[3])

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    }
  }

  const parsed = new Date(normalized)

  if (Number.isNaN(parsed.getTime())) {
    return normalized
  }

  return parsed.toLocaleDateString('pt-BR')
}

function parseFlexibleDate(value: string): Date | null {
  if (!value || value === '-') {
    return null
  }

  const normalized = value.trim()

  const brMatch = normalized.match(/^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/)
  if (brMatch) {
    const day = Number(brMatch[1])
    const month = Number(brMatch[2])
    const year = Number(brMatch[3])

    if (!day || !month || !year) {
      return null
    }

    const parsed = new Date(year, month - 1, day)
    if (Number.isNaN(parsed.getTime())) {
      return null
    }

    parsed.setHours(0, 0, 0, 0)
    return parsed
  }

  const isoDateMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1])
    const month = Number(isoDateMatch[2])
    const day = Number(isoDateMatch[3])
    const parsed = new Date(year, month - 1, day)

    if (Number.isNaN(parsed.getTime())) {
      return null
    }

    parsed.setHours(0, 0, 0, 0)
    return parsed
  }

  const isoParsed = new Date(normalized)
  if (!Number.isNaN(isoParsed.getTime())) {
    isoParsed.setHours(0, 0, 0, 0)
    return isoParsed
  }

  return null
}

function toSearchableText(raw: unknown): string {
  try {
    return JSON.stringify(raw).toLowerCase()
  } catch (error) {
    console.error(error)
    return ''
  }
}

export default function ProjectViewPage() {

  const params = useParams<{ id: string }>()
  const router = useRouter()
  const projectId = params.id

  const [tab, setTab] = useState<
    'stages' |
    'dashboard' |
    'files' |
    'cronograma'
  >('stages')

  const [loadingProjectInfo, setLoadingProjectInfo] =
    useState(false)

  const [loadingProjectStages, setLoadingProjectStages] =
    useState(false)

  const [loadingFiles, setLoadingFiles] =
    useState(false)

  const [projectInfo, setProjectInfo] =
    useState<ProjectInfoType | null>(null)

  const [stageRows, setStageRows] =
    useState<StageRow[]>([])

  const [stageCostDescriptionFilter, setStageCostDescriptionFilter] =
    useState('')

  const [filteredStageRows, setFilteredStageRows] =
    useState<StageRow[]>([])

  const [filteringStageRowsByDescription, setFilteringStageRowsByDescription] =
    useState(false)

  const [folders, setFolders] =
    useState<FolderType[]>([])

  const [files, setFiles] =
    useState<FileType[]>([])

  const [currentFolder, setCurrentFolder] =
    useState<string | null>(null)

  const [folderPath, setFolderPath] =
    useState<FolderType[]>([])

  const [editingFolderId, setEditingFolderId] =
    useState<string | null>(null)

  const [editingName, setEditingName] =
    useState('')

  const [confirmDeleteFolder, setConfirmDeleteFolder] =
    useState<FolderType | null>(null)

  const [confirmDeleteFile, setConfirmDeleteFile] =
    useState<FileType | null>(null)

  const requestIdRef = useRef(0)
  const stageCostSearchCacheRef = useRef(new Map<string, string>())

  const projectAddress = useMemo(() => {

    if (!projectInfo) {
      return '-'
    }

    const parts = [
      projectInfo.address,
      projectInfo.number,
      projectInfo.neighborhood,
      projectInfo.city,
      projectInfo.state
    ].map((item) => item.trim()).filter(Boolean)

    return parts.length
      ? parts.join(', ')
      : '-'

  }, [projectInfo])

  const scheduleRows = useMemo(() => {
    return stageRows
      .map((stage) => {
        const plannedStartDate = parseFlexibleDate(stage.startDate)
        const plannedEndDate = parseFlexibleDate(stage.endDate)
        const realStartDate = parseFlexibleDate(stage.realizedStartDate)
        const realEndDate = parseFlexibleDate(stage.realizedEndDate)

        const hasPlannedRange = Boolean(plannedStartDate && plannedEndDate)
        const hasRealRange = Boolean(realStartDate && realEndDate)

        if (!hasPlannedRange && !hasRealRange) {
          return null
        }

        let normalizedPlannedStartDate: Date | null = null
        let normalizedPlannedEndDate: Date | null = null

        if (hasPlannedRange) {
          const safeStart = plannedStartDate! <= plannedEndDate!
            ? plannedStartDate!
            : plannedEndDate!

          const safeEnd = plannedEndDate! >= plannedStartDate!
            ? plannedEndDate!
            : plannedStartDate!

          normalizedPlannedStartDate = safeStart
          normalizedPlannedEndDate = safeEnd
        }

        let normalizedRealStartDate: Date | null = null
        let normalizedRealEndDate: Date | null = null

        if (hasRealRange) {
          const safeStart = realStartDate! <= realEndDate!
            ? realStartDate!
            : realEndDate!

          const safeEnd = realEndDate! >= realStartDate!
            ? realEndDate!
            : realStartDate!

          normalizedRealStartDate = safeStart
          normalizedRealEndDate = safeEnd
        }

        const plannedDurationDays = normalizedPlannedStartDate && normalizedPlannedEndDate
          ? Math.max(
            1,
            Math.ceil(
              (normalizedPlannedEndDate.getTime() - normalizedPlannedStartDate.getTime()) /
              (1000 * 60 * 60 * 24)
            )
          )
          : 0

        const realDurationDays = normalizedRealStartDate && normalizedRealEndDate
          ? Math.max(
            1,
            Math.ceil(
              (normalizedRealEndDate.getTime() - normalizedRealStartDate.getTime()) /
              (1000 * 60 * 60 * 24)
            )
          )
          : 0

        return {
          id: stage.id,
          name: stage.name,
          order: stage.order,
          kind: stage.kind,
          plannedStartDate: normalizedPlannedStartDate,
          plannedEndDate: normalizedPlannedEndDate,
          realStartDate: normalizedRealStartDate,
          realEndDate: normalizedRealEndDate,
          plannedDurationDays,
          realDurationDays
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order) as Array<{
      id: string
      name: string
      order: number
      kind: 'Padrao' | 'Customizada'
      plannedStartDate: Date | null
      plannedEndDate: Date | null
      realStartDate: Date | null
      realEndDate: Date | null
      plannedDurationDays: number
      realDurationDays: number
    }>
  }, [stageRows])

  useEffect(() => {
    stageCostSearchCacheRef.current.clear()
  }, [projectId])

  useEffect(() => {
    const searchTerm = stageCostDescriptionFilter.trim().toLowerCase()

    if (!searchTerm) {
      setFilteredStageRows(stageRows)
      setFilteringStageRowsByDescription(false)
      return
    }

    if (!projectId || stageRows.length === 0) {
      setFilteredStageRows([])
      setFilteringStageRowsByDescription(false)
      return
    }

    let cancelled = false

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setFilteringStageRowsByDescription(true)

        const rows = await Promise.all(
          stageRows.map(async (stage) => {
            const cached = stageCostSearchCacheRef.current.get(stage.id)

            if (typeof cached === 'string') {
              return cached.includes(searchTerm) ? stage : null
            }

            const encodedStageId = encodeURIComponent(stage.id)
            const itemsUrl = `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages/${encodedStageId}/items`
            const costsUrl = `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages/${encodedStageId}/costs`

            let searchableText = ''

            try {
              const itemsResponse = await fetch(itemsUrl)

              if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json()
                searchableText += ` ${toSearchableText(itemsData)}`
              }

              const costsResponse = await fetch(costsUrl)

              if (costsResponse.ok) {
                const costsData = await costsResponse.json()
                searchableText += ` ${toSearchableText(costsData)}`
              }
            } catch (error) {
              console.error(error)
            }

            const normalizedSearchableText = searchableText.toLowerCase()

            stageCostSearchCacheRef.current.set(
              stage.id,
              normalizedSearchableText
            )

            return normalizedSearchableText.includes(searchTerm)
              ? stage
              : null
          })
        )

        if (cancelled) {
          return
        }

        setFilteredStageRows(rows.filter(Boolean) as StageRow[])
        setFilteringStageRowsByDescription(false)
      })()
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [projectId, stageRows, stageCostDescriptionFilter])

  const scheduleRange = useMemo(() => {
    if (scheduleRows.length === 0) {
      return null
    }

    const starts = scheduleRows
      .flatMap((row) => [row.plannedStartDate, row.realStartDate])
      .filter(Boolean)
      .map((date) => (date as Date).getTime())

    const ends = scheduleRows
      .flatMap((row) => [row.plannedEndDate, row.realEndDate])
      .filter(Boolean)
      .map((date) => (date as Date).getTime())

    if (!starts.length || !ends.length) {
      return null
    }

    return {
      min: new Date(Math.min(...starts)),
      max: new Date(Math.max(...ends))
    }
  }, [scheduleRows])

  const scheduleTotalDays = useMemo(() => {
    if (!scheduleRange) {
      return 1
    }

    return Math.max(
      1,
      Math.ceil(
        (scheduleRange.max.getTime() - scheduleRange.min.getTime()) /
        (1000 * 60 * 60 * 24)
      )
    )
  }, [scheduleRange])

  function getScheduleBarPosition(
    startDate: Date,
    endDate: Date
  ) {

    if (!scheduleRange) {
      return { left: 0, width: 0 }
    }

    const taskStart = startDate.getTime() - scheduleRange.min.getTime()
    const taskDuration = Math.max(
      1,
      endDate.getTime() - startDate.getTime()
    )
    const totalDuration = Math.max(
      1,
      scheduleRange.max.getTime() - scheduleRange.min.getTime()
    )

    const left = (taskStart / totalDuration) * 100
    const width = (taskDuration / totalDuration) * 100

    return { left, width }
  }

  useEffect(() => {

    if (!projectId) {
      return
    }

    setCurrentFolder(null)
    setFolderPath([])
    loadProjectInfo()
    loadProjectStages()
    loadFolderContent(null, [])

  }, [projectId])

  async function loadProjectInfo() {

    if (!projectId) {
      return
    }

    try {

      setLoadingProjectInfo(true)

      let rawProject: unknown = null

      const detailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}`
      )

      if (detailResponse.ok) {
        rawProject = await detailResponse.json()
      } else {
        const listResponse = await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects`
        )

        if (!listResponse.ok) {
          throw new Error()
        }

        const listData = await listResponse.json()

        if (Array.isArray(listData)) {
          rawProject = listData.find(
            (item: unknown) =>
              String((item as LooseObject)?.id || '') === String(projectId)
          )
        }
      }

      setProjectInfo(
        normalizeProjectInfo(
          rawProject,
          String(projectId)
        )
      )

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao carregar detalhes da obra'
      )

    } finally {
      setLoadingProjectInfo(false)
    }
  }

  async function loadProjectStages() {

    if (!projectId) {
      return
    }

    try {

      setLoadingProjectStages(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      setStageRows(parseProjectStages(data))

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao carregar etapas da obra'
      )

    } finally {
      setLoadingProjectStages(false)
    }
  }

  async function loadFolderContent(
    folderId?: string | null,
    nextPath?: FolderType[]
  ) {

    const thisRequestId =
      ++requestIdRef.current

    try {

      setLoadingFiles(true)

      const query = new URLSearchParams({
        parent_id: folderId || ''
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/folders?${query.toString()}`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      if (
        thisRequestId !==
        requestIdRef.current
      ) {
        return
      }

      const safeFolders =
        (Array.isArray(data?.folders)
          ? data.folders
          : [])
          .map((raw) =>
            normalizeFolder(raw)
          )
          .filter(Boolean) as FolderType[]

      const safeFiles =
        (Array.isArray(data?.files)
          ? data.files
          : [])
          .map((raw) =>
            normalizeFile(raw)
          )
          .filter(Boolean) as FileType[]

      setFolders(safeFolders)
      setFiles(safeFiles)

      if (nextPath) {
        setFolderPath(nextPath)
      }

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao carregar arquivos'
      )

    } finally {

      if (
        thisRequestId ===
        requestIdRef.current
      ) {
        setLoadingFiles(false)
      }

    }
  }

  function handleCreateFolderInline() {

    const tempId = `temp-${Date.now()}`

    const newFolder: FolderType = {
      id: tempId,
      name: 'Nova pasta',
      parent_id: currentFolder,
      isNew: true
    }

    setFolders((prev) => [
      newFolder,
      ...prev
    ])

    setEditingFolderId(tempId)
    setEditingName('Nova pasta')
  }

  async function handleSaveFolder(
    folder: FolderType
  ) {

    if (!folder?.id) {
      toast.error('Pasta inválida')
      return
    }

    const normalizedEditingName =
      editingName.trim()

    if (!normalizedEditingName) {
      toast.error('Digite um nome')
      return
    }

    try {

      if (folder.isNew) {

        setFolders((prev) =>
          prev.map((f) =>
            f.id === folder.id
              ? {
                  ...f,
                  name: normalizedEditingName
                }
              : f
          )
        )

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/folders`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: normalizedEditingName,
              parent_id:
                currentFolder &&
                !currentFolder.startsWith('temp-')
                  ? currentFolder
                  : null
            })
          }
        )

        if (!response.ok) {
          throw new Error()
        }

        const result = await response.json()

        const createdFolder = normalizeFolder(
          result?.folder || result,
          normalizedEditingName
        )

        toast.success('Pasta criada')

        if (createdFolder) {
          setFolders((prev) =>
            prev.map((f) =>
              f.id === folder.id
                ? {
                    ...createdFolder,
                    isNew: false
                  }
                : f
            )
          )

          if (currentFolder) {
            setFolderPath((prev) =>
              prev.map((item) =>
                item.id === folder.id
                  ? createdFolder
                  : item
              )
            )
          }
        }

        loadFolderContent(
          currentFolder,
          folderPath
        )

      } else {

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/folders/${folder.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: normalizedEditingName
            })
          }
        )

        if (!response.ok) {
          throw new Error()
        }

        toast.success('Pasta renomeada')

        const updatedName =
          normalizedEditingName

        setFolders((prev) =>
          prev.map((f) =>
            f.id === folder.id
              ? {
                  ...f,
                  name: updatedName
                }
              : f
          )
        )

        setFolderPath((prev) =>
          prev.map((item) =>
            item.id === folder.id
              ? {
                  ...item,
                  name: updatedName
                }
              : item
          )
        )
      }

      setEditingFolderId(null)
      setEditingName('')

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao salvar pasta'
      )
    }
  }

  async function handleDeleteFolder() {

    if (!confirmDeleteFolder?.id) {
      return
    }

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/folders/${confirmDeleteFolder.id}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        throw new Error()
      }

      toast.success('Pasta removida')

      setFolderPath((prev) =>
        prev.filter(
          (item) =>
            item.id !== confirmDeleteFolder.id
        )
      )

      setConfirmDeleteFolder(null)

      loadFolderContent(currentFolder)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao excluir pasta'
      )
    }
  }

  async function handleUploadFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const file =
      event.target.files?.[0]

    if (!file) return

    try {

      const formData = new FormData()

      formData.append('file', file)

      if (
        currentFolder &&
        !currentFolder.startsWith('temp-')
      ) {
        formData.append(
          'folder_id',
          currentFolder
        )
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/files/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error()
      }

      toast.success('Arquivo enviado')

      loadFolderContent(currentFolder)

    } catch (error) {

      console.error(error)

      toast.error('Erro upload')
    }
  }

  async function handleDeleteFile() {

    if (!confirmDeleteFile?.id) {
      return
    }

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/files/${confirmDeleteFile.id}`,
        {
          method: 'DELETE'
        }
      )

      if (!response.ok) {
        throw new Error()
      }

      toast.success('Arquivo removido')

      setConfirmDeleteFile(null)

      loadFolderContent(currentFolder)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao excluir'
      )
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <main className="flex-1 overflow-y-auto">

        <div className="border-b border-white/10 bg-black/70 backdrop-blur-xl">

          <div className="px-6 lg:px-8 py-7">

            <div className="flex items-center justify-between flex-wrap gap-6">

              <div className="flex items-center gap-4">

                <Link
                  href="/projects"
                  className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.06] transition-all"
                >
                  <ArrowLeft size={20} />
                </Link>

                <div>

                  <h1 className="text-4xl font-bold">
                    Visualizar obra
                  </h1>

                  <p className="text-zinc-400 mt-1">
                    Detalhes gerais e acompanhamento
                  </p>

                </div>
              </div>

              {projectId && (
                <Link
                  href={`/projects/edit/${projectId}`}
                  className="h-11 px-5 rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06] transition-all flex items-center"
                >
                  Ir para edição
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 space-y-6">

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] overflow-hidden">

            {loadingProjectInfo ? (
              <div className="p-6 text-zinc-400 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin" />
                Carregando detalhes...
              </div>
            ) : (
              <>
                <div className="relative h-72 bg-black/40">
                  {projectInfo?.imageUrl ? (
                    <img
                      src={projectInfo.imageUrl}
                      alt={projectInfo.name || 'Imagem da obra'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-emerald-500/20 via-black to-black" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  <div className="absolute left-6 right-6 bottom-6 flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-bold">
                        {projectInfo?.name || 'Obra'}
                      </h2>

                      <div className="mt-2 flex items-center gap-2 text-zinc-200">
                        <MapPin size={16} />
                        <span>{projectAddress}</span>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                      {projectInfo?.status || 'Planejamento'}
                    </div>
                  </div>
                </div>

                <div className="p-6 lg:p-5">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 lg:p-5">
                    <div className="mb-3 flex items-center gap-2 text-zinc-300">
                      <MapPin size={15} className="text-emerald-400" />
                      <h3 className="text-base font-semibold">Resumo da obra</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <div className="space-y-1">
                        <SummaryRow label="Status" value={projectInfo?.status || '-'} />
                        <SummaryRow label="Proprietario" value={projectInfo?.owner || '-'} />
                        <SummaryRow label="CEP" value={projectInfo?.cep || '-'} />
                        <SummaryRow label="Endereco" value={projectInfo?.address || '-'} />
                        <SummaryRow label="Bairro" value={projectInfo?.neighborhood || '-'} />
                        <SummaryRow label="Cidade" value={projectInfo?.city || '-'} />
                        <SummaryRow label="M2 Construido" value={projectInfo?.builtArea || '-'} />
                        <SummaryRow label="Usuarios" value="-" />
                      </div>

                      <div className="space-y-1">
                        <SummaryRow label="Categoria" value={projectInfo?.category || '-'} />
                        <SummaryRow label="Telefone" value={projectInfo?.ownerPhone || '-'} />
                        <SummaryRow label="E-mail" value={projectInfo?.ownerEmail || '-'} />
                        <SummaryRow label="Numero" value={projectInfo?.number || '-'} />
                        <SummaryRow label="Estado" value={projectInfo?.state || '-'} />
                        <SummaryRow label="Qtd. unidades" value={projectInfo?.quantityUnits || '-'} />
                        <SummaryRow label="Data de inicio" value={formatDate(projectInfo?.startDate || '')} />
                        <SummaryRow label="Data de finalizacao" value={formatDate(projectInfo?.endDate || '')} />
                      </div>
                    </div>
                  </div>
                </div>

                {projectInfo?.description && (
                  <div className="px-6 pb-6">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs text-zinc-400 mb-2">Descricao</p>
                      <p className="text-zinc-200 whitespace-pre-wrap">{projectInfo.description}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">

            <TabButton
              active={tab === 'stages'}
              label="Etapas da obra"
              onClick={() => setTab('stages')}
            />

            <TabButton
              active={tab === 'dashboard'}
              label="Dashboard"
              onClick={() => setTab('dashboard')}
            />

            <TabButton
              active={tab === 'files'}
              label="Pasta da obra"
              onClick={() => setTab('files')}
            />

            <TabButton
              active={tab === 'cronograma'}
              label="Cronograma"
              onClick={() => setTab('cronograma')}
            />
          </div>

          {tab === 'stages' && (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] overflow-hidden">

              <div className="p-5 border-b border-white/10">
                <h3 className="text-2xl font-bold">
                  Etapas da obra
                </h3>

                <p className="text-zinc-400 text-sm mt-1">
                  Visualizacao em formato de tabela
                </p>

                <div className="mt-4">
                  <label className="block text-sm text-zinc-300 mb-2">
                    Filtrar por descricao de subitem (custo)
                  </label>

                  <input
                    value={stageCostDescriptionFilter}
                    onChange={(event) => setStageCostDescriptionFilter(event.target.value)}
                    placeholder="Ex.: cola branca, pipa, cimento"
                    className="h-11 w-full max-w-md rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                  />
                </div>
              </div>

              {loadingProjectStages ? (
                <div className="p-6 text-zinc-400 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin" />
                  Carregando etapas...
                </div>
              ) : stageRows.length === 0 ? (
                <div className="p-6 text-zinc-400">
                  Nenhuma etapa vinculada a esta obra.
                </div>
              ) : filteringStageRowsByDescription ? (
                <div className="p-6 text-zinc-400 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin" />
                  Filtrando etapas por descricao de subitem...
                </div>
              ) : filteredStageRows.length === 0 ? (
                <div className="p-6 text-zinc-400">
                  Nenhuma etapa encontrada para a descricao informada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="text-left text-zinc-400 border-b border-white/10 bg-black/40">
                        <th className="px-4 py-3 font-medium">Ordem</th>
                        <th className="px-4 py-3 font-medium">Etapa</th>
                        <th className="px-4 py-3 font-medium">Tipo</th>
                        <th className="px-4 py-3 font-medium">Data inicio</th>
                        <th className="px-4 py-3 font-medium">Data fim</th>
                        <th className="px-4 py-3 font-medium">Custo total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStageRows.map((stage) => {
                        const href = `/projects/view/${projectId}/stages/${encodeURIComponent(stage.id)}`

                        return (
                          <tr
                            key={`${stage.id}-${stage.order}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => router.push(href)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                router.push(href)
                              }
                            }}
                            className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-inset"
                          >
                            <td className="px-4 py-3">{stage.order}</td>
                            <td className="px-4 py-3 font-medium text-white">{stage.name}</td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  stage.kind === 'Customizada'
                                    ? 'inline-flex px-2 py-1 rounded-full text-xs border border-blue-500/30 bg-blue-500/10 text-blue-300'
                                    : 'inline-flex px-2 py-1 rounded-full text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                }
                              >
                                {stage.kind}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-300">{stage.startDate}</td>
                            <td className="px-4 py-3 text-zinc-300">{stage.endDate}</td>
                            <td className="px-4 py-3 text-zinc-200 font-medium">{stage.totalCost}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'dashboard' && (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 lg:p-6">
              <ProjectDashboardPanel
                fixedProjectId={String(projectId || '')}
                fixedProjectName={projectInfo?.name}
                embedded
              />
            </div>
          )}

          {tab === 'files' && (

            <div>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-8">

                <div>

                  <h2 className="text-3xl font-bold">
                    Pasta da obra
                  </h2>

                  <p className="text-zinc-400 mt-2">
                    Organize documentos da obra
                  </p>

                </div>

                <div className="flex items-center gap-3">

                  <button
                    onClick={
                      handleCreateFolderInline
                    }
                    className="h-12 px-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all flex items-center gap-3"
                  >
                    <FolderPlus size={18} />
                    Nova pasta
                  </button>

                  <label className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition-all text-black font-semibold flex items-center gap-3 cursor-pointer">

                    <Upload size={18} />

                    Upload arquivo

                    <input
                      type="file"
                      hidden
                      onChange={
                        handleUploadFile
                      }
                    />

                  </label>

                </div>
              </div>

              <div className="mb-6 flex items-center gap-2 flex-wrap text-sm text-zinc-400">

                <button
                  onClick={() => {
                    setCurrentFolder(null)
                    loadFolderContent(null, [])
                  }}
                  className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  <Home size={14} />
                  Raiz
                </button>

                {folderPath.length > 0 && (
                  <button
                    onClick={() => {
                      const nextPath =
                        folderPath.slice(0, -1)

                      const targetFolder =
                        nextPath.length > 0
                          ? nextPath[nextPath.length - 1].id
                          : null

                      setCurrentFolder(
                        targetFolder
                      )

                      loadFolderContent(
                        targetFolder,
                        nextPath
                      )
                    }}
                    className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-white/10 hover:bg-white/[0.04] transition-all"
                  >
                    <ArrowLeft size={14} />
                    Voltar
                  </button>
                )}

                {folderPath.map(
                  (folder, index) => {
                    const pathUntilHere =
                      folderPath.slice(
                        0,
                        index + 1
                      )

                    return (
                      <div
                        key={folder.id}
                        className="inline-flex items-center gap-2"
                      >
                        <ChevronRight
                          size={14}
                          className="text-zinc-600"
                        />

                        <button
                          onClick={() => {
                            setCurrentFolder(
                              folder.id
                            )

                            loadFolderContent(
                              folder.id,
                              pathUntilHere
                            )
                          }}
                          className="max-w-[180px] truncate px-2 h-8 rounded-lg hover:bg-white/[0.05] transition-all"
                        >
                          {folder.name}
                        </button>
                      </div>
                    )
                  }
                )}

              </div>

              {loadingFiles ? (

                <div className="flex items-center gap-3 text-zinc-400">

                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Carregando arquivos...

                </div>

              ) : (

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">

                  {folders
                    .filter(
                      (folder) =>
                        folder &&
                        folder.id
                    )
                    .map((folder) => (

                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        editingFolderId={
                          editingFolderId
                        }
                        editingName={
                          editingName
                        }
                        setEditingName={
                          setEditingName
                        }
                        setEditingFolderId={
                          setEditingFolderId
                        }
                        onSave={() =>
                          handleSaveFolder(
                            folder
                          )
                        }
                        onDelete={() =>
                          setConfirmDeleteFolder(
                            folder
                          )
                        }
                        onOpen={() => {

                          if (
                            !folder?.id
                          ) {
                            return
                          }

                          if (
                            folder.id.startsWith(
                              'temp-'
                            )
                          ) {
                            return
                          }

                          setCurrentFolder(
                            folder.id
                          )

                          const nextPath = [
                            ...folderPath,
                            {
                              id: folder.id,
                              name: folder.name,
                              parent_id:
                                currentFolder
                            }
                          ]

                          loadFolderContent(
                            folder.id,
                            nextPath
                          )
                        }}
                      />

                  ))}

                  {files
                    .filter(
                      (file) =>
                        file &&
                        file.id
                    )
                    .map((file) => (

                      <FileCard
                        key={file.id}
                        file={file}
                        onDelete={() =>
                          setConfirmDeleteFile(
                            file
                          )
                        }
                      />

                  ))}

                  {!folders.length &&
                    !files.length && (
                      <div className="col-span-full rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-zinc-400">
                        Esta pasta está vazia. Crie uma nova pasta ou faça upload de arquivo.
                      </div>
                    )}

                </div>

              )}

            </div>

          )}

          {tab === 'cronograma' && (
            <div className="space-y-8">
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/[0.03] to-white/[0.02] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-3xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-6">
                    <Folder size={30} className="text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Cronograma do projeto</h2>
                  <p className="text-zinc-400 max-w-3xl leading-relaxed">
                    Visualize as datas previstas e realizadas de cada etapa da obra em uma linha do tempo.
                  </p>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="px-8 py-6 border-b border-white/10">
                  <h3 className="text-2xl font-bold">Planejamento temporal</h3>
                  <p className="text-sm text-zinc-400 mt-2">Período: {scheduleTotalDays} dias</p>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-max p-8">
                    {scheduleRange ? (
                      <>
                        <div className="mb-8">
                          <div className="flex gap-2 mb-2">
                            <div className="w-80 flex-shrink-0"></div>
                            <div className="flex-1 flex gap-2">
                              {Array.from({ length: Math.ceil(scheduleTotalDays / 7) }).map((_, weekIdx) => {
                                const weekStart = new Date(
                                  scheduleRange.min.getTime() +
                                  weekIdx * 7 * 24 * 60 * 60 * 1000
                                )

                                return (
                                  <div
                                    key={weekIdx}
                                    className="text-xs text-zinc-400 text-center"
                                    style={{ width: `${(7 / scheduleTotalDays) * 100}%` }}
                                  >
                                    {weekStart.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <div className="w-80 flex-shrink-0"></div>
                            <div className="flex-1 relative h-6 bg-white/[0.03] rounded-xl overflow-hidden border border-white/10">
                              <div className="absolute inset-0 flex">
                                {Array.from({ length: scheduleTotalDays }).map((_, dayIdx) => (
                                  <div
                                    key={dayIdx}
                                    className="flex-1 border-r border-white/5 text-[8px] text-zinc-600 flex items-center justify-center"
                                  >
                                    {dayIdx % 7 === 0 ? dayIdx : ''}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {scheduleRows.map((row) => {
                            const plannedBarPosition =
                              row.plannedStartDate && row.plannedEndDate
                                ? getScheduleBarPosition(row.plannedStartDate, row.plannedEndDate)
                                : null

                            const realBarPosition =
                              row.realStartDate && row.realEndDate
                                ? getScheduleBarPosition(row.realStartDate, row.realEndDate)
                                : null

                            return (
                              <div key={row.id} className="flex gap-2 items-center">
                                <div className="w-80 flex-shrink-0 space-y-1">
                                  <p className="text-sm font-medium text-zinc-200">{row.name}</p>
                                  {row.plannedStartDate && row.plannedEndDate && (
                                    <p className="text-xs text-blue-300">
                                      Previsto: {row.plannedStartDate.toLocaleDateString('pt-BR')} - {row.plannedEndDate.toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                  {row.realStartDate && row.realEndDate && (
                                    <p className="text-xs text-emerald-300">
                                      Realizado: {row.realStartDate.toLocaleDateString('pt-BR')} - {row.realEndDate.toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>

                                <div className="flex-1 relative h-12 bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
                                  {plannedBarPosition && (
                                    <div
                                      className="absolute top-1 h-4 bg-gradient-to-r from-blue-500/40 to-blue-500/20 rounded-md border border-blue-400/50 flex items-center justify-center text-[10px] font-medium text-blue-200"
                                      style={{
                                        left: `${plannedBarPosition.left}%`,
                                        width: `${plannedBarPosition.width}%`
                                      }}
                                    >
                                      Prev {row.plannedDurationDays}d
                                    </div>
                                  )}

                                  {realBarPosition && (
                                    <div
                                      className="absolute bottom-1 h-4 bg-gradient-to-r from-emerald-500/40 to-emerald-500/20 rounded-md border border-emerald-400/50 flex items-center justify-center text-[10px] font-medium text-emerald-200"
                                      style={{
                                        left: `${realBarPosition.left}%`,
                                        width: `${realBarPosition.width}%`
                                      }}
                                    >
                                      Real {row.realDurationDays}d
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <Folder size={38} className="text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400">Preencha as datas previstas ou realizadas das etapas para montar o cronograma</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {confirmDeleteFolder && (
        <ModalWrapper>

          <ModalHeader
            title="Excluir pasta"
            description={`Deseja excluir a pasta "${confirmDeleteFolder.name}"?`}
            onClose={() =>
              setConfirmDeleteFolder(null)
            }
          />

          <div className="flex justify-end gap-3">

            <ModalCancelButton
              onClick={() =>
                setConfirmDeleteFolder(null)
              }
            />

            <button
              onClick={handleDeleteFolder}
              className="
                h-11
                px-5
                rounded-2xl
                bg-red-500
                hover:bg-red-400
                transition-all
                font-semibold
                text-white
              "
            >
              Excluir pasta
            </button>
          </div>

        </ModalWrapper>
      )}

      {confirmDeleteFile && (
        <ModalWrapper>

          <ModalHeader
            title="Excluir arquivo"
            description={`Deseja excluir o arquivo "${confirmDeleteFile.name}"?`}
            onClose={() =>
              setConfirmDeleteFile(null)
            }
          />

          <div className="flex justify-end gap-3">

            <ModalCancelButton
              onClick={() =>
                setConfirmDeleteFile(null)
              }
            />

            <button
              onClick={handleDeleteFile}
              className="
                h-11
                px-5
                rounded-2xl
                bg-red-500
                hover:bg-red-400
                transition-all
                font-semibold
                text-white
              "
            >
              Excluir arquivo
            </button>
          </div>

        </ModalWrapper>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value
}: {
  label: string
  value: string
}) {

  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-white/5 py-1.5 text-sm">
      <p className="text-zinc-400 font-semibold">{label}:</p>
      <p className="text-zinc-200 break-words">{value || '-'}</p>
    </div>
  )
}

function FolderCard({
  folder,
  editingFolderId,
  editingName,
  setEditingName,
  setEditingFolderId,
  onSave,
  onDelete,
  onOpen
}: FolderCardProps) {

  const inputRef =
    useRef<HTMLInputElement>(null)

  useEffect(() => {

    if (
      editingFolderId === folder?.id
    ) {

      const timeout = setTimeout(() => {

        inputRef.current?.focus()
        inputRef.current?.select()

      }, 50)

      return () => clearTimeout(timeout)
    }

  }, [editingFolderId, folder?.id])

  if (!folder || !folder.id) {
    return null
  }

  const isEditing =
    editingFolderId === folder.id

  return (

    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-emerald-500/20 transition-all group">

      <div
        onClick={() => {

          if (isEditing) {
            return
          }

          onOpen()
        }}
        className="w-full p-6 text-left hover:bg-white/[0.02] transition-all cursor-pointer"
      >

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">

          <Folder size={34} />

        </div>

        {isEditing ? (

          <input
            ref={inputRef}
            value={editingName}
            onChange={(e) =>
              setEditingName(
                e.target.value
              )
            }
            onClick={(e) =>
              e.stopPropagation()
            }
            onKeyDown={(e) => {

              e.stopPropagation()

              if (e.key === 'Enter') {
                onSave()
              }

              if (e.key === 'Escape') {

                setEditingFolderId(null)

                setEditingName('')
              }
            }}
            onBlur={() => {

              if (
                editingName.trim()
              ) {
                onSave()
              } else {
                setEditingFolderId(null)
              }
            }}
            className="bg-transparent border border-emerald-500/20 rounded-xl px-3 h-10 outline-none w-full"
          />

        ) : (

          <h3
            onDoubleClick={(e) => {

              e.stopPropagation()

              setEditingFolderId(
                folder.id
              )

              setEditingName(
                folder.name
              )
            }}
            className="font-semibold truncate cursor-text"
          >
            {folder.name}
          </h3>

        )}

      </div>

      <div className="border-t border-white/10 px-4 h-14 flex items-center justify-between">

        <button
          onClick={(e) => {

            e.stopPropagation()

            setEditingFolderId(
              folder.id
            )

            setEditingName(
              folder.name
            )
          }}
          className="text-zinc-500 hover:text-white transition-all"
        >
          <MoreVertical size={16} />
        </button>

        <button
          onClick={(e) => {

            e.stopPropagation()

            onDelete()
          }}
          className="text-red-400 hover:text-red-300 transition-all"
        >
          <Trash2 size={16} />
        </button>

      </div>

    </div>
  )
}

function FileCard({
  file,
  onDelete
}: FileCardProps) {

  if (!file || !file.id) {
    return null
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-blue-500/20 transition-all">

      <div className="p-6">

        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">

          {file.mime_type?.includes(
            'image'
          )
            ? <ImageIcon size={34} />
            : <FileText size={34} />
          }

        </div>

        <h3 className="font-semibold truncate">
          {file.name}
        </h3>

      </div>

      <div className="border-t border-white/10 px-4 h-14 flex items-center justify-between">

        <a
          href={file.url}
          target="_blank"
          className="text-emerald-400 hover:text-emerald-300 transition-all"
        >
          <Download size={16} />
        </a>

        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 transition-all"
        >
          <Trash2 size={16} />
        </button>

      </div>
    </div>
  )
}

function ModalWrapper({
  children
}: any) {

  return (
    <div
      className="
        fixed
        inset-0
        bg-black/70
        backdrop-blur-sm
        z-50
        flex
        items-center
        justify-center
        p-6
      "
    >

      <div
        className="
          w-full
          max-w-md
          rounded-[28px]
          border
          border-white/10
          bg-zinc-950
          p-6
        "
      >
        {children}
      </div>
    </div>
  )
}

function ModalHeader({
  title,
  description,
  onClose
}: any) {

  return (
    <div className="flex items-start justify-between mb-6">

      <div>

        <h2 className="text-2xl font-bold mb-2">
          {title}
        </h2>

        <p className="text-zinc-400 text-sm">
          {description}
        </p>
      </div>

      <button
        onClick={onClose}
        className="
          w-9
          h-9
          rounded-xl
          border
          border-white/10
          flex
          items-center
          justify-center
        "
      >
        <X size={16} />
      </button>
    </div>
  )
}

function ModalCancelButton({
  onClick
}: any) {

  return (
    <button
      onClick={onClick}
      className="
        h-11
        px-5
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
      "
    >
      Cancelar
    </button>
  )
}

function TabButton({
  label,
  active,
  onClick
}: TabButtonProps) {

  return (
    <button
      onClick={onClick}
      className={`
        h-12
        px-5
        rounded-2xl
        border
        transition-all
        ${
          active
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05]'
        }
      `}
    >
      {label}
    </button>
  )
}
