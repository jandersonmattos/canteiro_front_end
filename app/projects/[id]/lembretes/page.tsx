'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Bell, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Reminder, DraftReminder, DAYS_OF_WEEK, getRecurrenceLabel, emptyDraft } from './types'

export default function RemindersPage() {
  const params = useParams<{ id: string }>()
  const projectId = params?.id as string | undefined

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<DraftReminder>(emptyDraft())

  useEffect(() => {
    loadReminders()
  }, [projectId])

  async function loadReminders() {
    if (!projectId) return

    try {
      setLoading(true)
      const url = `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/reminders`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Erro ao carregar lembretes')
      }

      const data = await response.json()
      const normalized = Array.isArray(data) ? data : Array.isArray(data.reminders) ? data.reminders : []
      setReminders(normalized)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível carregar os lembretes')
      setReminders([])
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData(emptyDraft())
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSaveReminder() {
    if (!projectId) {
      toast.error('Projeto não identificado')
      return
    }

    const descricao = formData.descricao.trim()

    if (!descricao) {
      toast.error('Informe a descrição do lembrete')
      return
    }

    if (formData.recorrente) {
      if (!formData.tipo_recorrencia) {
        toast.error('Selecione o tipo de recorrência')
        return
      }

      if (formData.tipo_recorrencia === 'semanal' && !formData.dia_semana) {
        toast.error('Selecione o dia da semana')
        return
      }

      if (formData.tipo_recorrencia === 'mensal') {
        if (!formData.dia_mes || formData.dia_mes < 1 || formData.dia_mes > 31) {
          toast.error('Informe um dia válido do mês (1-31)')
          return
        }
      }
    } else {
      if (!formData.data_especifica) {
        toast.error('Informe a data do lembrete')
        return
      }
    }

    try {
      setSaving(true)

      const url = editingId
        ? `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/reminders/${editingId}`
        : `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/reminders`

      const method = editingId ? 'PUT' : 'POST'
      const headers = { 'Content-Type': 'application/json' }

      const payload = {
        descricao,
        recorrente: formData.recorrente,
        tipo_recorrencia: formData.recorrente ? formData.tipo_recorrencia : undefined,
        dia_semana: formData.recorrente && formData.tipo_recorrencia === 'semanal' ? formData.dia_semana : undefined,
        dia_mes: formData.recorrente && formData.tipo_recorrencia === 'mensal' ? formData.dia_mes : undefined,
        data_especifica: !formData.recorrente ? formData.data_especifica : undefined,
        ativo: true
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail = typeof errorData?.detail === 'string' ? errorData.detail : `Erro ao ${editingId ? 'atualizar' : 'criar'} lembrete`
        throw new Error(detail)
      }

      toast.success(editingId ? 'Lembrete atualizado' : 'Lembrete criado')
      resetForm()
      void loadReminders()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar lembrete')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    if (!projectId) {
      toast.error('Projeto não identificado')
      return
    }

    if (!confirm('Tem certeza que deseja deletar este lembrete?')) {
      return
    }

    try {
      setDeletingId(reminderId)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/reminders/${reminderId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const detail = typeof errorData?.detail === 'string' ? errorData.detail : 'Erro ao deletar lembrete'
        throw new Error(detail)
      }

      setReminders((current) => current.filter((reminder) => reminder.id !== reminderId))
      toast.success('Lembrete deletado com sucesso')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar lembrete')
    } finally {
      setDeletingId(null)
    }
  }

  function startEditReminder(reminder: Reminder) {
    setFormData({
      descricao: reminder.descricao,
      recorrente: reminder.recorrente,
      tipo_recorrencia: reminder.tipo_recorrencia || 'semanal',
      dia_semana: reminder.dia_semana || 'segunda',
      dia_mes: reminder.dia_mes || 1,
      data_especifica: reminder.data_especifica || new Date().toISOString().slice(0, 10)
    })
    setEditingId(reminder.id)
    setShowForm(true)
  }

  const activeReminders = useMemo(
    () => reminders.filter((r) => r.ativo),
    [reminders]
  )

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="px-6 lg:px-8 py-7">
            <div className="flex items-center gap-4">
              <Link
                href={`/projects/view/${projectId}`}
                className="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center hover:bg-white/[0.06] transition-all"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <h1 className="text-4xl font-bold">Lembretes</h1>
                <p className="text-zinc-400 mt-1">Gerencie seus lembretes recorrentes e únicos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 space-y-6">
          {loading ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 flex items-center gap-3 text-zinc-300">
              <Loader2 size={18} className="animate-spin" />
              Carregando lembretes...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Meus Lembretes</h2>
                  <p className="text-zinc-400 mt-1 text-sm">
                    {activeReminders.length} lembrete{activeReminders.length !== 1 ? 's' : ''} ativo{activeReminders.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="h-11 px-4 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Novo Lembrete
                </button>
              </div>

              {showForm && (
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 lg:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">
                      {editingId ? 'Editar Lembrete' : 'Novo Lembrete'}
                    </h3>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-zinc-300 mb-2">Descrição</label>
                      <input
                        type="text"
                        value={formData.descricao}
                        onChange={(e) => setFormData((current) => ({ ...current, descricao: e.target.value }))}
                        placeholder="Ex.: Revisar projeto, Reunião com cliente"
                        className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-300 mb-2">Tipo de Lembrete</label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrence"
                            checked={!formData.recorrente}
                            onChange={() => setFormData((current) => ({ ...current, recorrente: false }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Uma vez</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recurrence"
                            checked={formData.recorrente}
                            onChange={() => setFormData((current) => ({ ...current, recorrente: true }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Recorrente</span>
                        </label>
                      </div>
                    </div>

                    {!formData.recorrente && (
                      <div>
                        <label className="block text-sm text-zinc-300 mb-2">Data do Lembrete</label>
                        <input
                          type="date"
                          value={formData.data_especifica}
                          onChange={(e) => setFormData((current) => ({ ...current, data_especifica: e.target.value }))}
                          className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                        />
                      </div>
                    )}

                    {formData.recorrente && (
                      <>
                        <div>
                          <label className="block text-sm text-zinc-300 mb-2">Tipo de Recorrência</label>
                          <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="recurrence-type"
                                checked={formData.tipo_recorrencia === 'semanal'}
                                onChange={() => setFormData((current) => ({ ...current, tipo_recorrencia: 'semanal' }))}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Semanal</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="recurrence-type"
                                checked={formData.tipo_recorrencia === 'mensal'}
                                onChange={() => setFormData((current) => ({ ...current, tipo_recorrencia: 'mensal' }))}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Mensal</span>
                            </label>
                          </div>
                        </div>

                        {formData.tipo_recorrencia === 'semanal' && (
                          <div>
                            <label className="block text-sm text-zinc-300 mb-2">Dia da Semana</label>
                            <select
                              value={formData.dia_semana}
                              onChange={(e) => setFormData((current) => ({ ...current, dia_semana: e.target.value as any }))}
                              className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                            >
                              {DAYS_OF_WEEK.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {formData.tipo_recorrencia === 'mensal' && (
                          <div>
                            <label className="block text-sm text-zinc-300 mb-2">Dia do Mês (1-31)</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={formData.dia_mes}
                              onChange={(e) => setFormData((current) => ({ ...current, dia_mes: parseInt(e.target.value) || 1 }))}
                              className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleSaveReminder}
                        disabled={saving}
                        className="flex-1 h-10 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar Lembrete'
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={saving}
                        className="flex-1 h-10 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] transition-all font-semibold disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeReminders.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 p-8 text-center">
                  <Bell size={32} className="mx-auto text-zinc-500 mb-3" />
                  <p className="text-zinc-400">Nenhum lembrete cadastrado.</p>
                  <p className="text-zinc-500 text-sm mt-1">Crie um novo lembrete para começar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-white/20 transition-all hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-semibold flex-1 break-words">{reminder.descricao}</h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditReminder(reminder)}
                            className="w-8 h-8 rounded-lg border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] transition-all flex items-center justify-center"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteReminder(reminder.id)}
                            disabled={deletingId === reminder.id}
                            className="w-8 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 flex items-center justify-center disabled:opacity-50"
                            title="Deletar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Calendar size={14} />
                        {getRecurrenceLabel(reminder)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
