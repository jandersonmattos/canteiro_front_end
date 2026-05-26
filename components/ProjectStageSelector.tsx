'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  ArrowDown,
  ArrowUp,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from 'lucide-react'

export const CUSTOM_STAGE_PREFIX =
  'custom-stage:'

const CUSTOM_STAGE_STORAGE_KEY =
  'canteiro-custom-stages'

export type StageOption = {
  id: string
  name: string
  isCustom?: boolean
}

type ProjectStageSelectorProps = {
  title: string
  description: string
  stages: StageOption[]
  selectedStageIds: string[]
  onSelectedStageIdsChange: (
    ids: string[]
  ) => void
  loading?: boolean
  saving?: boolean
  saveLabel?: string
  onSave?: () => void
  footer?: React.ReactNode
}

type DraftStageForm = {
  name: string
}

function normalizeStoredStages(
  raw: unknown
) {

  if (!Array.isArray(raw)) {
    return [] as StageOption[]
  }

  return raw
    .map((item) => {

      if (!item || typeof item !== 'object') {
        return null
      }

      const value = item as Record<string, unknown>

      const id =
        typeof value.id === 'string'
          ? value.id
          : ''

      const name =
        typeof value.name === 'string'
          ? value.name.trim()
          : ''

      if (!id || !name) {
        return null
      }

      return {
        id,
        name,
        isCustom: true
      }
    })
    .filter(Boolean) as StageOption[]
}

function inferCustomStageNameFromId(
  stageId: string
) {

  if (!isCustomStageId(stageId)) {
    return 'Etapa personalizada'
  }

  const apiPrefix =
    `${CUSTOM_STAGE_PREFIX}api-`

  if (!stageId.startsWith(apiPrefix)) {
    return 'Etapa personalizada'
  }

  const withoutPrefix =
    stageId.slice(apiPrefix.length)

  const lastDashIndex =
    withoutPrefix.lastIndexOf('-')

  const slugPart =
    lastDashIndex > 0
      ? withoutPrefix.slice(0, lastDashIndex)
      : withoutPrefix

  if (!slugPart) {
    return 'Etapa personalizada'
  }

  return slugPart
    .split('-')
    .filter(Boolean)
    .map(
      (chunk) =>
        chunk.charAt(0).toUpperCase() +
        chunk.slice(1)
    )
    .join(' ')
}

