export type RecurrenceType = 'semanal' | 'mensal'

export type DayOfWeek =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
  | 'domingo'

export interface Reminder {
  id: string
  descricao: string
  recorrente: boolean
  tipo_recorrencia?: RecurrenceType
  dia_semana?: DayOfWeek
  dia_mes?: number
  data_especifica?: string
  ativo: boolean
}

export interface DraftReminder {
  descricao: string
  recorrente: boolean
  tipo_recorrencia: RecurrenceType
  dia_semana: DayOfWeek
  dia_mes: number
  data_especifica: string
}

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]

export function getRecurrenceLabel(reminder: Reminder): string {
  if (!reminder.recorrente) {
    if (reminder.data_especifica) {
      const [year, month, day] = reminder.data_especifica.split('-')
      return `${day}/${month}/${year}`
    }
    return 'Data não definida'
  }

  if (reminder.tipo_recorrencia === 'semanal' && reminder.dia_semana) {
    const day = DAYS_OF_WEEK.find((d) => d.value === reminder.dia_semana)
    return `Toda ${day?.label ?? reminder.dia_semana}`
  }

  if (reminder.tipo_recorrencia === 'mensal' && reminder.dia_mes) {
    return `Todo dia ${reminder.dia_mes} do mês`
  }

  return 'Recorrente'
}

export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function emptyDraft(): DraftReminder {
  return {
    descricao: '',
    recorrente: false,
    tipo_recorrencia: 'semanal',
    dia_semana: 'segunda',
    dia_mes: 1,
    data_especifica: new Date().toISOString().slice(0, 10),
  }
}
