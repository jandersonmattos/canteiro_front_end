'use client'

import Link from 'next/link'

import {
  useEffect,
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
  Star,
  X,
  Loader2
} from 'lucide-react'

type StateType = {
  id: number
  sigla: string
  nome: string
}

type CityType = {
  id: number
  nome: string
}

export default function NewSupplierPage() {

  const router = useRouter()

  const [saving, setSaving] =
    useState(false)

  const [loadingCep, setLoadingCep] =
    useState(false)

  const [loadingStates, setLoadingStates] =
    useState(false)

  const [loadingCities, setLoadingCities] =
    useState(false)

  const [tipos, setTipos] =
    useState<any[]>([])

  const [states, setStates] =
    useState<StateType[]>([])

  const [cities, setCities] =
    useState<CityType[]>([])

  const [
    tipoSelecionado,
    setTipoSelecionado
  ] = useState('')

  const [form, setForm] = useState({
    nome: '',
    razao_social: '',
    cpf_cnpj: '',
    email: '',
    site: '',
    responsavel: '',
    telefone: '',
    celular: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    complemento: '',
    estado: '',
    cidade: '',
    observacoes: '',
    avaliacao: 0,
    banco: '',
    agencia: '',
    conta: '',
    pix: '',
    tipos: [] as string[]
  })

  useEffect(() => {

    loadTipos()

    loadStates()

  }, [])

  useEffect(() => {

    if (form.estado) {

      loadCities(form.estado)

    } else {

      setCities([])
    }

  }, [form.estado])

  async function loadTipos() {

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/supplier-types`
      )

      const data =
        await response.json()

      setTipos(data)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao carregar tipos'
      )
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

      toast.error(
        'Erro ao carregar estados'
      )

    } finally {

      setLoadingStates(false)
    }
  }

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
        endereco:
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

  function updateField(
    field: string,
    value: any
  ) {

    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function addTipo(tipoId: string) {

    if (
      form.tipos.includes(tipoId)
    ) {
      setTipoSelecionado(tipoId)
      return
    }

    setForm(prev => ({
      ...prev,
      tipos: [
        ...prev.tipos,
        tipoId
      ]
    }))

    setTipoSelecionado(tipoId)
  }

  function removeTipo(
    tipoId: string
  ) {

    setForm(prev => ({
      ...prev,
      tipos: prev.tipos.filter(
        id => id !== tipoId
      )
    }))
  }

  async function handleSave() {

    if (!form.nome.trim()) {

      toast.error(
        'Informe o nome do fornecedor'
      )

      return
    }

    try {

      const tiposPayload = form.tipos.map((tipoId) => {
        const tipo = tipos.find(
          (item) => String(item.id) === tipoId
        )

        return tipo ? tipo.id : tipoId
      })

      setSaving(true)

      const response = await fetch(
         `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/suppliers`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify(
            {
              ...form,
              tipos: tiposPayload
            }
          )
        }
      )

      if (!response.ok) {

        throw new Error(
          'Erro ao salvar'
        )
      }

      toast.success(
        'Fornecedor criado com sucesso'
      )

      router.push(
        '/fornecedores'
      )

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao criar fornecedor'
      )

    } finally {

      setSaving(false)
    }
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
                  href="/fornecedores"
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
                    Novo fornecedor
                  </h1>

                  <p className="text-zinc-400">
                    Cadastre um novo fornecedor na plataforma
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
                  : 'Salvar fornecedor'}
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-8">

          {/* DADOS GERAIS */}
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
                Dados gerais
              </h2>

              <p className="text-zinc-400 text-sm">
                Informações principais do fornecedor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

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

              {/* TIPOS */}
              <div className="xl:col-span-2">

                <label
                  className="
                    block
                    text-sm
                    text-zinc-400
                    mb-2
                  "
                >
                  Tipos
                </label>

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-black/40
                    p-4
                  "
                >

                  <select
                    value={
                      tipoSelecionado
                    }
                    onChange={(e) => {

                      const value =
                        e.target.value

                      if (value) {
                        addTipo(value)
                      }
                    }}
                    className="
                      w-full
                      h-12
                      rounded-xl
                      border
                      border-white/10
                      bg-black
                      px-4
                      outline-none
                    "
                  >

                    <option value="">
                      Selecione um tipo
                    </option>

                    {tipos.map(
                      (tipo) => (

                        <option
                          key={tipo.id}
                          value={tipo.id}
                        >
                          {tipo.nome}
                        </option>
                      )
                    )}
                  </select>

                  <div className="flex flex-wrap gap-2 mt-4">

                    {form.tipos.map(
                      (tipoId) => {

                        const tipo =
                          tipos.find(
                            t =>
                              String(t.id) ===
                              tipoId
                          )

                        if (!tipo) {
                          return null
                        }

                        return (

                          <div
                            key={tipo.id}
                            className="
                              px-3
                              py-2
                              rounded-full
                              text-sm
                              border
                              border-emerald-500/20
                              bg-emerald-500/10
                              text-emerald-400
                              flex
                              items-center
                              gap-2
                            "
                          >
                            {tipo.nome}

                            <button
                              onClick={() =>
                                removeTipo(
                                  tipoId
                                )
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>
              </div>

              <Input
                label="Razão Social"
                value={
                  form.razao_social
                }
                onChange={(v: string) =>
                  updateField(
                    'razao_social',
                    v
                  )
                }
                placeholder="Digite a razão social"
              />

              <Input
                label="CPF | CNPJ"
                value={form.cpf_cnpj}
                onChange={(v: string) =>
                  updateField(
                    'cpf_cnpj',
                    v
                  )
                }
                placeholder="000.000.000-00"
              />

              <Input
                label="E-mail"
                value={form.email}
                onChange={(v: string) =>
                  updateField(
                    'email',
                    v
                  )
                }
                placeholder="email@empresa.com"
              />

              <Input
                label="Site"
                value={form.site}
                onChange={(v: string) =>
                  updateField(
                    'site',
                    v
                  )
                }
                placeholder="https://"
              />

              <Input
                label="Responsável"
                value={
                  form.responsavel
                }
                onChange={(v: string) =>
                  updateField(
                    'responsavel',
                    v
                  )
                }
                placeholder="Nome do responsável"
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
                placeholder="(00) 0000-0000"
              />

              <Input
                label="Celular/WhatsApp"
                value={form.celular}
                onChange={(v: string) =>
                  updateField(
                    'celular',
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
                Informações de localização
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
                  label="Endereço"
                  value={
                    form.endereco
                  }
                  onChange={(v: string) =>
                    updateField(
                      'endereco',
                      v
                    )
                  }
                  placeholder="Rua, avenida..."
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
                label="Bairro"
                value={form.bairro}
                onChange={(v: string) =>
                  updateField(
                    'bairro',
                    v
                  )
                }
                placeholder="Digite o bairro"
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
                placeholder="Apartamento, sala..."
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
            </div>
          </div>

          {/* OBSERVAÇÕES */}
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
                Observações e avaliação
              </h2>

              <p className="text-zinc-400 text-sm">
                Informações adicionais sobre o fornecedor
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

              <div>

                <label
                  className="
                    block
                    text-sm
                    text-zinc-400
                    mb-2
                  "
                >
                  Observações
                </label>

                <textarea
                  rows={6}
                  value={
                    form.observacoes
                  }
                  onChange={(e) =>
                    updateField(
                      'observacoes',
                      e.target.value
                    )
                  }
                  placeholder="Digite observações..."
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-black/40
                    px-4
                    py-4
                    outline-none
                    resize-none
                    focus:border-emerald-500/40
                  "
                />
              </div>

              <div>

                <label
                  className="
                    block
                    text-sm
                    text-zinc-400
                    mb-4
                  "
                >
                  Avaliação
                </label>

                <div className="flex items-center gap-2">

                  {[1, 2, 3, 4, 5].map(
                    (star) => (

                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          updateField(
                            'avaliacao',
                            star
                          )
                        }
                      >

                        <Star
                          size={28}
                          className={
                            star <=
                            form.avaliacao
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-zinc-600'
                          }
                        />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DADOS BANCÁRIOS */}
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
                Dados bancários
              </h2>

              <p className="text-zinc-400 text-sm">
                Informações financeiras do fornecedor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

              <Input
                label="Banco"
                value={form.banco}
                onChange={(v: string) =>
                  updateField(
                    'banco',
                    v
                  )
                }
                placeholder="Nome do banco"
              />

              <Input
                label="Agência"
                value={form.agencia}
                onChange={(v: string) =>
                  updateField(
                    'agencia',
                    v
                  )
                }
                placeholder="0000"
              />

              <Input
                label="Número da Conta"
                value={form.conta}
                onChange={(v: string) =>
                  updateField(
                    'conta',
                    v
                  )
                }
                placeholder="00000-0"
              />

              <Input
                label="Chave PIX"
                value={form.pix}
                onChange={(v: string) =>
                  updateField(
                    'pix',
                    v
                  )
                }
                placeholder="Digite a chave PIX"
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