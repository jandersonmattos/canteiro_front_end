'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'

import {
  Wallet,
  TrendingUp,
  Landmark,
  Building2,
  BarChart3,
  ChevronDown,
  Loader2
} from 'lucide-react'

type Project = {
  id: string
  name: string
}

type Cost = {
  category: string
  stage: string
  description: string
  paid: number
}

type DashboardData = {
  total_paid: number
  units: number
  costs: Cost[]
}

type ProjectDashboardPanelProps = {
  fixedProjectId?: string
  fixedProjectName?: string
  embedded?: boolean
}

const CHART_COLORS = [
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#F97316',
  '#84CC16',
  '#14B8A6'
]

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)

export default function ProjectDashboardPanel({
  fixedProjectId,
  fixedProjectName,
  embedded = false
}: ProjectDashboardPanelProps) {

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)

  const activeProjectId = fixedProjectId || selectedProjectId
  const showProjectSelector = !fixedProjectId

  useEffect(() => {

    if (!showProjectSelector) {
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/dashboard/projects`)
      .then((response) => response.json())
      .then((result) => {

        const normalizedProjects =
          (Array.isArray(result) ? result : [])
            .map((project) => ({
              id: String(project?.id || ''),
              name: String(project?.name || project?.nome || '')
            }))
            .filter((project) => project.id && project.name)

        setProjects(normalizedProjects)

        if (normalizedProjects.length > 0) {
          setSelectedProjectId(normalizedProjects[0].id)
        }
      })
      .catch(() => {
        setProjects([])
      })

  }, [showProjectSelector])

  useEffect(() => {

    if (!activeProjectId) {
      setData(null)
      return
    }

    setLoading(true)

    fetch(`${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/dashboard/project/${activeProjectId}`)
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false))

  }, [activeProjectId])

  const kpis = useMemo(() => {

    if (!data) {
      return null
    }

    const totalPaid = data.total_paid || 0
    const profit = totalPaid * 0.3
    const totalSale = totalPaid + profit

    return {
      totalPaid,
      profit,
      totalSale,
      costPerUnit:
        totalPaid / (data.units || 1),
      salePerUnit:
        totalSale / (data.units || 1)
    }

  }, [data])

  const byCategory = useMemo(() => {

    if (!data) {
      return []
    }

    const map = new Map<string, number>()

    data.costs.forEach((cost) => {
      map.set(
        cost.category,
        (map.get(cost.category) || 0) + cost.paid
      )
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((first, second) => second.value - first.value)

  }, [data])

  const byStage = useMemo(() => {

    if (!data) {
      return []
    }

    const map = new Map<string, number>()

    data.costs.forEach((cost) => {
      map.set(
        cost.stage,
        (map.get(cost.stage) || 0) + cost.paid
      )
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((first, second) => second.value - first.value)

  }, [data])

  const headerTitle = embedded
    ? 'Dashboard da obra'
    : 'Dashboard'

  const headerDescription = fixedProjectId
    ? fixedProjectName
      ? `Indicadores financeiros e operacionais de ${fixedProjectName}`
      : 'Indicadores financeiros e operacionais desta obra'
    : 'Indicadores financeiros e operacionais da obra'

  return (
    <div className="space-y-8">

      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className={embedded ? 'text-3xl font-bold' : 'text-5xl font-bold tracking-tight'}>
            {headerTitle}
          </h2>

          <p className={embedded ? 'mt-2 text-zinc-400' : 'mt-3 text-lg text-zinc-400'}>
            {headerDescription}
          </p>
        </div>

        {showProjectSelector && (
          <div className="w-full xl:w-[340px]">
            <label className="mb-3 block text-sm text-zinc-400">
              Filtrar obra
            </label>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="absolute left-5 top-1/2 -translate-y-1/2">
                <Building2
                  size={18}
                  className="text-emerald-400"
                />
              </div>

              <select
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(event.target.value)
                }
                className="h-14 w-full appearance-none bg-transparent pl-14 pr-12 text-white outline-none"
              >
                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    className="bg-zinc-950 text-white"
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Carregando dashboard...
        </div>
      )}

      {!loading && !activeProjectId && (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-zinc-400">
          Nenhuma obra disponivel para o dashboard.
        </div>
      )}

      {!loading && activeProjectId && !kpis && (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 text-zinc-400">
          Nenhum dado encontrado para esta obra.
        </div>
      )}

      {kpis && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              title="Total Pago"
              value={currency(kpis.totalPaid)}
              icon={<Wallet size={22} />}
            />

            <KpiCard
              title="Lucro Previsto"
              value={currency(kpis.profit)}
              icon={<TrendingUp size={22} />}
            />

            <KpiCard
              title="Venda Total"
              value={currency(kpis.totalSale)}
              icon={<Landmark size={22} />}
            />

            <KpiCard
              title="Custo por Unidade"
              value={currency(kpis.costPerUnit)}
              icon={<Building2 size={22} />}
            />

            <KpiCard
              title="Venda por Unidade"
              value={currency(kpis.salePerUnit)}
              icon={<BarChart3 size={22} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              title="Custos por Categoria"
              subtitle="Distribuição financeira da obra"
              data={byCategory}
            />

            <ChartCard
              title="Custos por Etapa"
              subtitle="Distribuição financeira por etapa"
              data={byStage}
            />
          </div>
        </>
      )}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  data
}: {
  title: string
  subtitle: string
  data: Array<{ name: string; value: number }>
}) {

  return (
    <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">
          {title}
        </h2>

        <p className="mt-2 text-zinc-400">
          {subtitle}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={90}
            outerRadius={140}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={
                  CHART_COLORS[
                    index % CHART_COLORS.length
                  ]
                }
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value: number) =>
              currency(value)
            }
            contentStyle={{
              background: '#111',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 18,
              color: '#fff'
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  background:
                    CHART_COLORS[
                      index % CHART_COLORS.length
                    ]
                }}
              />

              <span className="text-sm text-zinc-300">
                {item.name}
              </span>
            </div>

            <span className="text-sm font-semibold">
              {currency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon
}: {
  title: string
  value: string
  icon: React.ReactNode
}) {

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-emerald-500/10 to-black p-6 backdrop-blur-xl">
      <div className="absolute right-0 top-0 h-40 w-40 bg-emerald-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="mb-4 text-sm text-zinc-400">
            {title}
          </p>

          <h3 className="text-4xl font-bold tracking-tight">
            {value}
          </h3>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          {icon}
        </div>
      </div>
    </div>
  )
}