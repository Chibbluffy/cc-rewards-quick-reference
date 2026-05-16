import { useState } from 'react'
import { Check, Plus, Info } from 'lucide-react'
import CardDetail from '../cards/CardDetail.jsx'
import BrowseView from './BrowseView.jsx'
import { getCurrentQuarterKey, getNextQuarterKey, getActiveRotatingDisplay, quarterLabel } from '../../utils/quarterHelpers.js'

function CardTile({ card, owned, onToggle, onDetail }) {
  return (
    <div className={`bg-zinc-900 rounded-2xl border overflow-hidden transition-colors ${owned ? 'border-emerald-500/40' : 'border-zinc-800/60'}`}>
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.color }}>
          <span className="text-white text-xs font-bold">{card.issuer.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">{card.name}</p>
          <p className="text-xs text-zinc-500">{card.issuer} · {card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/yr`}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onDetail(card)} className="text-zinc-600 active:text-zinc-300 p-1">
            <Info size={16} />
          </button>
          <button
            onClick={() => onToggle(card.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              owned ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            {owned ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChoicePicker({ label, selectedCatId, card, onSelect, locked = false }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-400 mb-1.5">{label}</p>
      {locked && selectedCatId && (
        <p className="text-[10px] text-zinc-600 mb-1.5 leading-snug">
          Quarter is active — changes here are for your records only. To officially change, use the {card.issuer} app.
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {card.choiceCategory.availableCategoryDisplay.map((displayLabel, i) => {
          const catId = card.choiceCategory.availableCategoryIds?.[i]
          const isSelected = catId && selectedCatId === catId
          return (
            <button
              key={i}
              onClick={() => !locked && catId && onSelect(catId)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                isSelected
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : locked
                    ? 'bg-zinc-800/50 border-zinc-800 text-zinc-600 cursor-default'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 active:bg-zinc-700'
              }`}
            >
              {displayLabel}
            </button>
          )
        })}
      </div>
      {!selectedCatId && (
        <p className="text-xs text-amber-400/80 mt-1.5">
          {locked ? 'No category set — earning base rates this quarter' : 'No category selected yet'}
        </p>
      )}
    </div>
  )
}

function RotatingManager({ card, userChoiceMap, setChoiceCategory, isActivated, setActivation }) {
  const currentQKey = getCurrentQuarterKey()
  const nextQKey = getNextQuarterKey()
  const rotatingQ = getActiveRotatingDisplay(card)
  const activated = isActivated(card.id, currentQKey)

  const currentChoice = card.choiceCategory ? (userChoiceMap[card.id] || {})[currentQKey] || null : null
  const nextChoice = card.choiceCategory ? (userChoiceMap[card.id] || {})[nextQKey] || null : null

  if (!card.rotating && !card.choiceCategory) return null

  return (
    <div className="mx-3 mb-3 bg-zinc-800/40 rounded-xl p-3 space-y-3 border border-zinc-700/30">

      {/* Rotating quarterly categories (Discover, Chase Freedom Flex) */}
      {card.rotating && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 mb-1">
            {quarterLabel(currentQKey)} — 5% Categories
          </p>
          {rotatingQ?.announced ? (
            <>
              <p className="text-xs text-zinc-300 mb-2">{rotatingQ.displayCategories?.join(' · ')}</p>
              {card.rotating.activationRequired && (
                <button
                  onClick={() => setActivation(card.id, currentQKey, !activated)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    activated
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                  }`}
                >
                  {activated && <Check size={12} strokeWidth={2.5} />}
                  {activated ? 'Marked as activated' : 'Mark as activated'}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-600 italic">Categories not yet announced for this quarter</p>
          )}
        </div>
      )}

      {/* Choice category — current quarter (locked display) */}
      {card.choiceCategory && (
        <>
          <div className="border-t border-zinc-700/30 pt-3">
            <ChoicePicker
              label={`${quarterLabel(currentQKey)} — Your 5% Category (current)`}
              selectedCatId={currentChoice}
              card={card}
              onSelect={catId => setChoiceCategory(card.id, currentQKey, catId)}
              locked={true}
            />
          </div>

          {/* Next quarter (editable) */}
          <div className="border-t border-zinc-700/30 pt-3">
            <ChoicePicker
              label={`${quarterLabel(nextQKey)} — Your 5% Category (upcoming)`}
              selectedCatId={nextChoice}
              card={card}
              onSelect={catId => setChoiceCategory(card.id, nextQKey, catId)}
              locked={false}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default function MyCardsView({ ctx }) {
  const { cards, categories, rewardPrograms, ownedCardIds, userChoiceMap, toggleCard, setChoiceCategory, isActivated, setActivation } = ctx
  const [detailCard, setDetailCard] = useState(null)
  const [subTab, setSubTab] = useState('mine')

  const owned = cards.filter(c => ownedCardIds.includes(c.id))

  return (
    <>
      {detailCard && (
        <CardDetail
          card={detailCard}
          rewardPrograms={rewardPrograms}
          categories={categories}
          onClose={() => setDetailCard(null)}
          userChoiceMap={userChoiceMap}
          setChoiceCategory={setChoiceCategory}
        />
      )}

      {/* Sub-tab switcher */}
      <div className="flex gap-1 px-3 pt-3 pb-0">
        {[{ id: 'mine', label: `My Cards (${owned.length})` }, { id: 'browse', label: 'Browse All' }].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              subTab === t.id
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'mine' ? (
        <div className="px-3 pt-3 pb-4">
          {owned.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl px-4 py-5 text-center">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-sm font-medium text-zinc-300 mb-1">No cards added yet</p>
              <p className="text-xs text-zinc-500">Switch to <strong className="text-zinc-400">Browse All</strong> to find and add your cards</p>
            </div>
          ) : (
            <div className="space-y-2">
              {owned.map(card => (
                <div key={card.id} className="bg-zinc-900 rounded-2xl border border-emerald-500/40 overflow-hidden">
                  <CardTile card={card} owned onToggle={toggleCard} onDetail={setDetailCard} />
                  <RotatingManager
                    card={card}
                    userChoiceMap={userChoiceMap}
                    setChoiceCategory={setChoiceCategory}
                    isActivated={isActivated}
                    setActivation={setActivation}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <BrowseView ctx={ctx} />
      )}
    </>
  )
}
