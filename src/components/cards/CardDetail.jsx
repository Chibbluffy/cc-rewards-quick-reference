import { X, ExternalLink, AlertTriangle, Info } from 'lucide-react'
import { getCoverageLevel } from '../../utils/cardHelpers.js'
import { getCurrentQuarterKey, getNextQuarterKey, getActiveRotatingDisplay, quarterLabel } from '../../utils/quarterHelpers.js'

const RATE_COLORS = {
  excellent: 'text-emerald-400',
  good: 'text-teal-400',
  ok: 'text-blue-400',
  weak: 'text-zinc-500',
}

function RateRow({ label, rate, isMultiplier, notes = [], cap, capPeriod, isHighlight }) {
  const level = getCoverageLevel(rate)
  const color = RATE_COLORS[level]
  return (
    <div className={`py-2.5 border-b border-zinc-800/60 last:border-0 ${isHighlight ? 'bg-zinc-800/30 -mx-4 px-4' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${color}`}>
          {rate}{isMultiplier ? 'x' : '%'}
        </span>
      </div>
      {cap && (
        <p className="text-xs text-zinc-500 mt-0.5">
          Cap: ${cap.toLocaleString()}/{capPeriod}
        </p>
      )}
      {notes.map((n, i) => (
        <p key={i} className={`text-xs mt-0.5 ${n.startsWith('⚠️') ? 'text-amber-400' : 'text-zinc-500'}`}>
          {n}
        </p>
      ))}
    </div>
  )
}

