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

import Sidebar from '../../components/Sidebar'

import {
  Plus,
  MoreVertical,
  House,
  MapPin,
  User,
  Building2,
  Pencil,
  Power,
  CheckCircle2,
  Trash2,
  X
} from 'lucide-react'

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

function formatProjectAddress(
  item: LooseObject
) {

  const address = pickString(
    item.endereco,
    item.address
  )

  const number = pickString(
    item.numero,
    item.number
  )

  const neighborhood = pickString(
    item.bairro,
    item.neighborhood
  )

  const city = pickString(
    item.cidade,
    item.city
  )

  const state = pickString(
    item.estado,
    item.state
  )

  const cep = pickString(item.cep)

  const mainParts = [
    address,
    number,
    neighborhood,
    city,
    state
  ].filter(Boolean)

  const mainAddress = mainParts.join(' - ')

  if (mainAddress && cep) {
    return `${mainAddress} - CEP ${cep}`
  }

  return mainAddress || (cep ? `CEP ${cep}` : '-')
}

export default function ProjectsPage() {

  const router = useRouter()

  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [menuOpenId, setMenuOpenId] =
    useState<number | null>(null)

  const [confirmInactive, setConfirmInactive] =
    useState<any>(null)

  const [confirmDelete, setConfirmDelete] =
    useState<any>(null)

  const [finishProject, setFinishProject] =
    useState<any>(null)

  const [finishDate, setFinishDate] =
    useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {

    try {

      setLoading(true)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects`
      )

      const data = await response.json()

      const formatted = data.map((item: any) => {

        const safeItem =
          item && typeof item === 'object'
            ? item as LooseObject
            : {}

        return {
          id: safeItem.id,

          nome: safeItem.nome,

          endereco: formatProjectAddress(safeItem),

          proprietario: safeItem.proprietario,

          categoria: safeItem.categoria,

          imagem: normalizeProjectImage(
            pickString(
              safeItem.imagem,
              safeItem.image,
              safeItem.image_url,
              safeItem.imageUrl,
              safeItem.foto,
              safeItem.thumbnail,
              safeItem.capa,
              safeItem.cover
            )
          ),

          status:
            safeItem.status || 'Planejamento',

          progresso:
            safeItem.progresso || 0
        }
      })

      setObras(formatted)

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao carregar obras'
      )

    } finally {
      setLoading(false)
    }
  }

  async function handleInactivateProject(
    projectId: number
  ) {

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/inactive`,
        {
          method: 'PUT'
        }
      )

      if (!response.ok) {
        throw new Error()
      }

      toast.success(
        'Obra inativada com sucesso'
      )

      setConfirmInactive(null)

      loadProjects()

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao inativar obra'
      )
    }
  }

 async function handleDeleteProject() {

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${confirmDelete.id}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || 'Erro ao deletar'
        )
      }

      setConfirmDelete(null)

      toast.success(
        data.message || 'Obra deletada com sucesso'
      )

      await loadProjects()

    } catch (error: any) {

      console.error(error)

      toast.error(
        error.message ||
        'Erro ao deletar obra'
      )
    }
  }

  async function handleFinishProject() {

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${finishProject.id}/finish`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            data_fim:
              finishDate || null
          })
        }
      )

      if (!response.ok) {
        throw new Error()
      }

      toast.success(
        'Obra finalizada com sucesso'
      )

      setFinishProject(null)

      setFinishDate('')

      loadProjects()

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao finalizar obra'
      )
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

              <div>

                <h1 className="text-4xl font-bold mb-2">
                  Obras
                </h1>

                <p className="text-zinc-400">
                  Gerencie todas as obras da plataforma
                </p>
              </div>

              <Link
                href="/projects/new"
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
                "
              >

                <Plus size={18} />

                Nova obra
              </Link>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

            <StatCard
              title="Obras ativas"
              value={
                String(
                  obras.filter(
                    (o) =>
                      o.status !==
                      'Inativa'
                  ).length
                )
              }
            />

            <StatCard
              title="Residenciais"
              value={
                String(
                  obras.filter(
                    (o) =>
                      o.categoria ===
                      'Residencial'
                  ).length
                )
              }
            />

            <StatCard
              title="Comerciais"
              value={
                String(
                  obras.filter(
                    (o) =>
                      o.categoria ===
                      'Comercial'
                  ).length
                )
              }
            />

            <StatCard
              title="Industriais"
              value={
                String(
                  obras.filter(
                    (o) =>
                      o.categoria ===
                      'Industrial'
                  ).length
                )
              }
            />
          </div>

          {/* GRID */}
          {loading ? (

            <div className="text-zinc-400">
              Carregando obras...
            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">

              {obras.map((obra) => {

                const hasImage =
                  typeof obra.imagem === 'string' &&
                  obra.imagem.trim().length > 0

                return (

                <div
                  key={obra.id}
                  onClick={() =>
                    router.push(`/projects/view/${obra.id}`)
                  }
                  className="
                    relative
                    rounded-[28px]
                    border
                    border-white/10
                    bg-white/[0.03]
                    hover:border-emerald-500/20
                    transition-all
                    hover:-translate-y-1
                    cursor-pointer
                    overflow-visible
                  "
                >

                  {/* IMAGE */}
                  <div
                    className="
                      relative
                      h-40
                      rounded-t-[28px]
                      bg-cover
                      bg-center
                      flex
                      items-center
                      justify-center
                    "
                    style={
                      hasImage
                        ? {
                            backgroundImage:
                              `url(${obra.imagem})`
                          }
                        : undefined
                    }
                  >

                    {!hasImage && (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-black" />
                    )}

                    {hasImage && (
                      <div className="absolute inset-0 bg-black/35" />
                    )}

                    {!hasImage && (
                      <House
                        size={68}
                        className="text-white/90 relative z-10"
                      />
                    )}

                    {/* BADGE */}
                    <div
                      className="
                        absolute
                        top-4
                        left-4
                        px-3
                        py-1.5
                        rounded-full
                        bg-black/40
                        border
                        border-white/10
                        text-xs
                        z-10
                      "
                    >
                      {obra.categoria}
                    </div>

                    {/* MENU */}
                    <div className="absolute top-4 right-4 z-[100]">

                      <button
                        onClick={(event) => {
                          event.stopPropagation()

                          setMenuOpenId(
                            menuOpenId === obra.id
                              ? null
                              : obra.id
                          )
                        }}
                        className="
                          w-10
                          h-10
                          rounded-xl
                          bg-black/60
                          border
                          border-white/10
                          flex
                          items-center
                          justify-center
                          hover:bg-white/10
                        "
                      >
                        <MoreVertical size={16} />
                      </button>

                      {menuOpenId === obra.id && (

                        <div
                          className="
                            absolute
                            top-12
                            right-0
                            w-56
                            rounded-2xl
                            border
                            border-white/10
                            bg-zinc-950
                            overflow-hidden
                            shadow-2xl
                            z-[999]
                          "
                        >

                         <Link
                          href={`/projects/edit/${obra.id}`}
                          onClick={(event) => {
                            event.stopPropagation()
                          }}
                          className="
                            flex
                            items-center
                            gap-3
                            px-4
                            py-3
                            hover:bg-white/[0.05]
                            transition-all
                            text-sm
                          "
                        >

                          <Pencil size={16} />

                          Editar obra
                        </Link>

                          <button
                            onClick={(event) => {

                              event.stopPropagation()

                              setMenuOpenId(null)

                              setFinishProject(
                                obra
                              )
                            }}
                            className="
                              w-full
                              flex
                              items-center
                              gap-3
                              px-4
                              py-3
                              hover:bg-white/[0.05]
                              text-sm
                            "
                          >

                            <CheckCircle2 size={16} />

                            Finalizar obra
                          </button>

                          <button
                            onClick={(event) => {

                              event.stopPropagation()

                              setMenuOpenId(null)

                              setConfirmDelete(
                                obra
                              )
                            }}
                            className="
                              w-full
                              flex
                              items-center
                              gap-3
                              px-4
                              py-3
                              hover:bg-red-500/10
                              text-sm
                              text-red-400
                            "
                          >

                            <Trash2 size={16} />

                            Deletar obra
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-5">

                    <h2 className="text-2xl font-bold mb-2">
                      {obra.nome}
                    </h2>

                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-5">

                      <MapPin size={14} />

                      {obra.endereco}
                    </div>

                    {/* PROGRESS */}
                    <div className="mb-5">

                      <div className="flex justify-between mb-2">

                        <span className="text-xs text-zinc-400">
                          Progresso
                        </span>

                        <span className="text-xs text-emerald-400 font-semibold">
                          {obra.progresso}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">

                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width:
                              `${obra.progresso}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="flex items-end justify-between">

                      <div>

                        <p className="text-zinc-500 text-xs mb-2">
                          Proprietário
                        </p>

                        <div className="flex items-center gap-2">

                          <div
                            className="
                              w-8
                              h-8
                              rounded-lg
                              bg-emerald-500/10
                              border
                              border-emerald-500/20
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <User size={14} />
                          </div>

                          <span className="text-sm">
                            {obra.proprietario}
                          </span>
                        </div>
                      </div>

                      <div
                        className="
                          px-3
                          py-1.5
                          rounded-full
                          text-xs
                          font-semibold
                          bg-emerald-500/10
                          border
                          border-emerald-500/20
                          text-emerald-400
                        "
                      >
                        {obra.status}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAIS */}
      {confirmDelete && (
        <ModalWrapper>

          <ModalHeader
            title="Deletar obra"
            description={`Deseja deletar ${confirmDelete.nome}?`}
            onClose={() =>
              setConfirmDelete(null)
            }
          />

          <div className="flex justify-end gap-3">

            <ModalCancelButton
              onClick={() =>
                setConfirmDelete(null)
              }
            />

            <button
              onClick={handleDeleteProject}
              className="
                h-11
                px-5
                rounded-2xl
                bg-red-500
                font-semibold
              "
            >
              Deletar
            </button>
          </div>
        </ModalWrapper>
      )}

      {finishProject && (
        <ModalWrapper>

          <ModalHeader
            title="Finalizar obra"
            description={`Deseja finalizar ${finishProject.nome}?`}
            onClose={() => {

              setFinishProject(null)
              setFinishDate('')
            }}
          />

          <div className="space-y-5">

            <div>

              <label
                className="
                  block
                  text-sm
                  text-zinc-400
                  mb-2
                "
              >
                Data de finalização
                (opcional)
              </label>

              <input
                type="date"
                value={finishDate}
                onChange={(e) =>
                  setFinishDate(
                    e.target.value
                  )
                }
                className="
                  w-full
                  h-12
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  px-4
                  outline-none
                  focus:border-emerald-500/40
                "
              />

              <p className="text-xs text-zinc-500 mt-2">
                Você pode deixar vazio para usar apenas a data atual do sistema.
              </p>
            </div>

            <div className="flex justify-end gap-3">

              <ModalCancelButton
                onClick={() => {

                  setFinishProject(null)
                  setFinishDate('')
                }}
              />

              <button
                onClick={handleFinishProject}
                className="
                  h-11
                  px-5
                  rounded-2xl
                  bg-emerald-500
                  text-black
                  font-semibold
                "
              >
                Finalizar obra
              </button>
            </div>
          </div>

        </ModalWrapper>
      )}

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

function StatCard({
  title,
  value
}: any) {

  return (
    <div
      className="
        rounded-[24px]
        border
        border-white/10
        bg-white/[0.03]
        p-5
      "
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-zinc-400 text-sm mb-2">
            {title}
          </p>

          <h3 className="text-3xl font-bold">
            {value}
          </h3>
        </div>

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
          "
        >
          <Building2 size={22} />
        </div>
      </div>
    </div>
  )
}