'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import {
  useState,
  useEffect
} from 'react'

import Sidebar from '../../../components/Sidebar'
import ProjectStageSelector, {
  isCustomStageId
} from '../../../components/ProjectStageSelector'

import {
  ArrowLeft,
  Home,
  Building,
  Warehouse,
  Users,
  Mail,
  Phone,
  Ruler,
  ChevronRight,
  Check,
  Loader2
} from 'lucide-react'

type Stage = {
  id: string
  name: string
}

type StateType = {
  id: number
  sigla: string
  nome: string
}

type CityType = {
  id: number
  nome: string
}

type LooseObject = Record<string, unknown>

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

function normalizeStage(
  raw: unknown
): Stage | null {

  if (!raw || typeof raw !== 'object') {
    return null
  }

  const item = raw as LooseObject

  const id = pickString(
    item.id,
    item.stage_id,
    (item.stage as LooseObject | undefined)?.id
  )

  if (!id) {
    return null
  }

  const name = pickString(
    item.name,
    item.nome,
    item.stage_name,
    (item.stage as LooseObject | undefined)?.name,
    (item.stage as LooseObject | undefined)?.nome
  ) || `Etapa ${id}`

  return {
    id,
    name
  }
}

function getSelectedCustomStagesFromStorage(
  selectedStageIds: string[]
) {

  const selectedCustomIds =
    selectedStageIds.filter(
      (stageId) =>
        isCustomStageId(stageId)
    )

  if (!selectedCustomIds.length) {
    return [] as Array<{
      id: string
      name: string
    }>
  }

  try {

    const rawStoredStages =
      window.localStorage.getItem(
        'canteiro-custom-stages'
      )

    if (!rawStoredStages) {
      return []
    }

    const parsed = JSON.parse(
      rawStoredStages
    )

    if (!Array.isArray(parsed)) {
      return []
    }

    const selectedSet = new Set(
      selectedCustomIds
    )

    return parsed
      .map((item) => {

        if (
          !item ||
          typeof item !== 'object'
        ) {
          return null
        }

        const value =
          item as Record<string, unknown>

        const id = pickString(value.id)
        const name = pickString(value.name)

        if (!id || !name) {
          return null
        }

        if (!selectedSet.has(id)) {
          return null
        }

        return { id, name }
      })
      .filter(Boolean) as Array<{
      id: string
      name: string
    }>

  } catch (error) {
    console.error(error)
    return []
  }
}

