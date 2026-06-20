'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { DraftReminder, DAYS_OF_WEEK, emptyDraft } from '@/lib/reminders/types'

interface QuickReminderFormProps {
  projectId?: string
  onClose?: () => void
  onSuccess?: () => void
}

export function QuickReminderForm({ projectId, onClose, onSuccess }: QuickReminderFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<DraftReminder>(emptyDraft())

  async function handleSave() {
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

      const payload = {
        descricao,
        recorrente: formData.recorrente,
        tipo_recorrencia: formData.recorrente ? formData.tipo_recorrencia : undefined,
        dia_semana: formData.recorrente && formData.tipo_recorrencia === 'semanal' ? formData.dia_semana : undefined,
        dia_mes: formData.recorrente && formData.tipo_recorrencia === 'mensal' ? formData.dia_mes : undefined,
        data_especifica: !formData.recorrente ? formData.data_especifica : undefined,
        ativo: true
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CANTEIRO_API_URL}/projects/${projectId}/reminders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          typeof errorData?.detail === 'string' ? errorData.detail : 'Erro ao criar lembrete'
        )
      }

      toast.success('Lembrete criado com sucesso!')
      setFormData(emptyDraft())
      onSuccess?.()
      onClose?.()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar lembrete')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Novo Lembrete Rápido</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={formData.descricao}
          onChange={(e) => setFormData((current) => ({ ...current, descricao: e.target.value }))}
          placeholder="Descrição do lembrete"
          className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
        />

        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              checked={!formData.recorrente}
              onChange={() => setFormData((current) => ({ ...current, recorrente: false }))}
              className="w-4 h-4"
            />
            Uma vez
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              checked={formData.recorrente}
              onChange={() => setFormData((current) => ({ ...current, recorrente: true }))}
              className="w-4 h-4"
            />
            Recorrente
          </label>
        </div>

        {!formData.recorrente && (
          <input
            type="date"
            value={formData.data_especifica}
            onChange={(e) => setFormData((current) => ({ ...current, data_especifica: e.target.value }))}
            className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
          />
        )}

        {formData.recorrente && (
          <>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  checked={formData.tipo_recorrencia === 'semanal'}
                  onChange={() => setFormData((current) => ({ ...current, tipo_recorrencia: 'semanal' }))}
                  className="w-4 h-4"
                />
                Semanal
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  checked={formData.tipo_recorrencia === 'mensal'}
                  onChange={() => setFormData((current) => ({ ...current, tipo_recorrencia: 'mensal' }))}
                  className="w-4 h-4"
                />
                Mensal
              </label>
            </div>

            {formData.tipo_recorrencia === 'semanal' && (
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
            )}

            {formData.tipo_recorrencia === 'mensal' && (
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dia_mes}
                onChange={(e) => setFormData((current) => ({ ...current, dia_mes: parseInt(e.target.value) || 1 }))}
                placeholder="Dia do mês"
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-emerald-400/50"
              />
            )}
          </>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-10 w-full rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Salvando...
            </>
          ) : (
            'Criar Lembrete'
          )}
        </button>
      </div>
    </div>
  )
}
