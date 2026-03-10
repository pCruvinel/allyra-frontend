/**
 * Helpers para campos derivados de agendamentos.
 *
 * Centraliza a lógica de conversão de `data_hora_inicio` / `data_hora_fim`
 * (strings ISO) para os campos de compatibilidade `date`, `time` e `duration`
 * usados pela UI (CalendarEvent).
 *
 * Consumidores:
 *  - DataContext.tsx  (mapAppointment)
 *  - useAppointments.ts  (optimistic update)
 */

import type { AppointmentFormatted, UpdateAppointmentInput } from '@/types/appointments'

/**
 * Extrai a data local no formato YYYY-MM-DD sem conversão de timezone.
 * Evita o bug onde horários noturnos mudam de dia ao usar toISOString().
 */
export function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formata horário local no formato HH:mm (pt-BR).
 */
export function formatTimeString(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Formata um Date como ISO string com offset local do timezone.
 * Ex: "2026-03-09T08:00:00-03:00"
 *
 * Isso é necessário porque o banco usa `timestamp WITHOUT time zone`.
 * O backend/Supabase converte strings com offset para o valor UTC correto
 * antes de armazenar, mantendo consistência com o fluxo de criação
 * de agendamentos (GlobalModals.tsx).
 */
export function formatLocalISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  // Calcula offset: getTimezoneOffset() retorna minutos (ex: 180 para UTC-3)
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetHH = pad(Math.floor(absOffset / 60))
  const offsetMM = pad(absOffset % 60)

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHH}:${offsetMM}`
}

/**
 * Recalcula os campos derivados (`date`, `dateStr`, `time`, `duration`)
 * a partir das ISO strings `data_hora_inicio` e `data_hora_fim`.
 *
 * Usado no optimistic update para garantir que a UI reflita
 * imediatamente a posição correta do card no calendário.
 */
export function recalculateDerivedFields(
  existing: AppointmentFormatted,
  updates: UpdateAppointmentInput & Record<string, unknown>,
): AppointmentFormatted {
  // Merge base
  const merged: AppointmentFormatted = {
    ...existing,
    ...updates,
    status: (updates.status || existing.status),
  } as AppointmentFormatted

  // Recalcula campos de visualização se as datas ISO mudaram
  const isoStart = updates.data_hora_inicio ?? existing.data_hora_inicio
  const isoEnd = updates.data_hora_fim ?? existing.data_hora_fim

  if (updates.data_hora_inicio || updates.data_hora_fim) {
    const startDate = new Date(isoStart)
    const endDate = new Date(isoEnd)

    merged.date = getLocalDateString(startDate)
    merged.dateStr = merged.date
    merged.time = formatTimeString(startDate)
    merged.duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  }

  return merged
}
