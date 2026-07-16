import { supabase } from '@/lib/supabase'
import { resolveDemoList, markDemoDataActive, assertDemoWritable } from '@/lib/demoData'
import {
  DEMO_HOTELS,
  DEMO_HOTEL_REPORTS,
  getDemoHotelById,
} from '@/data/demoFixtures'
import { formatDisplayDate } from '@/utils/formatDisplay'
import type {
  Hotel,
  HotelInsert,
  HotelMonthlyReport,
  HotelMonthlyReportInsert,
  HotelUpdate,
} from '@/types/database'

export async function fetchHotels(ownerInvestorIds?: string[] | null) {
  try {
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

    let rows = (data ?? []).map((row) => ({
      ...(row as Hotel),
      owner_investor: row.investors as { id: string; name: string } | null,
    })) as Hotel[]

    if (ownerInvestorIds && ownerInvestorIds.length > 0) {
      const allowed = new Set(ownerInvestorIds)
      rows = rows.filter(
        (row) =>
          row.owner_investor_id && allowed.has(row.owner_investor_id as string),
      )
    }

    return resolveDemoList(rows, () => {
      let demo = [...DEMO_HOTELS]
      if (ownerInvestorIds && ownerInvestorIds.length > 0) {
        const allowed = new Set(ownerInvestorIds)
        demo = demo.filter(
          (row) =>
            row.owner_investor_id && allowed.has(row.owner_investor_id),
        )
      }
      return demo
    })
  } catch {
    return resolveDemoList([], () => [...DEMO_HOTELS])
  }
}

export async function fetchHotelById(id: string) {
  const demo = getDemoHotelById(id)
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

  if (!error && data) {
    return {
      ...(data as Hotel),
      owner_investor: data.investors as { id: string; name: string } | null,
    } as Hotel
  }
  if (demo) {
    markDemoDataActive()
    return demo
  }
  if (error) throw error
  throw new Error('酒店不存在')
}

export async function fetchHotelMonthlyReports(hotelId: string) {
  try {
    const { data, error } = await supabase
      .from('hotel_monthly_reports')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('year', { ascending: true })
      .order('month', { ascending: true })

    if (error) throw error
    const rows = (data ?? []) as HotelMonthlyReport[]
    return resolveDemoList(rows, () =>
      DEMO_HOTEL_REPORTS.filter((row) => row.hotel_id === hotelId),
    )
  } catch {
    return resolveDemoList([], () =>
      DEMO_HOTEL_REPORTS.filter((row) => row.hotel_id === hotelId),
    )
  }
}

export async function createHotel(payload: HotelInsert) {
  assertDemoWritable()
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
  assertDemoWritable(id)
  const { data, error } = await supabase
    .from('hotels')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Hotel
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
