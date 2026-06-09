import { supabase } from '@/lib/supabase'
import { formatDisplayDate } from '@/utils/formatDisplay'
import type {
  Hotel,
  HotelInsert,
  HotelMonthlyReport,
  HotelMonthlyReportInsert,
  HotelUpdate,
} from '@/types/database'

export async function fetchHotels(ownerInvestorIds?: string[] | null) {
  const { data, error } = await supabase
    .from('hotels')
    .select(
      `
      *,
      investors:owner_investor_id ( id, name )
    `,
    )
    .order('updated_at', { ascending: false })

  if (error) throw error

  let rows = data ?? []
  if (ownerInvestorIds && ownerInvestorIds.length > 0) {
    const allowed = new Set(ownerInvestorIds)
    rows = rows.filter(
      (row) =>
        row.owner_investor_id && allowed.has(row.owner_investor_id as string),
    )
  }

  return rows.map((row) => ({
    ...(row as Hotel),
    owner_investor: row.investors as { id: string; name: string } | null,
  })) as Hotel[]
}

export async function fetchHotelById(id: string) {
  const { data, error } = await supabase
    .from('hotels')
    .select(
      `
      *,
      investors:owner_investor_id ( id, name )
    `,
    )
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    ...(data as Hotel),
    owner_investor: data.investors as { id: string; name: string } | null,
  } as Hotel
}

export async function createHotel(payload: HotelInsert) {
  const { data, error } = await supabase
    .from('hotels')
    .insert({
      ...payload,
      status: payload.status ?? '筹备中',
    })
    .select()
    .single()

  if (error) throw error
  return data as Hotel
}

export async function updateHotel(id: string, payload: HotelUpdate) {
  const { data, error } = await supabase
    .from('hotels')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Hotel
}

export async function fetchHotelMonthlyReports(hotelId: string) {
  const { data, error } = await supabase
    .from('hotel_monthly_reports')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('year', { ascending: true })
    .order('month', { ascending: true })

  if (error) throw error
  return (data ?? []) as HotelMonthlyReport[]
}

export async function upsertHotelMonthlyReport(
  payload: HotelMonthlyReportInsert,
) {
  const { data, error } = await supabase
    .from('hotel_monthly_reports')
    .upsert(payload, { onConflict: 'hotel_id,year,month' })
    .select()
    .single()

  if (error) throw error
  return data as HotelMonthlyReport
}

export function formatDate(value: string | null) {
  return formatDisplayDate(value)
}

export function calcNoi(revenue: number | null, expense: number | null) {
  if (revenue == null || expense == null) return null
  return Math.round((revenue - expense) * 100) / 100
}

export function reportLabel(report: HotelMonthlyReport) {
  return `${report.year}/${String(report.month).padStart(2, '0')}`
}
