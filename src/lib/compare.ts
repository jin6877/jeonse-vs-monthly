/** 전세 vs 월세 비교 계산 로직 */

export interface CompareInputs {
  jeonseDeposit: number // 전세 보증금
  monthlyDeposit: number // 월세 보증금
  monthlyRent: number // 월세액
  conversionRatePct: number // 전월세 전환율 (연 %)
  years: number // 예상 거주 기간
  loanEnabled: boolean // 전세대출 이용 여부
  loanRatioPct: number // 대출 비율 (보증금 대비 %)
  loanRatePct: number // 전세대출 금리 (연 %)
  investRatePct: number // 예금/투자 수익률 (연 %)
}

export interface MonthPoint {
  month: number
  jeonse: number // 전세 누적 비용
  monthly: number // 월세 누적 비용
}

export interface CompareResult {
  months: number
  // 전세 측
  loanAmount: number // 전세대출 금액
  jeonseOwnCash: number // 전세 자기자본
  jeonseInterestTotal: number // 전세대출 이자 총액
  jeonseOpportunityTotal: number // 자기자본 기회비용 총액
  jeonseTotal: number
  jeonseMonthlyAvg: number
  // 월세 측
  rentTotal: number // 월세 총액
  monthlyOpportunityTotal: number // 월세 보증금 기회비용 총액
  monthlyTotal: number
  monthlyMonthlyAvg: number
  // 비교
  diff: number // monthlyTotal - jeonseTotal (양수면 전세 유리)
  winner: 'jeonse' | 'monthly' | 'tie'
  series: MonthPoint[]
  // 전환율 환산
  rentAsJeonse: number // 월세 조건을 전세 보증금으로 환산한 값
  jeonseAsRent: number // 전세 조건을 월세로 환산한 월세액 (월세 보증금 기준)
}

/**
 * 기회비용: 자본을 묶어두지 않고 연 수익률 r로 굴렸을 때 얻었을 수익 (월복리).
 * opportunity(m) = capital * ((1 + r/12)^m - 1)
 */
function opportunityCost(capital: number, annualRatePct: number, month: number): number {
  if (capital <= 0 || annualRatePct <= 0 || month <= 0) return 0
  const i = annualRatePct / 100 / 12
  return capital * (Math.pow(1 + i, month) - 1)
}

export function compare(inp: CompareInputs): CompareResult {
  const months = Math.max(1, Math.round(inp.years * 12))

  const loanAmount = inp.loanEnabled
    ? Math.min(inp.jeonseDeposit, (inp.jeonseDeposit * inp.loanRatioPct) / 100)
    : 0
  const jeonseOwnCash = inp.jeonseDeposit - loanAmount
  const monthlyLoanInterest = (loanAmount * inp.loanRatePct) / 100 / 12

  const series: MonthPoint[] = []
  for (let m = 0; m <= months; m++) {
    const jeonse = monthlyLoanInterest * m + opportunityCost(jeonseOwnCash, inp.investRatePct, m)
    const monthly = inp.monthlyRent * m + opportunityCost(inp.monthlyDeposit, inp.investRatePct, m)
    series.push({ month: m, jeonse, monthly })
  }

  const jeonseInterestTotal = monthlyLoanInterest * months
  const jeonseOpportunityTotal = opportunityCost(jeonseOwnCash, inp.investRatePct, months)
  const jeonseTotal = jeonseInterestTotal + jeonseOpportunityTotal

  const rentTotal = inp.monthlyRent * months
  const monthlyOpportunityTotal = opportunityCost(inp.monthlyDeposit, inp.investRatePct, months)
  const monthlyTotal = rentTotal + monthlyOpportunityTotal

  const diff = monthlyTotal - jeonseTotal
  const winner: CompareResult['winner'] =
    Math.abs(diff) < 1 ? 'tie' : diff > 0 ? 'jeonse' : 'monthly'

  // 전월세 전환율 환산
  // 월세 → 전세: 보증금 + (월세 × 12) ÷ 전환율
  const rentAsJeonse =
    inp.conversionRatePct > 0
      ? inp.monthlyDeposit + (inp.monthlyRent * 12) / (inp.conversionRatePct / 100)
      : 0
  // 전세 → 월세: (전세 보증금 − 월세 보증금) × 전환율 ÷ 12
  const jeonseAsRent =
    (Math.max(0, inp.jeonseDeposit - inp.monthlyDeposit) * (inp.conversionRatePct / 100)) / 12

  return {
    months,
    loanAmount,
    jeonseOwnCash,
    jeonseInterestTotal,
    jeonseOpportunityTotal,
    jeonseTotal,
    jeonseMonthlyAvg: jeonseTotal / months,
    rentTotal,
    monthlyOpportunityTotal,
    monthlyTotal,
    monthlyMonthlyAvg: monthlyTotal / months,
    diff,
    winner,
    series,
    rentAsJeonse,
    jeonseAsRent,
  }
}

/* ---------- 포맷 유틸 ---------- */

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('ko-KR')
}

export function fmtKorean(n: number): string {
  const v = Math.round(Math.abs(n))
  const sign = n < 0 ? '-' : ''
  if (v === 0) return '0원'
  const eok = Math.floor(v / 100_000_000)
  const man = Math.floor((v % 100_000_000) / 10_000)
  const rest = v % 10_000
  const parts: string[] = []
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`)
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`)
  if (rest > 0 && eok === 0 && man === 0) parts.push(`${rest.toLocaleString('ko-KR')}`)
  return sign + parts.join(' ') + '원'
}

export function fmtMonths(n: number): string {
  if (n <= 0) return '0개월'
  const y = Math.floor(n / 12)
  const m = n % 12
  const parts: string[] = []
  if (y > 0) parts.push(`${y}년`)
  if (m > 0) parts.push(`${m}개월`)
  return parts.join(' ')
}
