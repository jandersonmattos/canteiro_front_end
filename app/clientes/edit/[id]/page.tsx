'use client'

import Link from 'next/link'

import {
  useEffect,
  useState
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
  User,
  Building2,
  Loader2
} from 'lucide-react'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

type StateType = {
  id: number
  sigla: string
  nome: string
}

type CityType = {
  id: number
  nome: string
}

export default function EditClientPage() {

  const router = useRouter()

  const params = useParams()

  const clientId = params.id as string

  const [saving, setSaving] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [loadingCep, setLoadingCep] =
    useState(false)

  const [loadingStates, setLoadingStates] =
    useState(false)

  const [loadingCities, setLoadingCities] =
    useState(false)

  const [states, setStates] =
    useState<StateType[]>([])

  const [cities, setCities] =
    useState<CityType[]>([])

  const [tipoPessoa, setTipoPessoa] =
    useState<'PF' | 'PJ'>('PF')

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    rg: '',

    razao_social: '',
    cnpj: '',

    email: '',
    telefone: '',

    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'PR',
    pais: 'Brasil'
  })

  // ============================================
  // LOAD STATES
  // ============================================

  useEffect(() => {

    loadStates()

  }, [])

  // ============================================
  // LOAD CITIES
  // ============================================

  useEffect(() => {

    if (form.estado) {

      loadCities(form.estado)

    } else {

      setCities([])
    }

  }, [form.estado])

  // ============================================
  // LOAD CLIENT
  // ============================================

  useEffect(() => {

    async function loadClient() {

      try {

        setLoading(true)

        const response = await fetch(
          `${API_URL}/clients/${clientId}`
        )

        if (!response.ok) {
          throw new Error()
        }

        const client = await response.json()

        setTipoPessoa(client.tipo)

        setForm({
          nome: client.nome || '',
          cpf: client.cpf || '',
          rg: client.rg || '',

          razao_social:
            client.razao_social || '',

          cnpj: client.cnpj || '',

          email: client.email || '',

          telefone:
            client.telefone || '',

          cep: client.cep || '',

          logradouro:
            client.logradouro ||
            client.endereco ||
            '',

          numero:
            client.numero || '',

          complemento:
            client.complemento || '',

          bairro:
            client.bairro || '',

          cidade:
            client.cidade || '',

          estado:
            client.estado || 'PR',

          pais:
            client.pais || 'Brasil'
        })

      } catch (error) {

        console.error(error)

        toast.error(
          'Erro ao carregar cliente'
        )

      } finally {

        setLoading(false)
      }
    }

    if (clientId) {
      loadClient()
    }

  }, [clientId])

  // ============================================
  // LOAD STATES
  // ============================================

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

      toast.error(
        'Erro ao carregar estados'
      )

    } finally {

      setLoadingStates(false)
    }
  }

  // ============================================
  // LOAD CITIES
  // ============================================

  async function loadCities(
    uf: string
  ) {

    try {

      setLoadingCities(true)

      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      )

      const data = await response.json()

      setCities(data)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao carregar cidades'
      )

    } finally {

      setLoadingCities(false)
    }
  }

  // ============================================
  // CEP
  // ============================================

  async function handleCepChange(
    value: string
  ) {

    const cep = value.replace(
      /\D/g,
      ''
    )

    const maskedCep = cep
      .replace(
        /^(\d{5})(\d)/,
        '$1-$2'
      )
      .slice(0, 9)

    setForm(prev => ({
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

      if (data.erro) {

        toast.error(
          'CEP não encontrado'
        )

        return
      }

      setForm(prev => ({
        ...prev,
        cep: maskedCep,

        logradouro:
          data.logradouro || '',

        bairro:
          data.bairro || '',

        cidade:
          data.localidade || '',

        estado:
          data.uf || ''
      }))

      setTimeout(() => {

        document
          .getElementById(
            'numero'
          )
          ?.focus()

      }, 100)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao buscar CEP'
      )

    } finally {

      setLoadingCep(false)
    }
  }

  // ============================================
  // UPDATE FIELD
  // ============================================

  function updateField(
    field: string,
    value: string
  ) {

    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // ============================================
  // SAVE
  // ============================================

  async function handleSave() {

    try {

      setSaving(true)

      const payload = {
        tipo: tipoPessoa,

        nome: form.nome,

        cpf: form.cpf,

        rg: form.rg,

        razao_social:
          form.razao_social,

        cnpj: form.cnpj,

        email: form.email,

        telefone:
          form.telefone,

        cep: form.cep,

        endereco:
          form.logradouro,

        numero:
          form.numero,

        complemento:
          form.complemento,

        bairro:
          form.bairro,

        cidade:
          form.cidade,

        estado:
          form.estado,

        pais:
          form.pais
      }

      const response = await fetch(
        `${API_URL}/clients/${clientId}`,
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

        const errorData =
          await response.json()

        throw new Error(
          errorData.detail ||
          'Erro ao atualizar cliente'
        )
      }

      toast.success(
        'Cliente atualizado com sucesso'
      )

      router.push('/clientes')

    } catch (error: any) {

      console.error(error)

      toast.error(
        error.message ||
        'Erro ao salvar cliente'
      )

    } finally {

      setSaving(false)
    }
  }

  // ============================================
  // LOADING
  // ============================================

  if (loading) {

    return (
      <div className="min-h-screen bg-black text-white flex">

        <Sidebar />

        <main className="flex-1 flex items-center justify-center">

          <div className="text-zinc-400">
            Carregando cliente...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex">

      <Sidebar />

      <main className="flex-1 overflow-auto">

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

              <div className="flex items-center gap-5">

                <Link
                  href="/clientes"
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

                  <h1 className="text-4xl font-bold mb-2">
                    Editar cliente
                  </h1>

                  <p className="text-zinc-400">
                    Edite as informações do cliente
                  </p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
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

                {saving
                  ? 'Salvando...'
                  : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-8">

          {/* DADOS */}
          <div
            className="
              rounded-[28px]
              border
              border-white/10
              bg-white/[0.03]
              p-6
            "
          >

            <div className="mb-8">

              <h2 className="text-2xl font-bold mb-2">
                Dados do cliente
              </h2>

              <p className="text-zinc-400 text-sm">
                Informações principais
              </p>
            </div>

            {/* TIPO */}
            <div className="mb-8">

              <label
                className="
                  block
                  text-sm
                  text-zinc-400
                  mb-3
                "
              >
                Tipo de pessoa
              </label>

              <div
                className="
                  inline-flex
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/40
                  p-1
                "
              >

                <button
                  type="button"
                  onClick={() =>
                    setTipoPessoa('PF')
                  }
                  className={`
                    h-12
                    px-6
                    rounded-xl
                    font-semibold
                    flex
                    items-center
                    gap-3
                    transition-all
                    ${
                      tipoPessoa === 'PF'
                        ? `
                          bg-emerald-500
                          text-black
                        `
                        : `
                          text-zinc-400
                          hover:bg-white/5
                        `
                    }
                  `}
                >

                  <User size={18} />

                  Pessoa Física
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTipoPessoa('PJ')
                  }
                  className={`
                    h-12
                    px-6
                    rounded-xl
                    font-semibold
                    flex
                    items-center
                    gap-3
                    transition-all
                    ${
                      tipoPessoa === 'PJ'
                        ? `
                          bg-emerald-500
                          text-black
                        `
                        : `
                          text-zinc-400
                          hover:bg-white/5
                        `
                    }
                  `}
                >

                  <Building2 size={18} />

                  Pessoa Jurídica
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {tipoPessoa === 'PF' && (
                <>
                  <Input
                    label="Nome *"
                    value={form.nome}
                    onChange={(v: string) =>
                      updateField(
                        'nome',
                        v
                      )
                    }
                    placeholder="Digite o nome"
                  />

                  <Input
                    label="CPF"
                    value={form.cpf}
                    onChange={(v: string) =>
                      updateField(
                        'cpf',
                        v
                      )
                    }
                    placeholder="000.000.000-00"
                  />

                  <Input
                    label="RG"
                    value={form.rg}
                    onChange={(v: string) =>
                      updateField(
                        'rg',
                        v
                      )
                    }
                    placeholder="00.000.000-0"
                  />
                </>
              )}

              {tipoPessoa === 'PJ' && (
                <>
                  <Input
                    label="Razão Social *"
                    value={
                      form.razao_social
                    }
                    onChange={(v: string) =>
                      updateField(
                        'razao_social',
                        v
                      )
                    }
                    placeholder="Razão social"
                  />

                  <Input
                    label="Nome fantasia"
                    value={
                      form.nome
                    }
                    onChange={(v: string) =>
                      updateField(
                        'nome',
                        v
                      )
                    }
                    placeholder="Nome fantasia"
                  />

                  <Input
                    label="CNPJ"
                    value={form.cnpj}
                    onChange={(v: string) =>
                      updateField(
                        'cnpj',
                        v
                      )
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </>
              )}

              <Input
                label="Email"
                value={form.email}
                onChange={(v: string) =>
                  updateField(
                    'email',
                    v
                  )
                }
                placeholder="email@email.com"
              />

              <Input
                label="Telefone"
                value={form.telefone}
                onChange={(v: string) =>
                  updateField(
                    'telefone',
                    v
                  )
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* ENDEREÇO */}
          <div
            className="
              rounded-[28px]
              border
              border-white/10
              bg-white/[0.03]
              p-6
            "
          >

            <div className="mb-8">

              <h2 className="text-2xl font-bold mb-2">
                Endereço
              </h2>

              <p className="text-zinc-400 text-sm">
                Informações de endereço
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

              <div className="relative">

                <Input
                  label="CEP"
                  value={form.cep}
                  onChange={(v: string) =>
                    handleCepChange(v)
                  }
                  placeholder="00000-000"
                />

                {loadingCep && (
                  <div
                    className="
                      absolute
                      right-4
                      top-[42px]
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

              <div className="xl:col-span-2">

                <Input
                  label="Logradouro"
                  value={
                    form.logradouro
                  }
                  onChange={(v: string) =>
                    updateField(
                      'logradouro',
                      v
                    )
                  }
                  placeholder="Rua..."
                />
              </div>

              <Input
                id="numero"
                label="Número"
                value={form.numero}
                onChange={(v: string) =>
                  updateField(
                    'numero',
                    v
                  )
                }
                placeholder="123"
              />

              <Input
                label="Complemento"
                value={
                  form.complemento
                }
                onChange={(v: string) =>
                  updateField(
                    'complemento',
                    v
                  )
                }
                placeholder="Apartamento..."
              />

              <Input
                label="Bairro"
                value={form.bairro}
                onChange={(v: string) =>
                  updateField(
                    'bairro',
                    v
                  )
                }
                placeholder="Centro"
              />

              <Select
                label="Estado"
                value={form.estado}
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
                    estado:
                      e.target.value,
                    cidade: ''
                  })
                }
              />

              <Select
                label="Cidade"
                value={form.cidade}
                loading={
                  loadingCities
                }
                disabled={
                  !form.estado
                }
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
                    cidade:
                      e.target.value
                  })
                }
              />

              <Input
                label="País"
                value={form.pais}
                onChange={(v: string) =>
                  updateField(
                    'pais',
                    v
                  )
                }
                placeholder="Brasil"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Input({
  label,
  placeholder,
  value,
  onChange,
  id
}: any) {

  return (
    <div>

      <label
        className="
          block
          text-sm
          text-zinc-400
          mb-2
        "
      >
        {label}
      </label>

      <input
        id={id}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={placeholder}
        className="
          w-full
          h-14
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

      <label
        className="
          block
          text-sm
          text-zinc-400
          mb-2
        "
      >
        {label}
      </label>

      <div className="relative">

        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="
            w-full
            h-14
            px-4
            rounded-2xl
            border
            border-white/10
            bg-black/40
            outline-none
            text-white
            appearance-none
            focus:border-emerald-500/40
            disabled:opacity-50
          "
        >

          <option
            value=""
            className="bg-black"
          >
            Selecione
          </option>

          {options.map(
            (option: any) => (

              <option
                key={option.value}
                value={option.value}
                className="bg-black"
              >
                {option.label}
              </option>
            )
          )}
        </select>

        {loading && (
          <Loader2
            size={16}
            className="
              absolute
              right-4
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