'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'

import {
  useState,
  useEffect,
  useRef
} from 'react'

import {
  useParams
} from 'next/navigation'

import Sidebar from '../../../../components/Sidebar'
import ProjectStageSelector, {
  CUSTOM_STAGE_PREFIX,
  isCustomStageId
} from '../../../../components/ProjectStageSelector'

import {
  ArrowLeft,
  ChevronRight,
  Home,
  Loader2,
  Building,
  Warehouse,
  Users,
  Mail,
  Phone,
  Ruler,
  Folder,
  FolderPlus,
  Upload,
  FileText,
  ImageIcon,
  Trash2,
  Download,
  MoreVertical,
  X
} from 'lucide-react'

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

type StageType = {
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

type TabButtonProps = {
  label: string
  active: boolean
  onClick: () => void
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

function normalizeProjectImageForPreview(
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

function extractImageBase64(
  imageValue: string
) {

  if (!imageValue) {
    return ''
  }

  if (!imageValue.startsWith('data:')) {
    return imageValue
  }

  const parts = imageValue.split(',')

  return parts.length > 1
    ? parts[1]
    : ''
}

function fileToDataUrl(
  file: File
) {
  return new Promise<string>(
    (resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        resolve(String(reader.result || ''))
      }

      reader.onerror = () => {
        reject(new Error())
      }

      reader.readAsDataURL(file)
    }
  )
}

function makeApiCustomStageId(
  name: string,
  ordem?: unknown,
  index?: number
) {

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const orderToken =
    typeof ordem === 'number' ||
    typeof ordem === 'string'
      ? String(ordem)
      : String(index ?? 0)

  return `${CUSTOM_STAGE_PREFIX}api-${slug || 'etapa'}-${orderToken}`
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

function normalizeStage(
  raw: unknown
): StageType | null {

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

function normalizeProjectInfo(
  raw: unknown,
  fallbackId: string
): ProjectInfoType {

  const item =
    raw && typeof raw === 'object'
      ? raw as LooseObject
      : {}

  const parsedArea = pickString(
    item.area_construida,
    item.built_area,
    item.builtArea
  )

  const imageUrl = pickString(
    normalizeProjectImageForPreview(item.imagem),
    item.image,
    item.image_url,
    item.imageUrl,
    item.foto,
    item.thumbnail,
    item.capa,
    item.cover
  )

  return {
    id: pickString(item.id) || fallbackId,
    name: pickString(item.nome, item.name),
    imageUrl,
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
    builtArea: parsedArea,
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

export default function EditProjectPage() {

  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [tab, setTab] = useState<
    'info' |
    'stages' |
    'files'
  >('info')

  const [loadingFiles, setLoadingFiles] =
    useState(false)

  const [loadingProjectInfo, setLoadingProjectInfo] =
    useState(false)

  const [loadingProjectStages, setLoadingProjectStages] =
    useState(false)

  const [uploadingProjectImage, setUploadingProjectImage] =
    useState(false)

  const [savingProjectInfo, setSavingProjectInfo] =
    useState(false)

  const [savingProjectStages, setSavingProjectStages] =
    useState(false)

  const [loadingCep, setLoadingCep] =
    useState(false)

  const [loadingStates, setLoadingStates] =
    useState(false)

  const [loadingCities, setLoadingCities] =
    useState(false)

  const [folders, setFolders] =
    useState<FolderType[]>([])

  const [files, setFiles] =
    useState<FileType[]>([])

  const [projectInfo, setProjectInfo] =
    useState<ProjectInfoType | null>(null)

  const [projectForm, setProjectForm] =
    useState<ProjectInfoType | null>(null)

  const [allStages, setAllStages] =
    useState<StageType[]>([])

  const [states, setStates] =
    useState<StateType[]>([])

  const [cities, setCities] =
    useState<CityType[]>([])

  const [selectedStageIds, setSelectedStageIds] =
    useState<string[]>([])

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

  const persistedSelectedStageIds =
    selectedStageIds.filter(
      (stageId) =>
        !isCustomStageId(stageId)
    )

  const requestIdRef = useRef(0)

  useEffect(() => {

    if (projectId) {
      setCurrentFolder(null)
      setFolderPath([])
      loadProjectInfo()
      loadAllStages()
      loadProjectStages()
      loadFolderContent(null, [])
    }

  }, [projectId])

  useEffect(() => {
    loadStates()
  }, [])

  useEffect(() => {

    if (projectInfo) {
      setProjectForm(projectInfo)
    }

  }, [projectInfo])

  useEffect(() => {

    if (projectForm?.state) {
      loadCities(projectForm.state)
    } else {
      setCities([])
    }

  }, [projectForm?.state])

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
            (item: any) =>
              String(item?.id) === String(projectId)
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
        'Erro ao carregar informações da obra'
      )

    } finally {
      setLoadingProjectInfo(false)
    }
  }

  async function loadAllStages() {

    try {

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/stages`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      const normalized =
        (Array.isArray(data)
          ? data
          : [])
          .map((raw) =>
            normalizeStage(raw)
          )
          .filter(Boolean) as StageType[]

      setAllStages(normalized)

    } catch (error) {
      console.error(error)
    }
  }

  async function loadStates() {

    try {

      setLoadingStates(true)

      const response = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome'
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      setStates(Array.isArray(data) ? data : [])

    } catch (error) {
      console.error(error)
    } finally {
      setLoadingStates(false)
    }
  }

  async function loadCities(uf: string) {

    if (!uf) {
      setCities([])
      return
    }

    try {

      setLoadingCities(true)

      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      setCities(Array.isArray(data) ? data : [])

    } catch (error) {
      console.error(error)
    } finally {
      setLoadingCities(false)
    }
  }

  async function handleCepChange(value: string) {

    const cep = value.replace(/\D/g, '')

    const maskedCep = cep
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)

    updateProjectField('cep', maskedCep)

    if (cep.length !== 8) {
      return
    }

    try {

      setLoadingCep(true)

      const response = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      )

      if (!response.ok) {
        throw new Error()
      }

      const data = await response.json()

      if (data?.erro) {
        return
      }

      setProjectForm((prev) => {

        if (!prev) {
          return prev
        }

        return {
          ...prev,
          cep: maskedCep,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }
      })

    } catch (error) {
      console.error(error)
    } finally {
      setLoadingCep(false)
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

      const normalizedFromArray =
        (Array.isArray(data)
          ? data
          : Array.isArray(data?.stages)
          ? data.stages
          : Array.isArray(data?.etapas)
          ? data.etapas
          : [])

      const customStagesFromApi: Array<{
        id: string
        name: string
      }> = []

      const ids = normalizedFromArray
        .map((item: unknown, index: number) => {
          if (
            typeof item === 'string' ||
            typeof item === 'number'
          ) {
            return String(item)
          }

          if (
            item &&
            typeof item === 'object'
          ) {
            const obj = item as LooseObject

            const explicitId = pickString(
              obj.etapaid,
              obj.etapa_id,
              obj.id,
              obj.stage_id,
              (obj.stage as LooseObject | undefined)?.id
            )

            if (explicitId) {
              return explicitId
            }

            const isCustom =
              Boolean(obj.customizada) ||
              Boolean(obj.custom)

            const customName = pickString(
              obj.name,
              obj.nome,
              obj.stage_name,
              (obj.stage as LooseObject | undefined)?.name,
              (obj.stage as LooseObject | undefined)?.nome
            )

            if (isCustom && customName) {
              const generatedId = makeApiCustomStageId(
                customName,
                obj.ordem,
                index
              )

              customStagesFromApi.push({
                id: generatedId,
                name: customName
              })

              return generatedId
            }
          }

          return ''
        })
        .filter(Boolean)

      if (customStagesFromApi.length) {
        try {
          const storageKey =
            'canteiro-custom-stages'

          const rawStored =
            window.localStorage.getItem(
              storageKey
            )

          const parsedStored = rawStored
            ? JSON.parse(rawStored)
            : []

          const safeStored = Array.isArray(parsedStored)
            ? parsedStored
            : []

          const mergedMap = new Map<
            string,
            { id: string; name: string }
          >()

          safeStored.forEach((item) => {
            if (
              item &&
              typeof item === 'object'
            ) {
              const value = item as Record<string, unknown>
              const id = pickString(value.id)
              const name = pickString(value.name)

              if (id && name) {
                mergedMap.set(id, { id, name })
              }
            }
          })

          customStagesFromApi.forEach((item) => {
            mergedMap.set(item.id, item)
          })

          window.localStorage.setItem(
            storageKey,
            JSON.stringify(
              Array.from(mergedMap.values())
            )
          )
        } catch (error) {
          console.error(error)
        }
      }

      setSelectedStageIds(ids)

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

        // Guarantees state consistency even if API returns a non-standard payload.
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

  async function handleProjectImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const selectedFile =
      event.target.files?.[0]

    event.target.value = ''

    if (!selectedFile || !projectId) {
      return
    }

    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Selecione apenas imagens')
      return
    }

    try {

      setUploadingProjectImage(true)

      const imageDataUrl = await fileToDataUrl(
        selectedFile
      )

      if (!imageDataUrl) {
        throw new Error()
      }

      updateProjectField('imageUrl', imageDataUrl)

      toast.success('Imagem carregada')

    } catch (error) {

      console.error(error)

      toast.error('Erro ao enviar imagem')

    } finally {
      setUploadingProjectImage(false)
    }
  }

  function updateProjectField(
    field: keyof ProjectInfoType,
    value: string
  ) {

    setProjectForm((prev) => {

      if (!prev) {
        return prev
      }

      return {
        ...prev,
        [field]: value
      }
    })
  }

  async function handleSaveProjectInfo() {

    if (!projectId || !projectForm) {
      return
    }

    if (!projectForm.name.trim()) {
      toast.error('Informe o nome da obra')
      return
    }

    try {

      setSavingProjectInfo(true)

      const customStages =
        getSelectedCustomStagesFromStorage(
          selectedStageIds
        )

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: projectForm.name,
            imagem:
              extractImageBase64(
                projectForm.imageUrl
              ) || null,
            categoria: projectForm.category,
            status: projectForm.status,
            quantidade_unidades: Number(
              projectForm.quantityUnits || 0
            ),
            data_inicio: projectForm.startDate || null,
            data_fim: projectForm.endDate || null,
            proprietario: projectForm.owner,
            proprietario_email: projectForm.ownerEmail,
            proprietario_telefone: projectForm.ownerPhone,
            cep: projectForm.cep,
            endereco: projectForm.address,
            numero: projectForm.number,
            bairro: projectForm.neighborhood,
            cidade: projectForm.city,
            estado: projectForm.state,
            descricao: projectForm.description,
            area_construida: Number(projectForm.builtArea || 0),
            etapas: persistedSelectedStageIds,
            etapas_customizadas: customStages.map(
              (stage) => stage.name
            ),
            etapas_customizadas_detalhes: customStages
          })
        }
      )

      if (!response.ok) {
        throw new Error()
      }

      toast.success('Informações atualizadas')

      await loadProjectInfo()

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao salvar informações da obra'
      )

    } finally {
      setSavingProjectInfo(false)
    }
  }

  async function handleSaveProjectStages() {

    if (!projectId) {
      return
    }

    try {

      setSavingProjectStages(true)

      const customStages =
        getSelectedCustomStagesFromStorage(
          selectedStageIds
        )

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/stages`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            etapas: persistedSelectedStageIds,
            etapas_customizadas: customStages.map(
              (stage) => stage.name
            ),
            etapas_customizadas_detalhes: customStages
          })
        }
      )

      if (!response.ok) {
        throw new Error()
      }

      toast.success('Etapas atualizadas')

      await loadProjectStages()

    } catch (error) {

      console.error(error)

      toast.error(
        'Erro ao salvar etapas da obra'
      )

    } finally {
      setSavingProjectStages(false)
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
                    Editar obra
                  </h1>

                  <p className="text-zinc-400 mt-1">
                    Edicao inteligente de obras
                  </p>

                </div>
              </div>

              <div className="flex items-center gap-3">

                <TabButton
                  active={tab === 'info'}
                  label="Informações"
                  onClick={() =>
                    setTab('info')
                  }
                />

                <TabButton
                  active={tab === 'stages'}
                  label="Etapas"
                  onClick={() =>
                    setTab('stages')
                  }
                />

                <TabButton
                  active={tab === 'files'}
                  label="Pasta da obra"
                  onClick={() =>
                    setTab('files')
                  }
                />

              </div>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">

          {tab === 'info' && (

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

              {loadingProjectInfo ? (

                <div className="flex items-center gap-3 text-zinc-400">

                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Carregando informações...
                </div>

              ) : (

                <>
                  <div className="mb-8 rounded-2xl border border-white/10 bg-black/30 p-5">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

                      <div className="h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 lg:max-w-sm">
                        {projectForm?.imageUrl ? (
                          <img
                            src={projectForm.imageUrl}
                            alt={projectForm.name || 'Imagem da obra'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-500/15 via-black to-black text-zinc-500">
                            <ImageIcon size={34} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm text-zinc-400">
                            Imagem da obra
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Envie uma imagem ou informe a URL manualmente.
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 font-medium text-white transition-all hover:bg-white/[0.06]">
                            {uploadingProjectImage ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Upload size={18} />
                            )}
                            {uploadingProjectImage
                              ? 'Enviando imagem...'
                              : 'Upload imagem'}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={handleProjectImageUpload}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => updateProjectField('imageUrl', '')}
                            disabled={!projectForm?.imageUrl}
                            className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-5 font-medium text-zinc-300 transition-all hover:bg-white/[0.06] disabled:opacity-40"
                          >
                            Remover imagem
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">

                    <label className="text-sm text-zinc-400 block mb-4">
                      Categoria da obra
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      <CategoryCard
                        active={projectForm?.category === 'Residencial'}
                        title="Residencial"
                        icon={<Home size={22} />}
                        onClick={() => updateProjectField('category', 'Residencial')}
                      />

                      <CategoryCard
                        active={projectForm?.category === 'Comercial'}
                        title="Comercial"
                        icon={<Building size={22} />}
                        onClick={() => updateProjectField('category', 'Comercial')}
                      />

                      <CategoryCard
                        active={projectForm?.category === 'Industrial'}
                        title="Industrial"
                        icon={<Warehouse size={22} />}
                        onClick={() => updateProjectField('category', 'Industrial')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    <div className="md:col-span-2">
                      <FormInput
                        label="Nome da obra"
                        value={projectForm?.name || ''}
                        onChange={(e) => updateProjectField('name', e.target.value)}
                      />
                    </div>

                    <FormInput
                      label="M2 Construido"
                      icon={<Ruler size={15} />}
                      type="number"
                      value={projectForm?.builtArea || ''}
                      onChange={(e) => updateProjectField('builtArea', e.target.value)}
                    />

                    <FormInput
                      label="Quantidade de unidades"
                      type="number"
                      value={projectForm?.quantityUnits || ''}
                      onChange={(e) => updateProjectField('quantityUnits', e.target.value)}
                    />

                    <FormInput
                      label="Status"
                      value={projectForm?.status || ''}
                      onChange={(e) => updateProjectField('status', e.target.value)}
                    />

                    <FormInput
                      label="Data de inicio"
                      type="date"
                      value={projectForm?.startDate || ''}
                      onChange={(e) => updateProjectField('startDate', e.target.value)}
                    />

                    <FormInput
                      label="Data de finalizacao"
                      type="date"
                      value={projectForm?.endDate || ''}
                      onChange={(e) => updateProjectField('endDate', e.target.value)}
                    />

                    <FormInput
                      label="Proprietario"
                      icon={<Users size={15} />}
                      value={projectForm?.owner || ''}
                      onChange={(e) => updateProjectField('owner', e.target.value)}
                    />

                    <FormInput
                      label="Email"
                      icon={<Mail size={15} />}
                      value={projectForm?.ownerEmail || ''}
                      onChange={(e) => updateProjectField('ownerEmail', e.target.value)}
                    />

                    <FormInput
                      label="Telefone"
                      icon={<Phone size={15} />}
                      value={projectForm?.ownerPhone || ''}
                      onChange={(e) => updateProjectField('ownerPhone', e.target.value)}
                    />

                    <div className="relative">
                      <FormInput
                        label="CEP"
                        value={projectForm?.cep || ''}
                        onChange={(e) => handleCepChange(e.target.value)}
                      />

                      {loadingCep && (
                        <div className="absolute right-4 top-[38px] text-xs text-emerald-400 flex items-center gap-2">
                          <Loader2 size={12} className="animate-spin" />
                          Buscando...
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <FormInput
                        label="Endereco"
                        value={projectForm?.address || ''}
                        onChange={(e) => updateProjectField('address', e.target.value)}
                      />
                    </div>

                    <FormInput
                      label="Numero"
                      value={projectForm?.number || ''}
                      onChange={(e) => updateProjectField('number', e.target.value)}
                    />

                    <FormInput
                      label="Bairro"
                      value={projectForm?.neighborhood || ''}
                      onChange={(e) => updateProjectField('neighborhood', e.target.value)}
                    />

                    <FormSelect
                      label="Estado"
                      value={projectForm?.state || ''}
                      loading={loadingStates}
                      options={states.map((state) => ({
                        label: `${state.nome} (${state.sigla})`,
                        value: state.sigla
                      }))}
                      onChange={(e) => {
                        updateProjectField('state', e.target.value)
                        updateProjectField('city', '')
                      }}
                    />

                    <FormSelect
                      label="Cidade"
                      value={projectForm?.city || ''}
                      loading={loadingCities}
                      disabled={!projectForm?.state}
                      options={cities.map((city) => ({
                        label: city.nome,
                        value: city.nome
                      }))}
                      onChange={(e) => updateProjectField('city', e.target.value)}
                    />

                    <div className="xl:col-span-4">
                      <FormTextArea
                        label="Descricao"
                        value={projectForm?.description || ''}
                        onChange={(e) => updateProjectField('description', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleSaveProjectInfo}
                      disabled={savingProjectInfo}
                      className="flex items-center gap-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 transition-all px-6 py-3 font-semibold text-black disabled:opacity-50"
                    >
                      {savingProjectInfo && (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      )}

                      {savingProjectInfo
                        ? 'Salvando...'
                        : 'Salvar informacoes'}

                      <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              )}

            </div>

          )}

          {tab === 'stages' && (
            <ProjectStageSelector
              title="Etapas da obra"
              description="Use a biblioteca da esquerda para montar a obra no painel da direita, com muito menos clique e mais visibilidade do que ficou selecionado."
              stages={allStages}
              selectedStageIds={selectedStageIds}
              onSelectedStageIdsChange={setSelectedStageIds}
              loading={loadingProjectStages}
              saving={savingProjectStages}
              onSave={handleSaveProjectStages}
              saveLabel="Salvar etapas"
            />

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

function CategoryCard({
  active,
  title,
  icon,
  onClick
}: {
  active: boolean
  title: string
  icon: React.ReactNode
  onClick: () => void
}) {

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-2xl
        border
        p-5
        text-left
        transition-all
        ${
          active
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
        }
      `}
    >

      <div className="flex items-center gap-3">

        <div className={`
          w-10
          h-10
          rounded-xl
          border
          flex
          items-center
          justify-center
          ${
            active
              ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
              : 'border-white/10 bg-white/[0.04] text-zinc-300'
          }
        `}>
          {icon}
        </div>

        <p className={active ? 'font-semibold text-emerald-300' : 'font-semibold text-zinc-100'}>
          {title}
        </p>

      </div>
    </button>
  )
}

function FormInput({
  label,
  value,
  onChange,
  icon,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  icon?: React.ReactNode
  type?: 'text' | 'number' | 'date'
}) {

  return (
    <div>

      <label className="block text-sm text-zinc-400 mb-2">
        {label}
      </label>

      <div className="relative">

        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`w-full h-12 rounded-2xl border border-white/10 bg-black/40 outline-none focus:border-emerald-500/40 ${icon ? 'pl-11 pr-4' : 'px-4'}`}
        />

      </div>

    </div>
  )
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  loading,
  disabled
}: {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: { label: string; value: string }[]
  loading?: boolean
  disabled?: boolean
}) {

  return (
    <div>

      <label className="block text-sm text-zinc-400 mb-2">
        {label}
      </label>

      <select
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className="w-full h-12 rounded-2xl border border-white/10 bg-black/40 px-4 outline-none focus:border-emerald-500/40 disabled:opacity-50"
      >
        <option value="">
          {loading ? 'Carregando...' : `Selecione ${label.toLowerCase()}`}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

    </div>
  )
}

function FormTextArea({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {

  return (
    <div>

      <label className="block text-sm text-zinc-400 mb-2">
        {label}
      </label>

      <textarea
        rows={5}
        value={value}
        onChange={onChange}
        placeholder="Descreva a obra"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none resize-none focus:border-emerald-500/40"
      />

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