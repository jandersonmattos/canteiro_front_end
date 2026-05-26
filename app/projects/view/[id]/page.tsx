'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'

import {
  useEffect,
  useMemo,
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
  Calendar
} from 'lucide-react'

type LooseObject = Record<string, unknown>

type StageRow = {
  id: string
  name: string
  kind: 'Padrao' | 'Customizada'
  order: number
  startDate: string
  endDate: string
  totalCost: string
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

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('pt-BR')
}

export default function ProjectViewPage() {

  const params = useParams<{ id: string }>()
  const router = useRouter()
  const projectId = params.id

  const [tab, setTab] = useState<
    'stages' |
    'dashboard'
  >('stages')

  const [loadingProjectInfo, setLoadingProjectInfo] =
    useState(false)

  const [loadingProjectStages, setLoadingProjectStages] =
    useState(false)

  const [projectInfo, setProjectInfo] =
    useState<ProjectInfoType | null>(null)

  const [stageRows, setStageRows] =
    useState<StageRow[]>([])

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

  useEffect(() => {

    if (!projectId) {
      return
    }

    loadProjectInfo()
    loadProjectStages()

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
                      {stageRows.map((stage) => {
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

        </div>
      </main>
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
