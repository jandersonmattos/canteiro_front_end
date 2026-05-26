'use client'

import Link from 'next/link'

import {
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
  User,
  Building2,
  Loader2
} from 'lucide-react'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

export default function NewClientPage() {

  const router = useRouter()

  const [saving, setSaving] =
    useState(false)

  const [loadingCep, setLoadingCep] =
    useState(false)

  const [tipoPessoa, setTipoPessoa] =
    useState<'PF' | 'PJ'>('PF')

  const [form, setForm] = useState({

    nome: '',
    cpf: '',
    rg: '',

    razao_social: '',
    nome_fantasia: '',
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

  function updateField(
    field: string,
    value: string
  ) {

    setForm(prev => ({
      ...prev,
      [field]: value
    }))
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

    if (cep.length !== 8) {
      return
    }

    try {

      setLoadingCep(true)

      const response = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      )

      const data =
        await response.json()

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

  function validateForm() {

    if (tipoPessoa === 'PF') {

      if (!form.nome.trim()) {

        toast.error(
          'Digite o nome do cliente'
        )

        return false
      }
    }

    if (tipoPessoa === 'PJ') {

      if (
        !form.razao_social.trim()
      ) {

        toast.error(
          'Digite a razão social'
        )

        return false
      }
    }

    return true
  }

  async function handleSave() {

    try {

      if (!validateForm()) {
        return
      }

      setSaving(true)

      const payload = {

        person_type:
          tipoPessoa,

        name:
          tipoPessoa === 'PF'
            ? form.nome
            : form.nome_fantasia,

        cpf:
          form.cpf || null,

        rg:
          form.rg || null,

        corporate_name:
          form.razao_social || null,

        trade_name:
          form.nome_fantasia || null,

        cnpj:
          form.cnpj || null,

        email:
          form.email || null,

        phone:
          form.telefone || null,

        zip_code:
          form.cep || null,

        street:
          form.logradouro || null,

        number:
          form.numero || null,

        complement:
          form.complemento || null,

        neighborhood:
          form.bairro || null,

        city:
          form.cidade || null,

        state:
          form.estado || null,

        country:
          form.pais || 'Brasil'
      }

      console.log(
        'payload =>',
        payload
      )

      const response = await fetch(
        `${API_URL}/clients`,
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

      const result =
        await response.json()

      if (!response.ok) {

        throw new Error(
          result.detail ||
          'Erro ao salvar cliente'
        )
      }

      toast.success(
        'Cliente salvo com sucesso'
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
            sticky
            top-0
            z-20
          "
        >

          <div className="px-8 py-6">

            <div className="flex items-center justify-between flex-wrap gap-5">

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
                    Novo cliente
                  </h1>

                  <p className="text-zinc-400">
                    Cadastre um novo cliente
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
                  disabled:cursor-not-allowed
                "
              >

                {saving ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={18} />
                )}

                {saving
                  ? 'Salvando...'
                  : 'Salvar cliente'}
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

              {/* PF */}
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

              {/* PJ */}
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
                    label="Nome Fantasia"
                    value={
                      form.nome_fantasia
                    }
                    onChange={(v: string) =>
                      updateField(
                        'nome_fantasia',
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

              {/* COMUNS */}
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

              <Input
                label="Cidade"
                value={form.cidade}
                onChange={(v: string) =>
                  updateField(
                    'cidade',
                    v
                  )
                }
                placeholder="Curitiba"
              />

              <Input
                label="Estado"
                value={form.estado}
                onChange={(v: string) =>
                  updateField(
                    'estado',
                    v
                  )
                }
                placeholder="PR"
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
  id,
  type = 'text'
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
        type={type}
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
          transition-all
          focus:border-emerald-500/40
          focus:bg-black/60
        "
      />
    </div>
  )
}