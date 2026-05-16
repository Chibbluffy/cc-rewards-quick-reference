import { useState } from 'react'
import { Check, Plus, Info, Filter } from 'lucide-react'
import CardDetail from '../cards/CardDetail.jsx'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'cashback', label: 'Cash Back' },
  { id: 'points', label: 'Points/Miles' },
  { id: 'no-fee', label: 'No Annual Fee' },
  { id: 'fee', label: 'Has Annual Fee' },
]

const ISSUERS = ['Chase', 'American Express', 'Capital One', 'Citi', 'Wells Fargo', 'Discover', 'Bank of America', 'US Bank', 'Other']

function CardRow({ card, owned, onToggle, onDetail }) {
  const bestRates = card.earningRates
    .filter(r => r.categoryId !== 'everything' && r.rate > 1)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)

  return (
    <div className={`bg-zinc-900 rounded-2xl border overflow-hidden transition-colors ${owned ? 'border-emerald-500/40' : 'border-zinc-800/60'}`}>
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.color }}>
          <span className="text-white text-xs font-bold">{card.issuer.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-zinc-100 truncate">{card.name}</p>
            {owned && (
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full shrink-0">Owned</span>
            )}
          </div>
          <p className="text-xs text-zinc-500">
            {card.issuer} · {card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/yr`}
            {card.foreignTransactionFee > 0 && <span className="text-amber-500"> · {card.foreignTransactionFee}% foreign transaction fee</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onDetail(card)} className="text-zinc-600 active:text-zinc-300 p-1.5">
            <Info size={16} />
          </button>
          <button
            onClick={() => onToggle(card.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              owned ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            {owned ? <Check size={15} strokeWidth={2.5} /> : <Plus size={15} />}
          </button>
        </div>
      </div>

      {/* Key rates */}
      {(bestRates.length > 0 || card.rotating || card.choiceCategory) && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {card.rotating && (
            <span className="text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded-full">
              {card.rotating.rate}% rotating
            </span>
          )}
          {card.choiceCategory && (
            <span className="text-[10px] font-medium bg-teal-500/15 text-teal-300 border border-teal-500/25 px-2 py-0.5 rounded-full">
              {card.choiceCategory.rate}% choice
            </span>
          )}
          {bestRates.map((r, i) => (
            <span key={i} className="text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded-full">
              {r.rate}{r.isMultiplier ? 'x' : '%'} {r.categoryId}
            </span>
          ))}
          <span className="text-[10px] font-medium bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
            {card.baseRate}{card.earningRates.find(r => r.categoryId === 'everything')?.isMultiplier ? 'x' : '%'} base
          </span>
        </div>
      )}
    </div>
  )
}

export default function BrowseView({ ctx }) {
  const { cards, categories, rewardPrograms, ownedCardIds, toggleCard } = ctx
  const [detailCard, setDetailCard] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeIssuer, setActiveIssuer] = useState('all')

  const filtered = cards.filter(card => {
    const filterOk = activeFilter === 'all'
      || (activeFilter === 'cashback' && card.type === 'cashback')
      || (activeFilter === 'points' && (card.type === 'points' || card.type === 'miles'))
      || (activeFilter === 'no-fee' && card.annualFee === 0)
      || (activeFilter === 'fee' && card.annualFee > 0)

    const issuerOk = activeIssuer === 'all'
      || (activeIssuer === 'Other' && !ISSUERS.slice(0, -1).includes(card.issuer))
      || card.issuer === activeIssuer

    return filterOk && issuerOk
  })

  return (
    <>
      {detailCard && (
        <CardDetail
          card={detailCard}
          rewardPrograms={rewardPrograms}
          categories={categories}
          onClose={() => setDetailCard(null)}
          userChoiceMap={ctx.userChoiceMap}
          setChoiceCategory={ctx.setChoiceCategory}
        />
      )}

      <div className="pt-3">
        {/* Type filter chips */}
        <div className="flex gap-2 px-3 pb-2 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === f.id
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Issuer filter chips */}
        <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveIssuer('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs border transition-colors ${
              activeIssuer === 'all' ? 'bg-zinc-600 border-zinc-600 text-zinc-100' : 'bg-transparent border-zinc-700 text-zinc-500'
            }`}
          >
            All issuers
          </button>
          {ISSUERS.map(issuer => (
            <button
              key={issuer}
              onClick={() => setActiveIssuer(issuer)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs border transition-colors ${
                activeIssuer === issuer ? 'bg-zinc-600 border-zinc-600 text-zinc-100' : 'bg-transparent border-zinc-700 text-zinc-500'
              }`}
            >
              {issuer}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="px-3 space-y-2 pb-4">
          <p className="text-xs text-zinc-600 px-1">{filtered.length} cards</p>
          {filtered.map(card => (
            <CardRow
              key={card.id}
              card={card}
              owned={ownedCardIds.includes(card.id)}
              onToggle={toggleCard}
              onDetail={setDetailCard}
            />
          ))}
        </div>
      </div>
    </>
  )
}