export default function CardDetail({ card, rewardPrograms, categories, onClose, userChoiceMap, setChoiceCategory }) {
  const prog = rewardPrograms[card.rewardsCurrency]
  const currentQKey = getCurrentQuarterKey()
  const nextQKey = getNextQuarterKey()
  const rotatingQuarter = getActiveRotatingDisplay(card)
  const choiceCat = card.choiceCategory
  const currentChoice = choiceCat ? (userChoiceMap?.[card.id] || {})[currentQKey] || null : null
  const nextChoice = choiceCat ? (userChoiceMap?.[card.id] || {})[nextQKey] || null : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-zinc-800"
        style={{ backgroundColor: card.color + '22' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.color }}>
          <span className="text-white text-xs font-bold">{card.issuer.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-zinc-100 leading-tight">{card.name}</h2>
          <p className="text-xs text-zinc-400">{card.issuer} · {card.network}</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 active:text-zinc-300 p-1">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-8">
        {/* Key stats */}
        <div className="grid grid-cols-3 divide-x divide-zinc-800 border-b border-zinc-800">
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Annual Fee</p>
            <p className="text-sm font-semibold text-zinc-100">
              {card.annualFee === 0 ? 'None' : `$${card.annualFee}`}
            </p>
            {card.effectiveAnnualFee !== null && (
              <p className="text-[10px] text-zinc-500">${card.effectiveAnnualFee} w/ credits</p>
            )}
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Foreign Transaction Fee</p>
            <p className={`text-sm font-semibold ${card.foreignTransactionFee > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {card.foreignTransactionFee > 0 ? `${card.foreignTransactionFee}%` : 'None'}
            </p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-zinc-500 mb-0.5">Rewards</p>
            <p className="text-xs font-semibold text-zinc-200 leading-tight">{prog?.name || card.rewardsCurrency}</p>
          </div>
        </div>

        {/* Annual credits */}
        {card.credits.length > 0 && (
          <div className="px-4 pt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Annual Credits</p>
            {card.credits.map((credit, i) => (
              <div key={i} className="flex justify-between items-start py-2 border-b border-zinc-800/60 last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">{credit.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{credit.description}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 ml-3 shrink-0">
                  {typeof credit.amount === 'number' && credit.amount > 0 ? `$${credit.amount}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Rotating categories */}
        {card.rotating && (
          <div className="px-4 pt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Rotating 5% Categories
            </p>
            {card.rotating.activationRequired && (
              <div className="flex gap-2 items-start bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 mb-3">
                <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-300">{card.rotating.activationDeadlineNote}</p>
              </div>
            )}
            {Object.entries(card.rotating.quarters).map(([key, q]) => (
              <div key={key} className={`py-2.5 border-b border-zinc-800/60 last:border-0 ${key === currentQKey ? 'bg-zinc-800/30 -mx-4 px-4' : ''}`}>
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-zinc-300">{q.period}</p>
                  {key === currentQKey && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">NOW</span>
                  )}
                </div>
                {q.announced ? (
                  <p className="text-xs text-zinc-400 mt-0.5">{q.displayCategories.join(' · ')}</p>
                ) : (
                  <p className="text-xs text-zinc-600 mt-0.5 italic">Not yet announced</p>
                )}
                <p className="text-xs text-teal-400 mt-0.5">{card.rotating.rate}% (up to ${card.rotating.cap?.toLocaleString()}/{card.rotating.capPeriod})</p>
              </div>
            ))}
          </div>
        )}

        {/* Choice category — current quarter (locked) */}
        {choiceCat && (
          <div className="px-4 pt-4 space-y-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {choiceCat.rate}% Bonus Category Selection
            </p>
            <p className="text-xs text-zinc-500 leading-snug">{choiceCat.selectionDeadlineNote}</p>
            <p className="text-xs text-zinc-600">Cap: ${choiceCat.cap?.toLocaleString()}/{choiceCat.capPeriod}, then {choiceCat.afterCapRate}%</p>

            {/* Current quarter */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-2">
                {quarterLabel(currentQKey)} — Current quarter
              </p>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {choiceCat.availableCategoryDisplay.map((label, i) => {
                  const catId = choiceCat.availableCategoryIds?.[i]
                  const isSelected = catId && currentChoice === catId
                  return (
                    <button
                      key={i}
                      onClick={() => catId && setChoiceCategory?.(card.id, currentQKey, catId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-zinc-800/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {!currentChoice && (
                <p className="text-xs text-amber-400/80">No category set — earning base rates only this quarter</p>
              )}
              {currentChoice && (
                <p className="text-[10px] text-zinc-600 mt-0.5">Quarter is active — changes here are for your records only. Use the {card.issuer} app to officially change.</p>
              )}
            </div>

            {/* Next quarter */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 mb-2">
                {quarterLabel(nextQKey)} — Next quarter
              </p>
              <div className="flex flex-wrap gap-1.5">
                {choiceCat.availableCategoryDisplay.map((label, i) => {
                  const catId = choiceCat.availableCategoryIds?.[i]
                  const isSelected = catId && nextChoice === catId
                  return (
                    <button
                      key={i}
                      onClick={() => catId && setChoiceCategory?.(card.id, nextQKey, catId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {!nextChoice && (
                <p className="text-xs text-zinc-600 mt-1">Not yet selected for next quarter</p>
              )}
            </div>
          </div>
        )}

        {/* Fixed earning rates */}
        <div className="px-4 pt-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Earning Rates</p>
          {card.earningRates.map((r, i) => {
            const cat = categories.find(c => c.id === r.categoryId)
            return (
              <RateRow
                key={i}
                label={`${cat?.icon || ''} ${cat?.name || r.categoryId}`}
                rate={r.rate}
                isMultiplier={r.isMultiplier}
                notes={r.notes}
                cap={r.cap}
                capPeriod={r.capPeriod}
              />
            )
          })}
        </div>

        {/* Membership */}
        {card.membershipRequired && (
          <div className="px-4 pt-4">
            <div className="flex gap-2 items-start bg-zinc-800/60 rounded-xl px-3 py-2.5">
              <Info size={13} className="text-zinc-400 mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-400 leading-snug">{card.membershipDetails}</p>
            </div>
          </div>
        )}

        {/* Signup bonus */}
        {card.signupBonus && (
          <div className="px-4 pt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Welcome Bonus</p>
            <p className="text-sm text-zinc-300 leading-snug">{card.signupBonus.description}</p>
          </div>
        )}

        {/* Footer links */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <p className="text-[10px] text-zinc-600">Last verified: {card.lastUpdated}</p>
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-500 active:text-emerald-300"
          >
            Official page <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}
