import { useState, useRef, useCallback } from 'react'
import { ChevronRight, ChevronUp, Info, GripVertical, ListOrdered } from 'lucide-react'
import { getBestCardsForCategory, splitByRewardType, getRateLabel, getCoverageLevel, getCardShortName } from '../../utils/cardHelpers.js'
import CardDetail from '../cards/CardDetail.jsx'

const COVERAGE_COLORS = {
  excellent: 'text-emerald-400',
  good:      'text-teal-400',
  ok:        'text-blue-400',
  weak:      'text-zinc-500',
}

// ─── Drag-to-reorder hook ────────────────────────────────────────────────────
// Position-based: find which row center the pointer is closest to, move there.
// No delta tracking — no accumulated error, no runaway jumps.
function useDragReorder(setOrder) {
  const listRef = useRef(null)
  const drag = useRef(null) // { index }
  const [draggingIndex, setDraggingIndex] = useState(null)

  const onGripPointerDown = useCallback((e, index) => {
    e.preventDefault()
    e.stopPropagation()

    drag.current = { index }
    setDraggingIndex(index)

    function onMove(ev) {
      if (!drag.current || !listRef.current) return
      const { index: fromIdx } = drag.current
      const rows = Array.from(listRef.current.children)
      if (!rows.length) return

      // Find the row whose center Y is closest to the pointer
      const y = ev.clientY
      let toIdx = fromIdx
      let minDist = Infinity
      rows.forEach((row, i) => {
        const rect = row.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        const dist = Math.abs(y - centerY)
        if (dist < minDist) { minDist = dist; toIdx = i }
      })

      if (toIdx === fromIdx) return

      setOrder(prev => {
        const next = [...prev]
        const [item] = next.splice(fromIdx, 1)
        next.splice(toIdx, 0, item)
        return next
      })
      drag.current = { index: toIdx }
      setDraggingIndex(toIdx)
    }

    function onUp() {
      drag.current = null
      setDraggingIndex(null)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [setOrder])

  return { listRef, onGripPointerDown, draggingIndex }
}

// ─── Chips ───────────────────────────────────────────────────────────────────
function RateChip({ entry, rewardPrograms, isPoints }) {
  if (!entry) return null
  const { card, ...rateInfo } = entry
  const label = getRateLabel({ ...rateInfo, card }, rewardPrograms)
  const level = getCoverageLevel(rateInfo.rate)
  const isFallback = rateInfo.isFallback
  const shortName = getCardShortName(card)

  const bg = isFallback
    ? 'bg-zinc-800/80'
    : isPoints ? 'bg-violet-500/15' : 'bg-emerald-500/12'

  const rateColor = isFallback
    ? 'text-zinc-600'
    : isPoints ? 'text-violet-300' : COVERAGE_COLORS[level]

  return (
    <span className={`inline-flex flex-col items-start px-2 py-1 rounded-lg ${bg}`}>
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
        <span className={`text-xs font-bold tabular-nums ${rateColor}`}>{label}</span>
      </span>
      <span className="text-[10px] text-zinc-500 pl-2.5 leading-tight whitespace-nowrap">{shortName}</span>
    </span>
  )
}

// ─── Expanded bucket list ────────────────────────────────────────────────────
function BucketList({ entries, rewardPrograms, onCardPress }) {
  return (
    <div className="space-y-0.5">
      {entries.map(({ card, ...rateInfo }) => {
        const label = getRateLabel({ ...rateInfo, card }, rewardPrograms)
        const level = getCoverageLevel(rateInfo.rate)
        return (
          <button
            key={card.id}
            onClick={() => onCardPress(card)}
            className="w-full flex items-center justify-between py-1.5 active:opacity-70"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
              <span className="text-sm text-zinc-300 truncate">{card.name}</span>
              {rateInfo.requiresPortal && (
                <span className="text-[10px] text-zinc-600 shrink-0">via {rateInfo.portalName}</span>
              )}
              {rateInfo.isRotating && (
                <span className="text-[10px] text-amber-500 shrink-0">rotating</span>
              )}
              {rateInfo.isChoice && (
                <span className="text-[10px] text-teal-500 shrink-0">your pick</span>
              )}
            </div>
            <span className={`text-sm font-bold tabular-nums ml-2 shrink-0 ${COVERAGE_COLORS[level]}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Single category row ─────────────────────────────────────────────────────
function CategoryRow({
  category, cards, ownedCardIds, rewardPrograms, userChoiceMap,
  onCardPress, editMode, onGripPointerDown, index, isDragging,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const allRated = getBestCardsForCategory(cards, ownedCardIds, category.id, userChoiceMap)
  const { cash, points } = splitByRewardType(allRated)

  const topPoints = points[0] ?? null
  const topCash   = cash[0]   ?? null
  const hasBonus  = (topPoints && !topPoints.isFallback) || (topCash && !topCash.isFallback)
  const hasNotes  = category.notes.length > 0

  // In edit mode, never expand — just show the reorderable row
  const showExpand = !editMode && expanded

  return (
    <div
      data-row
      className={`rounded-xl border transition-all ${
        isDragging
          ? 'bg-zinc-700 border-zinc-500 shadow-lg scale-[1.01] z-10 relative'
          : hasBonus
            ? 'bg-zinc-900 border-zinc-800/60'
            : 'bg-zinc-900/60 border-zinc-800/30'
      }`}
    >
      {/* Compact row */}
      <div className="flex items-center gap-1.5 px-2 py-2">

        {/* Drag handle — only in edit mode */}
        {editMode && (
          <button
            className="text-zinc-500 active:text-zinc-300 cursor-grab active:cursor-grabbing px-1 py-2 touch-none"
            onPointerDown={e => onGripPointerDown(e, index)}
          >
            <GripVertical size={16} />
          </button>
        )}

        {/* Main tap area — expand/collapse (disabled in edit mode) */}
        <button
          className={`flex items-center gap-2 flex-1 min-w-0 ${editMode ? 'cursor-default' : 'active:opacity-70'}`}
          onClick={() => !editMode && setExpanded(e => !e)}
          disabled={editMode}
        >
          <span className={`text-base shrink-0 ${!hasBonus ? 'opacity-40' : ''}`}>{category.icon}</span>
          <span className={`text-sm font-medium flex-1 text-left truncate ${hasBonus ? 'text-zinc-200' : 'text-zinc-500'}`}>
            {category.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {topPoints && <RateChip entry={topPoints} rewardPrograms={rewardPrograms} isPoints />}
            {topCash   && <RateChip entry={topCash}   rewardPrograms={rewardPrograms} isPoints={false} />}
            {!topPoints && !topCash && <span className="text-xs text-zinc-700">—</span>}
          </div>
        </button>

        {/* Info + expand icons — hidden in edit mode */}
        {!editMode && (
          <>
            {hasNotes && (
              <button
                onClick={() => setShowInfo(s => !s)}
                className="text-zinc-700 active:text-zinc-400 shrink-0 p-0.5"
              >
                <Info size={13} />
              </button>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-zinc-700 active:text-zinc-400 shrink-0"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
            </button>
          </>
        )}
      </div>

      {/* Category notes */}
      {!editMode && showInfo && hasNotes && (
        <div className="mx-3 mb-2 bg-zinc-800/50 rounded-lg px-3 py-2">
          {category.notes.map((n, i) => (
            <p key={i} className="text-xs text-zinc-400 leading-snug">{n}</p>
          ))}
        </div>
      )}

      {/* Expanded detail */}
      {showExpand && (
        <div className="px-3 pb-3 pt-1 border-t border-zinc-800/60 space-y-3">
          {points.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">Points / Miles</p>
              <BucketList entries={points} rewardPrograms={rewardPrograms} onCardPress={onCardPress} />
            </div>
          )}
          {cash.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">Cash Back</p>
              <BucketList entries={cash} rewardPrograms={rewardPrograms} onCardPress={onCardPress} />
            </div>
          )}
          {allRated.length === 0 && (
            <p className="text-xs text-zinc-700">No owned cards have this category</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Search results ──────────────────────────────────────────────────────────
function SearchResults({ searchResults, cards, categories, rewardPrograms, ownedCardIds, userChoiceMap, onCardPress }) {
  const { cards: matchedCards, categories: matchedCategories } = searchResults
  return (
    <div className="px-3 pt-3 space-y-4">
      {matchedCards.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Cards</p>
          <div className="space-y-1.5">
            {matchedCards.map(card => (
              <button
                key={card.id}
                onClick={() => onCardPress(card)}
                className="w-full bg-zinc-900 rounded-xl border border-zinc-800/60 px-4 py-3 flex items-center gap-3 active:bg-zinc-800"
              >
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: card.color }}>
                  <span className="text-white text-[10px] font-bold">{card.issuer.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{card.name}</p>
                  <p className="text-xs text-zinc-500">{card.issuer} · {card.annualFee === 0 ? 'No annual fee' : `$${card.annualFee}/yr`}</p>
                </div>
                {ownedCardIds.includes(card.id) && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full shrink-0">Owned</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {matchedCategories.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Categories</p>
          <div className="space-y-1.5">
            {matchedCategories.map(cat => (
              <CategoryRow
                key={cat.id}
                category={cat}
                cards={cards}
                ownedCardIds={ownedCardIds}
                rewardPrograms={rewardPrograms}
                userChoiceMap={userChoiceMap}
                onCardPress={onCardPress}
                editMode={false}
                onGripPointerDown={() => {}}
                index={0}
                isDragging={false}
              />
            ))}
          </div>
        </div>
      )}
      {matchedCards.length === 0 && matchedCategories.length === 0 && (
        <p className="text-center text-zinc-600 text-sm pt-8">No results found</p>
      )}
    </div>
  )
}

// ─── Main view ───────────────────────────────────────────────────────────────
export default function HomeView({ ctx }) {
  const {
    cards, categories, rewardPrograms, ownedCardIds, userChoiceMap,
    categoryOrder, setCategoryOrder, searchQuery, searchResults,
  } = ctx

  const [detailCard, setDetailCard] = useState(null)
  const [editMode, setEditMode] = useState(false)

  const { listRef, onGripPointerDown, draggingIndex } = useDragReorder(setCategoryOrder)

  // Build ordered category list, appending any IDs not in the saved order
  const orderedCategories = categoryOrder
    .map(id => categories.find(c => c.id === id))
    .filter(Boolean)

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

      {searchQuery ? (
        <SearchResults
          searchResults={searchResults || { cards: [], categories: [] }}
          cards={cards}
          categories={categories}
          rewardPrograms={rewardPrograms}
          ownedCardIds={ownedCardIds}
          userChoiceMap={userChoiceMap}
          onCardPress={setDetailCard}
        />
      ) : (
        <div className="px-3 pt-3 pb-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2 px-1">
            {ownedCardIds.length > 0 ? (
              <p className="text-[10px] text-zinc-600">
                {editMode
                  ? 'Drag ≡ to reorder. Tap Done when finished.'
                  : 'Tap row to expand · tap card name for full detail'}
              </p>
            ) : (
              <span />
            )}
            <button
              onClick={() => setEditMode(m => !m)}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                editMode
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/60'
              }`}
            >
              <ListOrdered size={13} />
              {editMode ? 'Done' : 'Reorder'}
            </button>
          </div>

          {/* Empty state */}
          {ownedCardIds.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-5 text-center mb-3">
              <p className="text-2xl mb-2">💳</p>
              <p className="text-sm font-medium text-zinc-300 mb-1">No cards added yet</p>
              <p className="text-xs text-zinc-500">Go to <strong className="text-zinc-400">My Cards</strong> to select the cards you own</p>
            </div>
          )}

          {/* Category list */}
          <div ref={listRef} className="space-y-1.5">
            {orderedCategories.map((cat, i) => (
              <CategoryRow
                key={cat.id}
                index={i}
                category={cat}
                cards={cards}
                ownedCardIds={ownedCardIds}
                rewardPrograms={rewardPrograms}
                userChoiceMap={userChoiceMap}
                onCardPress={setDetailCard}
                editMode={editMode}
                onGripPointerDown={onGripPointerDown}
                isDragging={editMode && draggingIndex === i}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