function makeCustomStageId(
  value: string
) {

  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${CUSTOM_STAGE_PREFIX}${slug || 'etapa'}-${Date.now()}`
}

export function isCustomStageId(
  stageId: string
) {
  return stageId.startsWith(
    CUSTOM_STAGE_PREFIX
  )
}

export default function ProjectStageSelector({
  title,
  description,
  stages,
  selectedStageIds,
  onSelectedStageIdsChange,
  loading,
  saving,
  saveLabel = 'Salvar etapas',
  onSave,
  footer
}: ProjectStageSelectorProps) {

  const [search, setSearch] =
    useState('')

  const [customStages, setCustomStages] =
    useState<StageOption[]>([])

  const [customStageModalOpen, setCustomStageModalOpen] =
    useState(false)

  const [draftStage, setDraftStage] =
    useState<DraftStageForm>({
      name: ''
    })

  useEffect(() => {

    try {

      const storedValue =
        window.localStorage.getItem(
          CUSTOM_STAGE_STORAGE_KEY
        )

      if (!storedValue) {
        return
      }

      setCustomStages(
        normalizeStoredStages(
          JSON.parse(storedValue)
        )
      )

    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {

    try {

      const storedValue =
        window.localStorage.getItem(
          CUSTOM_STAGE_STORAGE_KEY
        )

      if (!storedValue) {
        return
      }

      const normalizedStored =
        normalizeStoredStages(
          JSON.parse(storedValue)
        )

      if (!normalizedStored.length) {
        return
      }

      setCustomStages((current) => {
        const merged = new Map<
          string,
          StageOption
        >()

        current.forEach((item) => {
          merged.set(item.id, item)
        })

        normalizedStored.forEach((item) => {
          merged.set(item.id, item)
        })

        return Array.from(merged.values())
      })

    } catch (error) {
      console.error(error)
    }
  }, [selectedStageIds])

  useEffect(() => {

    try {
      window.localStorage.setItem(
        CUSTOM_STAGE_STORAGE_KEY,
        JSON.stringify(customStages)
      )
    } catch (error) {
      console.error(error)
    }
  }, [customStages])

  const allStages = useMemo(() => {

    const stageMap = new Map<
      string,
      StageOption
    >()

    stages.forEach((stage) => {
      stageMap.set(stage.id, stage)
    })

    customStages.forEach((stage) => {
      stageMap.set(stage.id, stage)
    })

    return Array.from(stageMap.values())
  }, [stages, customStages])

  const filteredStages = useMemo(() => {

    const normalizedSearch =
      search
        .trim()
        .toLowerCase()

    if (!normalizedSearch) {
      return allStages
    }

    return allStages.filter((stage) =>
      stage.name
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [allStages, search])

  const selectedStages = useMemo(() => {
    const stageMap = new Map(
      allStages.map((stage) => [
        stage.id,
        stage
      ])
    )

    return selectedStageIds.map(
      (stageId) =>
        stageMap.get(stageId) || {
          id: stageId,
          name: inferCustomStageNameFromId(
            stageId
          ),
          isCustom:
            isCustomStageId(stageId)
        }
    )
  }, [allStages, selectedStageIds])

  function toggleStage(
    stageId: string
  ) {

    onSelectedStageIdsChange(
      selectedStageIds.includes(stageId)
        ? selectedStageIds.filter(
            (currentId) =>
              currentId !== stageId
          )
        : [
            ...selectedStageIds,
            stageId
          ]
    )
  }

  function handleSelectAll() {
    onSelectedStageIdsChange(
      allStages.map((stage) => stage.id)
    )
  }

  function handleClearAll() {
    onSelectedStageIdsChange([])
  }

  function moveSelectedStage(
    stageId: string,
    direction: 'up' | 'down'
  ) {

    const currentIndex =
      selectedStageIds.indexOf(stageId)

    if (currentIndex === -1) {
      return
    }

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1

    if (
      targetIndex < 0 ||
      targetIndex >=
        selectedStageIds.length
    ) {
      return
    }

    const reorderedIds = [
      ...selectedStageIds
    ]

    const [movedStageId] =
      reorderedIds.splice(currentIndex, 1)

    reorderedIds.splice(
      targetIndex,
      0,
      movedStageId
    )

    onSelectedStageIdsChange(
      reorderedIds
    )
  }

  function handleCreateCustomStage() {

    const normalizedName =
      draftStage.name.trim()

    if (!normalizedName) {
      return
    }

    const existingStage =
      allStages.find(
        (stage) =>
          stage.name.toLowerCase() ===
          normalizedName.toLowerCase()
      )

    if (existingStage) {
      toggleStage(existingStage.id)
      setDraftStage({ name: '' })
      setCustomStageModalOpen(false)
      return
    }

    const createdStage: StageOption = {
      id: makeCustomStageId(
        normalizedName
      ),
      name: normalizedName,
      isCustom: true
    }

    setCustomStages((prev) => [
      createdStage,
      ...prev
    ])

    onSelectedStageIdsChange([
      ...selectedStageIds,
      createdStage.id
    ])

    setDraftStage({ name: '' })
    setCustomStageModalOpen(false)
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

        <div>

          <h2 className="text-3xl font-bold">
            {title}
          </h2>

          <p className="mt-2 text-zinc-400 max-w-2xl">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">

          <button
            type="button"
            onClick={handleSelectAll}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm transition-all hover:bg-white/[0.06]"
          >
            Selecionar tudo
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            disabled={!selectedStageIds.length}
            className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm text-zinc-300 transition-all hover:bg-white/[0.06] disabled:opacity-40"
          >
            Remover todas
          </button>

          <div className="flex h-12 min-w-[170px] items-center justify-center whitespace-nowrap rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 font-semibold text-emerald-400">
            {selectedStageIds.length} selecionadas
          </div>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-500 px-5 font-semibold text-black transition-all hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}
              {saveLabel}
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5 lg:p-6">

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="text-xl font-semibold">
                Biblioteca de etapas
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Pesquise etapas prontas ou crie uma personalizada.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setCustomStageModalOpen(
                  true
                )
              }
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 font-medium text-emerald-300 transition-all hover:bg-emerald-500/20"
            >
              <Sparkles size={16} />
              Criar etapa personalizada
            </button>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 h-14">
            <Search
              size={18}
              className="text-zinc-500"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar etapa"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">

            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-zinc-400">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Carregando etapas...
              </div>
            ) : filteredStages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-5 text-zinc-400">
                Nenhuma etapa encontrada para a busca.
              </div>
            ) : (
              filteredStages.map((stage) => {

                const selected =
                  selectedStageIds.includes(
                    stage.id
                  )

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() =>
                      toggleStage(stage.id)
                    }
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                      selected
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
                    }`}
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                          selected
                            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                            : 'border-white/10 bg-white/[0.03] text-zinc-300'
                        }`}>
                          <Building2 size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className={`truncate text-sm font-semibold ${
                            selected
                              ? 'text-emerald-300'
                              : 'text-zinc-100'
                          }`}>
                            {stage.name}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {stage.isCustom
                              ? 'Etapa personalizada'
                              : 'Etapa da biblioteca'}
                          </p>
                        </div>
                      </div>

                      {selected ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          <CheckCircle2 size={14} />
                          Adicionada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-300">
                          <Plus size={14} />
                          Adicionar
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/[0.05] p-5 lg:p-6">

          <div className="mb-5 flex items-start justify-between gap-4">

            <div>
              <h3 className="text-xl font-semibold text-emerald-200">
                Etapas da obra
              </h3>
              <p className="mt-1 text-sm text-emerald-100/70">
                Organize o que já faz parte desta obra.
              </p>
            </div>

            <div className="rounded-full border border-emerald-500/20 bg-black/20 px-3 py-1 text-xs font-medium text-emerald-300">
              {selectedStages.length} itens
            </div>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">

            {selectedStages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-500/20 bg-black/20 px-5 py-10 text-center text-sm text-zinc-400">
                Nenhuma etapa adicionada ainda. Escolha uma etapa da biblioteca ou crie uma personalizada.
              </div>
            ) : (
              selectedStages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="rounded-2xl border border-emerald-500/20 bg-black/25 px-4 py-4"
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                        <span className="text-xs font-semibold">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-100">
                          {stage.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {stage.isCustom
                            ? 'Personalizada'
                            : 'Biblioteca padrão'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          moveSelectedStage(
                            stage.id,
                            'up'
                          )
                        }
                        disabled={index === 0}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveSelectedStage(
                            stage.id,
                            'down'
                          )
                        }
                        disabled={
                          index ===
                          selectedStages.length - 1
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleStage(stage.id)
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {footer}

      {customStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-zinc-950 p-6">

            <div className="mb-6 flex items-start justify-between gap-4">

              <div>
                <h3 className="text-2xl font-bold">
                  Nova etapa personalizada
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCustomStageModalOpen(false)
                  setDraftStage({ name: '' })
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-zinc-400">
                  Nome da etapa
                </label>
                <input
                  value={draftStage.name}
                  onChange={(event) =>
                    setDraftStage({
                      name: event.target.value
                    })
                  }
                  placeholder="Ex.: Entrega técnica"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 outline-none transition-all focus:border-emerald-500/40"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCustomStageModalOpen(false)
                  setDraftStage({ name: '' })
                }}
                className="h-11 rounded-2xl border border-white/10 bg-white/[0.03] px-5"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCreateCustomStage}
                disabled={!draftStage.name.trim()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-500 px-5 font-semibold text-black transition-all hover:bg-emerald-400 disabled:opacity-50"
              >
                <Plus size={16} />
                Criar etapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}