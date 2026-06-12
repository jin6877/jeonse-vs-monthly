import { useEffect, useMemo, useState } from 'react'
import { compare, fmt, fmtKorean, fmtMonths, type CompareInputs } from './lib/compare'

const STORAGE_KEY = 'jeonse-vs-monthly-v1'

const DEFAULTS: CompareInputs = {
  jeonseDeposit: 300_000_000,
  monthlyDeposit: 30_000_000,
  monthlyRent: 1_000_000,
  conversionRatePct: 5.5,
  years: 2,
  loanEnabled: true,
  loanRatioPct: 80,
  loanRatePct: 4.0,
  investRatePct: 3.5,
}

function loadInputs(): CompareInputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw)
    const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : d)
    return {
      jeonseDeposit: num(p.jeonseDeposit, DEFAULTS.jeonseDeposit),
      monthlyDeposit: num(p.monthlyDeposit, DEFAULTS.monthlyDeposit),
      monthlyRent: num(p.monthlyRent, DEFAULTS.monthlyRent),
      conversionRatePct: num(p.conversionRatePct, DEFAULTS.conversionRatePct),
      years: num(p.years, DEFAULTS.years) || DEFAULTS.years,
      loanEnabled: Boolean(p.loanEnabled),
      loanRatioPct: num(p.loanRatioPct, DEFAULTS.loanRatioPct),
      loanRatePct: num(p.loanRatePct, DEFAULTS.loanRatePct),
      investRatePct: num(p.investRatePct, DEFAULTS.investRatePct),
    }
  } catch {
    return DEFAULTS
  }
}

/* ---------- 입력 컴포넌트 ---------- */

function MoneyInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
}) {
  const [text, setText] = useState(fmt(value))
  useEffect(() => setText(fmt(value)), [value])

  return (
    <div>
      <div className="relative">
        <input
          inputMode="numeric"
          value={text}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '')
            const n = digits === '' ? 0 : Math.min(Number(digits), max)
            setText(digits === '' ? '' : fmt(n))
            onChange(n)
          }}
          onBlur={() => setText(fmt(value))}
          className="w-full rounded-lg border border-[#ded7c6] bg-white px-4 py-3 pr-12 text-right text-lg font-semibold tabular-nums text-slate-900 shadow-[inset_0_1px_2px_rgba(67,56,202,0.04)] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          원
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider mt-3 w-full"
      />
      <p className="mt-1 text-right text-xs font-medium text-indigo-600">{fmtKorean(value)}</p>
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
}) {
  return (
    <div>
      <div className="relative">
        <input
          inputMode="decimal"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!Number.isNaN(n)) onChange(Math.min(Math.max(n, 0), max))
          }}
          className="w-full rounded-lg border border-[#ded7c6] bg-white px-4 py-3 pr-12 text-right text-lg font-semibold tabular-nums text-slate-900 shadow-[inset_0_1px_2px_rgba(67,56,202,0.04)] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider mt-3 w-full"
      />
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-indigo-600' : 'bg-[#d6cfbf]'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

/* ---------- 차트 ---------- */

const COLOR_JEONSE = '#4f46e5'
const COLOR_MONTHLY = '#e11d48'

function CumulativeChart({
  series,
}: {
  series: { month: number; jeonse: number; monthly: number }[]
}) {
  const W = 600
  const H = 200
  const months = series.length - 1
  const maxV = Math.max(...series.map((p) => Math.max(p.jeonse, p.monthly)), 1) * 1.08

  const path = (key: 'jeonse' | 'monthly') =>
    series
      .map((p) => {
        const x = (p.month / Math.max(months, 1)) * W
        const y = H - (p[key] / maxV) * H
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

  const gridYears = useMemo(() => {
    const out: number[] = []
    for (let y = 12; y < months; y += 12) out.push(y)
    return out
  }, [months])

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={0}
            x2={W}
            y1={H * t}
            y2={H * t}
            stroke="#e6e0d2"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        ))}
        {gridYears.map((m) => (
          <line
            key={m}
            x1={(m / months) * W}
            x2={(m / months) * W}
            y1={0}
            y2={H}
            stroke="#e6e0d2"
            strokeWidth="0.5"
            strokeDasharray="2 5"
          />
        ))}
        <polyline
          points={path('monthly')}
          fill="none"
          stroke={COLOR_MONTHLY}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={path('jeonse')}
          fill="none"
          stroke={COLOR_JEONSE}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: COLOR_JEONSE }} />
          전세 누적 비용
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: COLOR_MONTHLY }} />
          월세 누적 비용
        </span>
        <span className="ml-auto text-slate-400">입주 → {fmtMonths(months)} 후</span>
      </div>
    </div>
  )
}