export default function NewProjectPage() {

  const [step, setStep] = useState(1)

  const [projectId, setProjectId] = useState<string | null>(null)

  const [selectedStages, setSelectedStages] =
    useState<string[]>([])

  const [loadingCep, setLoadingCep] =
    useState(false)

  const [loadingStates, setLoadingStates] =
    useState(false)

  const [loadingCities, setLoadingCities] =
    useState(false)

  const [loadingStages, setLoadingStages] =
    useState(false)

  const [saving, setSaving] =
    useState(false)

  const [stages, setStages] = useState<
    Stage[]
  >([])

  const [states, setStates] = useState<
    StateType[]
  >([])

  const [cities, setCities] = useState<
    CityType[]
  >([])

  const persistedSelectedStages =
    selectedStages.filter(
      (stageId) =>
        !isCustomStageId(stageId)
    )

  const [form, setForm] = useState({
    name: '',
    category: 'Residencial',
    status: 'Planejamento',
    quantityUnits: '',
    address: '',
    city: '',
    owner: '',
    ownerEmail: '',
    ownerPhone: '',
    cep: '',
    number: '',
    neighborhood: '',
    state: '',
    description: '',
    builtArea: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    loadStates()
    loadStages()
  }, [])

  useEffect(() => {
    if (form.state) {
      loadCities(form.state)
    } else {
      setCities([])
    }
  }, [form.state])

  async function loadStages() {

    try {

      setLoadingStages(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/stages`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      const formatted =
        (Array.isArray(data)
          ? data
          : [])
          .map((stage) =>
            normalizeStage(stage)
          )
          .filter(Boolean) as Stage[]

      setStages(formatted)

    } catch (error) {
      console.error(error)
    } finally {
      setLoadingStages(false)
    }
  }

  async function loadStates() {

    try {

      setLoadingStates(true)

      const response = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
      )

      const data = await response.json()

      setStates(data)

    } catch (error) {
      console.error(error)
    } finally {
      setLoadingStates(false)
    }
  }

  async function loadCities(uf: string) {

    try {

      setLoadingCities(true)

      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      )

      const data = await response.json()

      setCities(data)

    } catch (error) {
      console.error(error)
    } finally {
      setLoadingCities(false)
    }
  }

  async function handleCepChange(
    value: string
  ) {

    const cep = value.replace(/\D/g, '')

    const maskedCep = cep
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)

    setForm((prev) => ({
      ...prev,
      cep: maskedCep
    }))

    if (cep.length !== 8) return

    try {

      setLoadingCep(true)

      const response = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      )

      const data = await response.json()

      if (data.erro) return

      setForm((prev) => ({
        ...prev,
        cep: maskedCep,
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }))

      setTimeout(() => {
        document
          .getElementById('number')
          ?.focus()
      }, 100)

    } catch (error) {
      console.error(error)
    } finally {
      setLoadingCep(false)
    }
  }

  async function handleSaveStages() {

    if (!projectId) {
      toast.error('Projeto não encontrado')
      return
    }

    try {

      setSaving(true)

      const customStages =
        getSelectedCustomStagesFromStorage(
          selectedStages
        )

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            etapas: persistedSelectedStages,
            etapas_customizadas: customStages.map(
              (stage) => stage.name
            ),
            etapas_customizadas_detalhes: customStages
          })
        }
      )

      if (!response.ok) {
        throw new Error(
          'Erro ao salvar etapas'
        )
      }

      toast.success(
        'Obra criada com sucesso'
      )

      window.location.href = '/projects'

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao salvar etapas'
      )

    } finally {
      setSaving(false)
    }
  }

  async function handleCreateProject() {

    try {

      setSaving(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            nome: form.name,
            categoria: form.category,
            status: form.status,
            quantidade_unidades: Number(
              form.quantityUnits || 0
            ),

            data_inicio:
              form.startDate || null,

            data_fim:
              form.endDate || null,

            proprietario: form.owner,

            email_proprietario:
              form.ownerEmail,

            telefone_proprietario:
              form.ownerPhone,

            cep: form.cep,

            endereco: form.address,

            numero: form.number,

            bairro: form.neighborhood,

            cidade: form.city,

            estado: form.state,

            descricao: form.description,

            area_construida: Number(
              form.builtArea || 0
            )
          })
        }
      )

      if (!response.ok) {
        throw new Error(
          'Erro ao criar obra'
        )
      }

      const data = await response.json()

      setProjectId(String(data.id))

      toast.success(
        'Informações salvas com sucesso'
      )

      setStep(2)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao salvar informações'
      )

    } finally {

      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <main className="flex-1 overflow-x-hidden overflow-y-auto">

        {/* HEADER */}
        <div
          className="
            border-b
            border-white/10
            bg-black/70
            backdrop-blur-xl
          "
        >
          <div className="px-6 lg:px-8 py-7">

            <div
              className="
                w-full
                flex
                flex-col
                xl:flex-row
                xl:items-center
                xl:justify-between
                gap-6
              "
            >

              <div className="flex items-center gap-4">

                <Link
                  href="/projects"
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
                  <ArrowLeft size={20} />
                </Link>

                <div>

                  <h1 className="text-3xl lg:text-4xl font-bold">
                    Nova Obra
                  </h1>

                  <p className="text-zinc-400 mt-1">
                    Cadastro inteligente de obras
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">

                <StepItem
                  active={step === 1}
                  done={step > 1}
                  label="Informações"
                />

                <ChevronRight
                  className="text-zinc-600"
                  size={18}
                />

                <StepItem
                  active={step === 2}
                  done={false}
                  label="Etapas"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 lg:p-8">

          <div className="w-full">

            {/* STEP 1 */}
            {step === 1 && (

              <div
                className="
                  rounded-[32px]
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-6 lg:p-7
                "
              >

                <div className="mb-8">

                  <h2 className="text-2xl font-bold mb-2">
                    Informações da obra
                  </h2>

                  <p className="text-zinc-400">
                    Preencha os dados principais da obra
                  </p>
                </div>

                {/* CATEGORY */}
                <div className="mb-8">

                  <label className="text-sm text-zinc-400 block mb-4">
                    Categoria da obra
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <CategoryCard
                      active={
                        form.category ===
                        'Residencial'
                      }
                      title="Residencial"
                      icon={<Home size={22} />}
                      onClick={() =>
                        setForm({
                          ...form,
                          category:
                            'Residencial'
                        })
                      }
                    />

                    <CategoryCard
                      active={
                        form.category ===
                        'Comercial'
                      }
                      title="Comercial"
                      icon={
                        <Building size={22} />
                      }
                      onClick={() =>
                        setForm({
                          ...form,
                          category:
                            'Comercial'
                        })
                      }
                    />

                    <CategoryCard
                      active={
                        form.category ===
                        'Industrial'
                      }
                      title="Industrial"
                      icon={
                        <Warehouse size={22} />
                      }
                      onClick={() =>
                        setForm({
                          ...form,
                          category:
                            'Industrial'
                        })
                      }
                    />
                  </div>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                  <div className="md:col-span-2">

                    <Input
                      label="Nome da obra"
                      value={form.name}
                      onChange={(e: any) =>
                        setForm({
                          ...form,
                          name:
                            e.target.value
                        })
                      }
                    />
                  </div>

                  <Input
                    label="M² Construído"
                    icon={<Ruler size={15} />}
                    type="number"
                    value={form.builtArea}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        builtArea:
                          e.target.value
                      })
                    }
                  />

                  <Input
                    label="Quantidade de unidades"
                    type="number"
                    value={form.quantityUnits}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        quantityUnits:
                          e.target.value
                      })
                    }
                  />

                  <DateField
                    label="Data de início"
                    value={form.startDate}
                    onChange={(date: Date | null) =>
                      setForm({
                        ...form,
                        startDate: date
                          ? date.toISOString().split('T')[0]
                          : ''
                      })
                    }
                  />

                  <DateField
                    label="Data de finalização"
                    value={form.endDate}
                    onChange={(date: Date | null) =>
                      setForm({
                        ...form,
                        endDate: date
                          ? date.toISOString().split('T')[0]
                          : ''
                      })
                    }
                  />

                  <Input
                    label="Proprietário"
                    icon={<Users size={15} />}
                    value={form.owner}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        owner:
                          e.target.value
                      })
                    }
                  />

                  <Input
                    label="Email"
                    icon={<Mail size={15} />}
                    value={form.ownerEmail}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        ownerEmail:
                          e.target.value
                      })
                    }
                  />

                  <Input
                    label="Telefone"
                    icon={<Phone size={15} />}
                    value={form.ownerPhone}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        ownerPhone:
                          e.target.value
                      })
                    }
                  />

                  <div className="relative">

                    <Input
                      label="CEP"
                      value={form.cep}
                      onChange={(e: any) =>
                        handleCepChange(
                          e.target.value
                        )
                      }
                    />

                    {loadingCep && (
                      <div
                        className="
                          absolute
                          right-4
                          top-[38px]
                          text-xs
                          text-emerald-400
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <Loader2
                          size={12}
                          className="animate-spin"
                        />

                        Buscando...
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">

                    <Input
                      label="Endereço"
                      value={form.address}
                      onChange={(e: any) =>
                        setForm({
                          ...form,
                          address:
                            e.target.value
                        })
                      }
                    />
                  </div>

                  <Input
                    id="number"
                    label="Número"
                    value={form.number}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        number:
                          e.target.value
                      })
                    }
                  />

                  <Input
                    label="Bairro"
                    value={
                      form.neighborhood
                    }
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        neighborhood:
                          e.target.value
                      })
                    }
                  />

                  <Select
                    label="Estado"
                    value={form.state}
                    loading={
                      loadingStates
                    }
                    options={states.map(
                      (state) => ({
                        label: `${state.nome} (${state.sigla})`,
                        value:
                          state.sigla
                      })
                    )}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        state:
                          e.target.value,
                        city: ''
                      })
                    }
                  />

                  <Select
                    label="Cidade"
                    value={form.city}
                    loading={
                      loadingCities
                    }
                    disabled={!form.state}
                    options={cities.map(
                      (city) => ({
                        label: city.nome,
                        value:
                          city.nome
                      })
                    )}
                    onChange={(e: any) =>
                      setForm({
                        ...form,
                        city:
                          e.target.value
                      })
                    }
                  />

                  <div className="xl:col-span-4">

                    <TextArea
                      label="Descrição"
                      value={
                        form.description
                      }
                      onChange={(e: any) =>
                        setForm({
                          ...form,
                          description:
                            e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-8">

                  <button
                    onClick={handleCreateProject}
                    disabled={saving}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-2xl
                      bg-emerald-500
                      hover:bg-emerald-400
                      transition-all
                      px-6
                      py-3
                      font-semibold
                      text-black
                    "
                  >
                    {saving && (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    )}

                    {saving
                      ? 'Salvando...'
                      : 'Salvar e continuar'}

                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (

              <div>
                <ProjectStageSelector
                  title="Etapas da obra"
                  description="Monte a obra em duas colunas: escolha na biblioteca, confira ao lado o que ja entrou e inclua etapas personalizadas quando precisar."
                  stages={stages}
                  selectedStageIds={selectedStages}
                  onSelectedStageIdsChange={setSelectedStages}
                  loading={loadingStages}
                  footer={
                    <div className="mt-12 flex justify-between">

                      <button
                        onClick={() =>
                          setStep(1)
                        }
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-4 font-semibold transition-all hover:bg-white/[0.06]"
                      >
                        Voltar
                      </button>

                      <button
                        onClick={
                          handleSaveStages
                        }
                        disabled={saving}
                        className="flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 font-semibold text-black transition-all hover:bg-emerald-400 disabled:opacity-50"
                      >

                        {saving && (
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                        )}

                        {saving
                          ? 'Criando obra...'
                          : 'Criar obra'}
                      </button>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StepItem({
  label,
  active,
  done
}: any) {

  return (
    <div
      className={`
        flex
        items-center
        gap-3
        rounded-2xl
        px-5
        py-3
        border

        ${
          active
            ? `
              border-emerald-500/30
              bg-emerald-500/10
              text-emerald-400
            `
            : `
              border-white/10
              bg-white/[0.03]
              text-zinc-400
            `
        }
      `}
    >

      <div
        className={`
          w-6
          h-6
          rounded-full
          flex
          items-center
          justify-center
          text-xs

          ${
            done || active
              ? 'bg-emerald-500 text-black'
              : 'bg-white/10'
          }
        `}
      >
        {done ? (
          <Check size={14} />
        ) : null}
      </div>

      <span className="font-medium">
        {label}
      </span>
    </div>
  )
}

function CategoryCard({
  title,
  icon,
  active,
  onClick
}: any) {

  return (
    <button
      onClick={onClick}
      className={`
        rounded-[24px]
        border
        p-5
        text-left
        transition-all

        ${
          active
            ? `
              border-emerald-500/30
              bg-emerald-500/10
            `
            : `
              border-white/10
              bg-white/[0.03]
              hover:bg-white/[0.05]
            `
        }
      `}
    >

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
          text-emerald-400
          mb-4
        "
      >
        {icon}
      </div>

      <h3 className="text-base font-bold">
        {title}
      </h3>
    </button>
  )
}

function Input({
  label,
  value,
  onChange,
  icon,
  type = 'text',
  id
}: any) {

  function handleOpenDatePicker(
    e: any
  ) {

    if (type !== 'date') return

    const input =
      e.currentTarget.querySelector('input')

    if (!input) return

    input.focus()

    // Chrome/Edge
    if (input.showPicker) {
      input.showPicker()
    }
  }

  return (
    <div>

      <label className="text-sm text-zinc-400 mb-2 block">
        {label}
      </label>

      <div
        onClick={handleOpenDatePicker}
        className={`
          flex
          items-center
          gap-3
          h-12
          px-4
          rounded-2xl
          border
          border-white/10
          bg-white/[0.03]
          focus-within:border-emerald-500
          hover:border-white/20
          transition-all

          ${
            type === 'date'
              ? 'cursor-pointer'
              : ''
          }
        `}
      >

        {icon && (
          <div className="text-zinc-500">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={(e: any) => {

            if (
              type === 'date' &&
              e.target.showPicker
            ) {
              e.target.showPicker()
            }
          }}
          className={`
            w-full
            bg-transparent
            outline-none
            text-white
            placeholder:text-zinc-500

            ${
              type === 'date'
                ? 'cursor-pointer'
                : ''
            }
          `}
        />
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  loading
}: any) {

  return (
    <div>

      <label className="text-sm text-zinc-400 mb-2 block">
        {label}
      </label>

      <div className="relative">

        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="
            w-full
            h-12
            px-4
            rounded-2xl
            border
            border-white/10
            bg-white/[0.03]
            outline-none
            text-white
            focus:border-emerald-500
            transition-all
            appearance-none
            disabled:opacity-50
          "
        >

          <option
            value=""
            className="bg-black"
          >
            Selecione
          </option>

          {options.map((option: any) => (

            <option
              key={option.value}
              value={option.value}
              className="bg-black"
            >
              {option.label}
            </option>
          ))}
        </select>

        {loading && (
          <Loader2
            size={16}
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              animate-spin
              text-emerald-400
            "
          />
        )}
      </div>
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange
}: any) {

  return (
    <div>

      <label className="text-sm text-zinc-400 mb-2 block">
        {label}
      </label>

      <textarea
        value={value}
        onChange={onChange}
        rows={4}
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-white/[0.03]
          p-4
          outline-none
          text-white
          resize-none
          focus:border-emerald-500
          transition-all
        "
      />
    </div>
  )
}

function DateField({
  label,
  value,
  onChange
}: any) {

  return (
    <div className="w-full">

      <label className="text-sm text-zinc-400 mb-2 block">
        {label}
      </label>

      <DatePicker
        selected={
          value
            ? new Date(value)
            : null
        }
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        placeholderText="Selecione uma data"

        wrapperClassName="w-full"

        className="
          w-full
          h-12
          px-4
          rounded-2xl
          border
          border-white/10
          bg-white/[0.03]
          text-white
          outline-none
          focus:border-emerald-500
          transition-all
        "

        calendarClassName="
          !bg-zinc-950
          !border
          !border-white/10
          !rounded-2xl
          !p-3
          !shadow-2xl
        "

        dayClassName={() =>
          `
          hover:!bg-emerald-500
          hover:!text-black
          !rounded-xl
        `
        }

        popperClassName="z-50"
      />
    </div>
  )
}