/** 土地开发回报率计算器 */

export interface LandRoiInputs {
  landAreaSqm: number
  floorAreaRatio: number
  buildingCoverageRatio: number
  landPriceMan: number
  constructionCostPerSqmMan: number
  projectManagementRate: number
  roomRateYen: number
  occupancyRate: number
  roomCount: number
}

export interface LandRoiResult {
  buildingFootprintSqm: number
  totalFloorAreaSqm: number
  constructionCostMan: number
  projectManagementFeeMan: number
  totalDevelopmentCostMan: number
  annualRevenueYen: number
  annualRevenueMan: number
  operatingCostYen: number
  operatingCostMan: number
  netIncomeYen: number
  netIncomeMan: number
  grossYieldPercent: number
  netYieldPercent: number
}

const OPERATING_COST_RATE = 0.35

export function calculateLandRoi(inputs: LandRoiInputs): LandRoiResult | null {
  const {
    landAreaSqm,
    floorAreaRatio,
    buildingCoverageRatio,
    landPriceMan,
    constructionCostPerSqmMan,
    projectManagementRate,
    roomRateYen,
    occupancyRate,
    roomCount,
  } = inputs

  if (
    landAreaSqm <= 0 ||
    floorAreaRatio <= 0 ||
    landPriceMan <= 0 ||
    constructionCostPerSqmMan <= 0 ||
    roomCount <= 0 ||
    roomRateYen <= 0
  ) {
    return null
  }

  const buildingFootprintSqm = landAreaSqm * (buildingCoverageRatio / 100)
  const totalFloorAreaSqm = landAreaSqm * floorAreaRatio
  const constructionCostMan = totalFloorAreaSqm * constructionCostPerSqmMan
  const projectManagementFeeMan =
    constructionCostMan * (projectManagementRate / 100)
  const totalDevelopmentCostMan =
    landPriceMan + constructionCostMan + projectManagementFeeMan

  if (totalDevelopmentCostMan <= 0) return null

  const occupancy = occupancyRate / 100
  const annualRevenueYen = roomRateYen * occupancy * 365 * roomCount
  const operatingCostYen = annualRevenueYen * OPERATING_COST_RATE
  const netIncomeYen = annualRevenueYen - operatingCostYen

  const annualRevenueMan = annualRevenueYen / 10000
  const operatingCostMan = operatingCostYen / 10000
  const netIncomeMan = netIncomeYen / 10000

  const grossYieldPercent =
    (annualRevenueMan / totalDevelopmentCostMan) * 100
  const netYieldPercent = (netIncomeMan / totalDevelopmentCostMan) * 100

  return {
    buildingFootprintSqm,
    totalFloorAreaSqm,
    constructionCostMan,
    projectManagementFeeMan,
    totalDevelopmentCostMan,
    annualRevenueYen,
    annualRevenueMan,
    operatingCostYen,
    operatingCostMan,
    netIncomeYen,
    netIncomeMan,
    grossYieldPercent,
    netYieldPercent,
  }
}

export const DEFAULT_LAND_ROI_INPUTS: LandRoiInputs = {
  landAreaSqm: 500,
  floorAreaRatio: 4,
  buildingCoverageRatio: 60,
  landPriceMan: 50000,
  constructionCostPerSqmMan: 62,
  projectManagementRate: 5,
  roomRateYen: 15000,
  occupancyRate: 75,
  roomCount: 20,
}

export function formatManYen(value: number, decimals = 0) {
  return `${value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} 万`
}

export function formatYen(value: number) {
  return `${Math.round(value).toLocaleString('zh-CN')} 日元`
}

export function formatSqm(value: number) {
  return `${value.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} ㎡`
}

export function formatYield(value: number) {
  return `${value.toFixed(2)}%`
}
