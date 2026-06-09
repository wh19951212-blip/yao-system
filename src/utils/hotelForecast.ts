/** 酒店收益 12 个月预测 */

export interface HotelForecastInputs {
  salePriceMan: number
  roomRateYen: number
  roomCount: number
  occupancyRate: number
}

export interface MonthlyForecast {
  month: number
  label: string
  days: number
  revenueYen: number
  operatingCostYen: number
  noiYen: number
  cumulativeNoiYen: number
}

export interface HotelForecastResult {
  months: MonthlyForecast[]
  totalRevenueYen: number
  totalOperatingCostYen: number
  totalNoiYen: number
  noiYieldPercent: number
}

const OPERATING_COST_RATE = 0.35

const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

function daysInMonth(month: number) {
  const year = new Date().getFullYear()
  return new Date(year, month, 0).getDate()
}

export function calculateHotelForecast(
  inputs: HotelForecastInputs,
): HotelForecastResult | null {
  const { salePriceMan, roomRateYen, roomCount, occupancyRate } = inputs

  if (
    salePriceMan <= 0 ||
    roomRateYen <= 0 ||
    roomCount <= 0 ||
    occupancyRate < 0
  ) {
    return null
  }

  const occupancy = occupancyRate / 100
  let cumulativeNoiYen = 0
  let totalRevenueYen = 0
  let totalOperatingCostYen = 0

  const months = MONTH_LABELS.map((label, index) => {
    const month = index + 1
    const days = daysInMonth(month)
    const revenueYen = roomRateYen * occupancy * days * roomCount
    const operatingCostYen = revenueYen * OPERATING_COST_RATE
    const noiYen = revenueYen - operatingCostYen
    cumulativeNoiYen += noiYen
    totalRevenueYen += revenueYen
    totalOperatingCostYen += operatingCostYen

    return {
      month,
      label,
      days,
      revenueYen,
      operatingCostYen,
      noiYen,
      cumulativeNoiYen,
    }
  })

  const totalNoiYen = totalRevenueYen - totalOperatingCostYen
  const noiYieldPercent = (totalNoiYen / 10000 / salePriceMan) * 100

  return {
    months,
    totalRevenueYen,
    totalOperatingCostYen,
    totalNoiYen,
    noiYieldPercent,
  }
}

export const DEFAULT_HOTEL_INPUTS: HotelForecastInputs = {
  salePriceMan: 80000,
  roomRateYen: 15000,
  roomCount: 24,
  occupancyRate: 75,
}

export function formatYen(value: number) {
  return `${Math.round(value).toLocaleString('zh-CN')}`
}

export function formatManFromYen(yen: number) {
  return `${(yen / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 1 })} 万`
}
