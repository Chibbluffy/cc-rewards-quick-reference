import { useState } from 'react'
import { getGapAnalysis, getRateLabel, getCoverageLevel } from '../../utils/cardHelpers.js'
import CardDetail from '../cards/CardDetail.jsx'

const COVERAGE_LABELS = {
  excellent: { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  good: { label: 'Good', color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' },
  ok: { label: 'Okay', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  weak: { label: 'Weak', color: 'text-zinc-500', bg: 'bg-zinc-800/60', border: 'border-zinc-700/40' },
}

function GapRow({ item, rewardPrograms, onCardPress }) {
  const [showUpgrades, setShowUpgrades] = useState(false)
  const cov = COVERAGE_LABELS[item.coverageLevel]

  return (
    <div className={`bg-zinc-900 rounded-2xl border ${cov.border} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="text-xl shrink-0">{item.category.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-200">{item.category.name}</p>
          {item.bestCards.length > 0 ? (
            <p className="text-xs text-zinc-500 mt-0.5">
              Best: {item.bestCards[0]?.card?.name} — {item.topRate}{item.bestCards[0]?.isMultiplier ? 'x' : '%'}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 mt-0.5">No bonus from your cards</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${cov.bg} ${cov.border} ${cov.color}`}>
          {cov.label}
        </span>
      </div>

      {/* Your cards for this category */}
      {item.bestCards.length > 0 && (
        <div className="px-4 pb-2 space-y-1">
          {item.bestCards.map(({ card, ...rateInfo }) => (
            <button
              key={card.id}
              onClick={() => onCardPress(card)}
              className="w-full flex items-center justify-between py-1 active:opacity-70"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: card.color }} />
                <span className="text-xs text-zinc-400">{card.name}</span>
              </div>
              <span className={`text-xs font-bold tabular-nums ${COVERAGE_LABELS[getCoverageLevel(rateInfo.rate)].color}`}>
                {rateInfo.rate}{rateInfo.isMultiplier ? 'x' : '%'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Upgrade suggestions */}
      {item.suggestedUpgrades.length > 0 && (
        <div className="border-t border-zinc-800/60">
          <button
            onClick={() => setShowUpgrades(s => !s)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-zinc-500 active:text-zinc-300"
          >
            <span>{showUpgrades ? 'Hide' : 'Show'} upgrade suggestions ({item.suggestedUpgrades.length})</span>
            <span className="text-zinc-600">{showUpgrades ? '▲' : '▼'}</span>
          </button>
          {showUpgrades && (
            <div className="px-4 pb-3 space-y-1">
              {item.suggestedUpgrades.map(({ card, ...rateInfo }) => (
                <button
                  key={card.id}
                  onClick={() => onCardPress(card)}
                  className="w-full flex items-center justify-between py-1.5 active:opacity-70"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: card.color }}>
                      <span className="text-white text-[8px] font-bold">{card.issuer.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs text-zinc-300 truncate">{card.name}</p>
                      <p className="text-[10px] text-zinc-600">{card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/yr`}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ml-2 shrink-0 ${COVERAGE_LABELS[getCoverageLevel(rateInfo.rate)].color}`}>
                    {rateInfo.rate}{rateInfo.isMultiplier ? 'x' : '%'} ↑
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function GapsView({ ctx }) {
  const { cards, categories, rewardPrograms, ownedCardIds, userChoiceMap } = ctx
  const [detailCard, setDetailCard] = useState(null)

  const gaps = getGapAnalysis(cards, ownedCardIds, categories, userChoiceMap)

  const grouped = {
    weak: gaps.filter(g => g.coverageLevel === 'weak'),
    ok: gaps.filter(g => g.coverageLevel === 'ok'),
    good: gaps.filter(g => g.coverageLevel === 'good'),
    excellent: gaps.filter(g => g.coverageLevel === 'excellent'),
  }

  if (ownedCardIds.length === 0) {
    return (
      <div className="px-3 pt-8 text-center">
        <p className="text-3xl mb-3">📊</p>
        <p className="text-sm font-medium text-zinc-300 mb-1">No cards added</p>
        <p className="text-xs text-zinc-500">Add cards in <strong className="text-zinc-400">My Cards</strong> to see your coverage gaps</p>
      </div>
    )
  }

  return (
    <>
      {detailCard && (
        <CardDetail
          card={detailCard}
          rewardPrograms={rewardPrograms}
          categories={categories}
          onClose={() => setDetailCard(null)}
          userChoiceMap={userChoiceMap}
          setChoiceCategory={ctx.setChoiceCategory}
        />
      )}

      <div className="px-3 pt-3 pb-4 space-y-4">
        <p className="text-xs text-zinc-600 px-1">
          Showing coverage from your {ownedCardIds.length} card{ownedCardIds.length !== 1 ? 's' : ''}. Weak = under 2%, Excellent = 5%+.
        </p>

        {grouped.weak.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Weak Coverage</p>
            <div className="space-y-2">
              {grouped.weak.map(item => (
                <GapRow key={item.category.id} item={item} rewardPrograms={rewardPrograms} onCardPress={setDetailCard} />
              ))}
            </div>
          </div>
        )}

        {grouped.ok.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Okay Coverage (2%)</p>
            <div className="space-y-2">
              {grouped.ok.map(item => (
                <GapRow key={item.category.id} item={item} rewardPrograms={rewardPrograms} onCardPress={setDetailCard} />
              ))}
            </div>
          </div>
        )}

        {grouped.good.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Good Coverage (3–4%)</p>
            <div className="space-y-2">
              {grouped.good.map(item => (
                <GapRow key={item.category.id} item={item} rewardPrograms={rewardPrograms} onCardPress={setDetailCard} />
              ))}
            </div>
          </div>
        )}

        {grouped.excellent.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Excellent Coverage (5%+)</p>
            <div className="space-y-2">
              {grouped.excellent.map(item => (
                <GapRow key={item.category.id} item={item} rewardPrograms={rewardPrograms} onCardPress={setDetailCard} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