function BreakdownBar({
  label,
  total,
  maxTotal,
  segments,
}: {
  label: string
  total: number
  maxTotal: number
  segments: { name: string; value: number; color: string }[]
}) {
  const widthPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">{fmtKorean(total)}</span>
      </div>
      <div className="h-7 w-full overflow-hidden rounded-md bg-[#f1ede2]">
        <div className="flex h-full transition-all duration-500" style={{ width: `${widthPct}%` }}>
          {segments.map(
            (s) =>
              s.value > 0 && (
                <div
                  key={s.name}
                  className="h-full transition-all duration-500"
                  style={{
                    width: total > 0 ? `${(s.value / total) * 100}%` : '0%',
                    backgroundColor: s.color,
                  }}
                />
              ),
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {segments.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.name} <span className="tabular-nums text-slate-700">{fmtKorean(s.value)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- 카드 ---------- */

function SummaryCard({
  label,
  value,
  sub,
  accent,
  warn,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div
      className={`rounded-xl border-t-4 bg-white p-4 shadow-[0_1px_3px_rgba(30,27,75,0.08)] ring-1 ${
        accent
          ? 'border-t-indigo-600 ring-indigo-100'
          : warn
            ? 'border-t-rose-500 ring-rose-100'
            : 'border-t-[#cfc8b8] ring-[#eae4d6]'
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1.5 break-words text-base font-bold tabular-nums sm:text-lg ${
          accent ? 'text-indigo-700' : warn ? 'text-rose-600' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

/* ---------- 메인 ---------- */

export default function App() {
  const [inputs, setInputs] = useState<CompareInputs>(loadInputs)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs))
  }, [inputs])

  const set = (patch: Partial<CompareInputs>) => setInputs((p) => ({ ...p, ...patch }))
  const r = useMemo(() => compare(inputs), [inputs])

  const winnerLabel = r.winner === 'jeonse' ? '전세' : r.winner === 'monthly' ? '월세' : '동일'
  const diffAbs = Math.abs(r.diff)
  const maxTotal = Math.max(r.jeonseTotal, r.monthlyTotal, 1)

  // 전환율 기준: 월세 조건을 전세 보증금으로 환산했을 때 실제 전세보다 싼가
  const conversionFavorsMonthly = r.rentAsJeonse < inputs.jeonseDeposit

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-slate-800">
      <div className="h-1.5 bg-gradient-to-r from-indigo-700 via-indigo-500 to-rose-500" />
      <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-9">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-600">
            주거비 시뮬레이터
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            전세{' '}
            <span className="mx-0.5 inline-block rounded-md bg-slate-900 px-2 py-0.5 align-middle text-base font-bold text-[#f6f3ec]">
              vs
            </span>{' '}
            월세
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
            전세대출 이자와 보증금 기회비용까지 고려해 거주 기간 동안의 총 주거비용을 비교하세요.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* 입력 패널 */}
          <section className="h-fit space-y-6 rounded-xl border border-[#e7e1d3] bg-white p-6 shadow-[0_1px_3px_rgba(30,27,75,0.08)] lg:sticky lg:top-6">
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-indigo-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_JEONSE }} />
                전세 조건
              </h2>
              <label className="mb-2 block text-sm font-medium text-slate-700">전세 보증금</label>
              <MoneyInput
                value={inputs.jeonseDeposit}
                onChange={(v) => set({ jeonseDeposit: v })}
                min={10_000_000}
                max={2_000_000_000}
                step={10_000_000}
              />
            </div>

            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="text-sm font-medium text-slate-700">전세대출 이용</span>
                <Toggle on={inputs.loanEnabled} onClick={() => set({ loanEnabled: !inputs.loanEnabled })} />
              </label>
              {inputs.loanEnabled && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      대출 비율{' '}
                      <span className="text-xs text-slate-400">(대출금 {fmtKorean(r.loanAmount)})</span>
                    </label>
                    <NumberInput
                      value={inputs.loanRatioPct}
                      onChange={(v) => set({ loanRatioPct: v })}
                      min={0}
                      max={100}
                      step={5}
                      unit="%"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">전세대출 금리</label>
                    <NumberInput
                      value={inputs.loanRatePct}
                      onChange={(v) => set({ loanRatePct: v })}
                      min={0}
                      max={10}
                      step={0.1}
                      unit="%"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-5 border-t border-[#ece6d8] pt-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-rose-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_MONTHLY }} />
                월세 조건
              </h2>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">월세 보증금</label>
                <MoneyInput
                  value={inputs.monthlyDeposit}
                  onChange={(v) => set({ monthlyDeposit: v })}
                  min={0}
                  max={500_000_000}
                  step={5_000_000}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">월세액</label>
                <MoneyInput
                  value={inputs.monthlyRent}
                  onChange={(v) => set({ monthlyRent: v })}
                  min={0}
                  max={10_000_000}
                  step={50_000}
                />
              </div>
            </div>

            <div className="space-y-5 border-t border-[#ece6d8] pt-5">
              <h2 className="text-sm font-bold text-slate-700">공통 조건</h2>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  예상 거주 기간 <span className="text-xs text-slate-400">({r.months}개월)</span>
                </label>
                <NumberInput
                  value={inputs.years}
                  onChange={(v) => set({ years: v })}
                  min={1}
                  max={10}
                  step={1}
                  unit="년"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  전월세 전환율 <span className="text-xs text-slate-400">(연 기준)</span>
                </label>
                <NumberInput
                  value={inputs.conversionRatePct}
                  onChange={(v) => set({ conversionRatePct: v })}
                  min={0}
                  max={12}
                  step={0.1}
                  unit="%"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  예금/투자 수익률{' '}
                  <span className="text-xs text-slate-400">(보증금 기회비용 계산)</span>
                </label>
                <NumberInput
                  value={inputs.investRatePct}
                  onChange={(v) => set({ investRatePct: v })}
                  min={0}
                  max={15}
                  step={0.1}
                  unit="%"
                />
              </div>
            </div>
          </section>

          {/* 결과 패널 */}
          <section className="space-y-6">
            {/* 결론 카드 */}
            <div
              className={`rounded-2xl border p-6 ${
                r.winner === 'jeonse'
                  ? 'border-indigo-200 bg-indigo-50/80'
                  : r.winner === 'monthly'
                    ? 'border-rose-200 bg-rose-50/80'
                    : 'border-[#e7e1d3] bg-white'
              } shadow-[0_1px_3px_rgba(30,27,75,0.08)]`}
            >
              <p className="text-sm text-slate-500">
                {fmtMonths(r.months)} 거주 기준 총 주거비용 비교 결과
              </p>
              {r.winner === 'tie' ? (
                <p className="mt-2 text-2xl font-bold sm:text-3xl">두 조건의 비용이 거의 같습니다</p>
              ) : (
                <p className="mt-2 text-2xl font-bold sm:text-3xl">
                  <span className={r.winner === 'jeonse' ? 'text-indigo-700' : 'text-rose-600'}>
                    {winnerLabel}
                  </span>
                  가{' '}
                  <span className={r.winner === 'jeonse' ? 'text-indigo-700' : 'text-rose-600'}>
                    {fmtKorean(diffAbs)}
                  </span>{' '}
                  더 유리합니다
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                전세 총비용{' '}
                <span className="font-semibold tabular-nums text-slate-900">{fmt(r.jeonseTotal)}원</span>{' '}
                vs 월세 총비용{' '}
                <span className="font-semibold tabular-nums text-slate-900">{fmt(r.monthlyTotal)}원</span>
                {r.winner !== 'tie' && (
                  <>
                    {' '}
                    · 월 평균{' '}
                    <span className="font-semibold tabular-nums text-slate-900">
                      {fmt(diffAbs / r.months)}원
                    </span>
                    씩 차이
                  </>
                )}
              </p>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryCard
                label="전세 총 주거비용"
                value={`${fmt(r.jeonseTotal)}원`}
                sub={`월 평균 ${fmt(r.jeonseMonthlyAvg)}원`}
                accent
              />
              <SummaryCard
                label="월세 총 주거비용"
                value={`${fmt(r.monthlyTotal)}원`}
                sub={`월 평균 ${fmt(r.monthlyMonthlyAvg)}원`}
                warn
              />
              <SummaryCard
                label="총비용 차액"
                value={`${fmt(diffAbs)}원`}
                sub={r.winner === 'tie' ? '차이 없음' : `${winnerLabel} 우위`}
              />
              <SummaryCard
                label={inputs.loanEnabled ? '전세 자기자본' : '전세 보증금 (전액 자기자본)'}
                value={`${fmt(r.jeonseOwnCash)}원`}
                sub={inputs.loanEnabled ? `대출 ${fmtKorean(r.loanAmount)}` : undefined}
              />
            </div>

            {/* 누적 비용 차트 */}
            <div className="rounded-xl border border-[#e7e1d3] bg-white p-5 shadow-[0_1px_3px_rgba(30,27,75,0.08)]">
              <h2 className="mb-1 text-sm font-bold text-slate-800">기간별 누적 주거비용</h2>
              <p className="mb-4 text-xs text-slate-400">
                거주 기간이 길어질수록 누적 비용이 어떻게 벌어지는지 확인하세요.
              </p>
              <CumulativeChart series={r.series} />
            </div>

            {/* 비용 구성 분해 */}
            <div className="space-y-6 rounded-xl border border-[#e7e1d3] bg-white p-5 shadow-[0_1px_3px_rgba(30,27,75,0.08)]">
              <h2 className="text-sm font-bold text-slate-800">비용 구성 분해</h2>
              <BreakdownBar
                label="전세"
                total={r.jeonseTotal}
                maxTotal={maxTotal}
                segments={[
                  { name: '전세대출 이자', value: r.jeonseInterestTotal, color: '#4f46e5' },
                  { name: '자기자본 기회비용', value: r.jeonseOpportunityTotal, color: '#a5b4fc' },
                ]}
              />
              <BreakdownBar
                label="월세"
                total={r.monthlyTotal}
                maxTotal={maxTotal}
                segments={[
                  { name: '월세 총액', value: r.rentTotal, color: '#e11d48' },
                  { name: '보증금 기회비용', value: r.monthlyOpportunityTotal, color: '#fda4af' },
                ]}
              />
              <p className="text-xs leading-relaxed text-slate-400">
                기회비용은 보증금으로 묶인 돈을 연 {inputs.investRatePct}% 수익률(월복리)로 운용했을 때
                얻었을 수익입니다. 전세대출 이자는 이자만 납부(만기일시 상환) 기준입니다.
              </p>
            </div>

            {/* 전환율 환산 비교 */}
            <div className="rounded-xl border border-[#e7e1d3] bg-white p-5 shadow-[0_1px_3px_rgba(30,27,75,0.08)]">
              <h2 className="mb-1 text-sm font-bold text-slate-800">
                전월세 전환율 기준 환산 비교
              </h2>
              <p className="mb-4 text-xs text-slate-400">
                전환율 연 {inputs.conversionRatePct}% 기준으로 두 조건을 같은 단위로 환산한 값입니다.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#ece6d8] bg-[#faf8f1] p-4">
                  <p className="text-xs text-slate-500">월세 조건을 전세 보증금으로 환산하면</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-rose-600">
                    {fmtKorean(r.rentAsJeonse)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    실제 전세 보증금 {fmtKorean(inputs.jeonseDeposit)} 대비{' '}
                    <span className={`font-semibold ${conversionFavorsMonthly ? 'text-rose-600' : 'text-indigo-700'}`}>
                      {fmtKorean(Math.abs(r.rentAsJeonse - inputs.jeonseDeposit))}{' '}
                      {conversionFavorsMonthly ? '저렴' : '비쌈'}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-[#ece6d8] bg-[#faf8f1] p-4">
                  <p className="text-xs text-slate-500">전세 조건을 월세로 환산하면 (보증금 동일 기준)</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-indigo-700">
                    월 {fmt(r.jeonseAsRent)}원
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    실제 월세 {fmt(inputs.monthlyRent)}원 대비{' '}
                    <span
                      className={
                        r.jeonseAsRent > inputs.monthlyRent
                          ? 'font-semibold text-rose-600'
                          : 'font-semibold text-indigo-700'
                      }
                    >
                      {fmt(Math.abs(r.jeonseAsRent - inputs.monthlyRent))}원{' '}
                      {r.jeonseAsRent > inputs.monthlyRent ? '높음' : '낮음'}
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                전환율 기준으로는{' '}
                <span
                  className={
                    conversionFavorsMonthly
                      ? 'font-semibold text-rose-600'
                      : 'font-semibold text-indigo-700'
                  }
                >
                  {conversionFavorsMonthly ? '월세' : '전세'}
                </span>{' '}
                조건이 상대적으로 저렴한 셈입니다. 시장 전환율보다 높은 월세는 협상의 여지가 있을 수
                있습니다.
              </p>
            </div>

            <footer className="text-xs leading-relaxed text-slate-400">
              본 계산기는 단순 참고용입니다. 실제로는 대출 한도·우대금리·보증보험료·중개수수료·이사
              비용·세액공제(월세) 등 다양한 요소가 비용에 영향을 주며, 보증금 미반환 위험 등 금액으로
              환산하기 어려운 요인도 있습니다. 중요한 의사결정 전 반드시 금융기관과 전문가에게
              확인하세요.
            </footer>
          </section>
        </div>
      </main>
    </div>
  )
}
