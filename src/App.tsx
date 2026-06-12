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
          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 pr-12 text-right text-lg font-semibold tabular-nums text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
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
      <p className="mt-1 text-right text-xs text-emerald-400/90">{fmtKorean(value)}</p>
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
          className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-4 py-3 pr-12 text-right text-lg font-semibold tabular-nums text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
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
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-emerald-600' : 'bg-zinc-700'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

/* ---------- 차트 ---------- */

const COLOR_JEONSE = '#10b981'
const COLOR_MONTHLY = '#f59e0b'

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
            stroke="#3f3f46"
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
            stroke="#3f3f46"
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
        <span className="flex items-center gap-1.5 text-zinc-400">
          <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: COLOR_JEONSE }} />
          전세 누적 비용
        </span>
        <span className="flex items-center gap-1.5 text-zinc-400">
          <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: COLOR_MONTHLY }} />
          월세 누적 비용
        </span>
        <span className="ml-auto text-zinc-600">입주 → {fmtMonths(months)} 후</span>
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
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-zinc-100">{fmtKorean(total)}</span>
      </div>
      <div className="h-7 w-full overflow-hidden rounded-lg bg-zinc-800/60">
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
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        {segments.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.name} <span className="tabular-nums text-zinc-400">{fmtKorean(s.value)}</span>
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
      className={`rounded-2xl border p-4 ${
        accent
          ? 'border-emerald-700/50 bg-emerald-500/10'
          : warn
            ? 'border-amber-700/50 bg-amber-500/10'
            : 'border-zinc-800 bg-zinc-900/60'
      }`}
    >
      <p className="text-xs text-zinc-400">{label}</p>
      <p
        className={`mt-1.5 break-words text-base font-bold tabular-nums sm:text-lg ${
          accent ? 'text-emerald-300' : warn ? 'text-amber-300' : 'text-zinc-100'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-500/10 to-transparent" />
      <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            전세 <span className="text-zinc-500">vs</span> 월세
            <span className="text-emerald-400">.</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            전세대출 이자와 보증금 기회비용까지 고려해 거주 기간 동안의 총 주거비용을 비교하세요.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* 입력 패널 */}
          <section className="h-fit space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur lg:sticky lg:top-6">
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_JEONSE }} />
                전세 조건
              </h2>
              <label className="mb-2 block text-sm font-medium text-zinc-300">전세 보증금</label>
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
                <span className="text-sm font-medium text-zinc-300">전세대출 이용</span>
                <Toggle on={inputs.loanEnabled} onClick={() => set({ loanEnabled: !inputs.loanEnabled })} />
              </label>
              {inputs.loanEnabled && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      대출 비율{' '}
                      <span className="text-xs text-zinc-500">(대출금 {fmtKorean(r.loanAmount)})</span>
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
                    <label className="mb-2 block text-sm font-medium text-zinc-300">전세대출 금리</label>
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

            <div className="space-y-5 border-t border-zinc-800 pt-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_MONTHLY }} />
                월세 조건
              </h2>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">월세 보증금</label>
                <MoneyInput
                  value={inputs.monthlyDeposit}
                  onChange={(v) => set({ monthlyDeposit: v })}
                  min={0}
                  max={500_000_000}
                  step={5_000_000}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">월세액</label>
                <MoneyInput
                  value={inputs.monthlyRent}
                  onChange={(v) => set({ monthlyRent: v })}
                  min={0}
                  max={10_000_000}
                  step={50_000}
                />
              </div>
            </div>

            <div className="space-y-5 border-t border-zinc-800 pt-5">
              <h2 className="text-sm font-semibold text-zinc-300">공통 조건</h2>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  예상 거주 기간 <span className="text-xs text-zinc-500">({r.months}개월)</span>
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
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  전월세 전환율 <span className="text-xs text-zinc-500">(연 기준)</span>
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
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  예금/투자 수익률{' '}
                  <span className="text-xs text-zinc-500">(보증금 기회비용 계산)</span>
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
                  ? 'border-emerald-600/60 bg-emerald-500/10'
                  : r.winner === 'monthly'
                    ? 'border-amber-600/60 bg-amber-500/10'
                    : 'border-zinc-700 bg-zinc-900/60'
              }`}
            >
              <p className="text-sm text-zinc-400">
                {fmtMonths(r.months)} 거주 기준 총 주거비용 비교 결과
              </p>
              {r.winner === 'tie' ? (
                <p className="mt-2 text-2xl font-bold sm:text-3xl">두 조건의 비용이 거의 같습니다</p>
              ) : (
                <p className="mt-2 text-2xl font-bold sm:text-3xl">
                  <span className={r.winner === 'jeonse' ? 'text-emerald-300' : 'text-amber-300'}>
                    {winnerLabel}
                  </span>
                  가{' '}
                  <span className={r.winner === 'jeonse' ? 'text-emerald-300' : 'text-amber-300'}>
                    {fmtKorean(diffAbs)}
                  </span>{' '}
                  더 유리합니다
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                전세 총비용{' '}
                <span className="font-semibold tabular-nums text-zinc-200">{fmt(r.jeonseTotal)}원</span>{' '}
                vs 월세 총비용{' '}
                <span className="font-semibold tabular-nums text-zinc-200">{fmt(r.monthlyTotal)}원</span>
                {r.winner !== 'tie' && (
                  <>
                    {' '}
                    · 월 평균{' '}
                    <span className="font-semibold tabular-nums text-zinc-200">
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
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="mb-1 text-sm font-semibold text-zinc-300">기간별 누적 주거비용</h2>
              <p className="mb-4 text-xs text-zinc-500">
                거주 기간이 길어질수록 누적 비용이 어떻게 벌어지는지 확인하세요.
              </p>
              <CumulativeChart series={r.series} />
            </div>

            {/* 비용 구성 분해 */}
            <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-sm font-semibold text-zinc-300">비용 구성 분해</h2>
              <BreakdownBar
                label="전세"
                total={r.jeonseTotal}
                maxTotal={maxTotal}
                segments={[
                  { name: '전세대출 이자', value: r.jeonseInterestTotal, color: '#10b981' },
                  { name: '자기자본 기회비용', value: r.jeonseOpportunityTotal, color: '#34d399' },
                ]}
              />
              <BreakdownBar
                label="월세"
                total={r.monthlyTotal}
                maxTotal={maxTotal}
                segments={[
                  { name: '월세 총액', value: r.rentTotal, color: '#f59e0b' },
                  { name: '보증금 기회비용', value: r.monthlyOpportunityTotal, color: '#fbbf24' },
                ]}
              />
              <p className="text-xs leading-relaxed text-zinc-500">
                기회비용은 보증금으로 묶인 돈을 연 {inputs.investRatePct}% 수익률(월복리)로 운용했을 때
                얻었을 수익입니다. 전세대출 이자는 이자만 납부(만기일시 상환) 기준입니다.
              </p>
            </div>

            {/* 전환율 환산 비교 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="mb-1 text-sm font-semibold text-zinc-300">
                전월세 전환율 기준 환산 비교
              </h2>
              <p className="mb-4 text-xs text-zinc-500">
                전환율 연 {inputs.conversionRatePct}% 기준으로 두 조건을 같은 단위로 환산한 값입니다.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-xs text-zinc-400">월세 조건을 전세 보증금으로 환산하면</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-amber-300">
                    {fmtKorean(r.rentAsJeonse)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    실제 전세 보증금 {fmtKorean(inputs.jeonseDeposit)} 대비{' '}
                    <span className={conversionFavorsMonthly ? 'text-amber-300' : 'text-emerald-300'}>
                      {fmtKorean(Math.abs(r.rentAsJeonse - inputs.jeonseDeposit))}{' '}
                      {conversionFavorsMonthly ? '저렴' : '비쌈'}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="text-xs text-zinc-400">전세 조건을 월세로 환산하면 (보증금 동일 기준)</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-emerald-300">
                    월 {fmt(r.jeonseAsRent)}원
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    실제 월세 {fmt(inputs.monthlyRent)}원 대비{' '}
                    <span
                      className={
                        r.jeonseAsRent > inputs.monthlyRent ? 'text-amber-300' : 'text-emerald-300'
                      }
                    >
                      {fmt(Math.abs(r.jeonseAsRent - inputs.monthlyRent))}원{' '}
                      {r.jeonseAsRent > inputs.monthlyRent ? '높음' : '낮음'}
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                전환율 기준으로는{' '}
                <span
                  className={
                    conversionFavorsMonthly
                      ? 'font-semibold text-amber-300'
                      : 'font-semibold text-emerald-300'
                  }
                >
                  {conversionFavorsMonthly ? '월세' : '전세'}
                </span>{' '}
                조건이 상대적으로 저렴한 셈입니다. 시장 전환율보다 높은 월세는 협상의 여지가 있을 수
                있습니다.
              </p>
            </div>

            <footer className="text-xs leading-relaxed text-zinc-600">
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
