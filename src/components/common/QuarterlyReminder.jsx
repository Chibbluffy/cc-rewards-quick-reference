import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { getCurrentQuarterKey, getNextQuarterKey, daysUntil, daysUntilNextQuarter, quarterLabel } from '../../utils/quarterHelpers.js'

export default function QuarterlyReminder({ cards, ownedCardIds, userChoiceMap, isActivated }) {
  const [dismissed, setDismissed] = useState([])
  const currentQKey = getCurrentQuarterKey()
  const nextQKey = getNextQuarterKey()
  const daysToNext = daysUntilNextQuarter()

  const reminders = []

  ownedCardIds.forEach(cardId => {
    const card = cards.find(c => c.id === cardId)
    if (!card) return

    // --- Activation reminders (Discover, Chase Freedom Flex) ---
    if (card.rotating?.activationRequired) {
      const quarter = card.rotating.quarters?.[currentQKey]
      if (quarter?.announced && !isActivated(card.id, currentQKey)) {
        const key = `${card.id}:activate:${currentQKey}`
        if (!dismissed.includes(key)) {
          const deadline = quarter.activationDeadline
          const days = deadline ? daysUntil(deadline) : null
          if (days === null || days >= 0) {
            reminders.push({
              key,
              type: 'activation',
              card,
              text: `Activate ${card.name} 5% categories`,
              sub: quarter.displayCategories?.join(', ') || '',
              urgency: days !== null && days <= 14 ? 'urgent' : 'normal',
              days,
            })
          }
        }
      }
    }

    // --- Choice category reminders (Redstone, US Bank Cash+, BoA) ---
    if (card.choiceCategory?.selectionRequired) {
      const currentChoice = (userChoiceMap[cardId] || {})[currentQKey]
      const nextChoice = (userChoiceMap[cardId] || {})[nextQKey]

      // Current quarter has no category selected — warn (no bonus active)
      if (!currentChoice) {
        const key = `${card.id}:choice-current:${currentQKey}`
        if (!dismissed.includes(key)) {
          reminders.push({
            key,
            type: 'choice-missing',
            card,
            text: `${card.name} — no 5% category active`,
            sub: `No category selected for ${quarterLabel(currentQKey)}. Earning base rates only.`,
            urgency: 'urgent',
            days: null,
          })
        }
      }

      // Next quarter approaching — remind to select next quarter's category
      if (!nextChoice && daysToNext <= 45) {
        const key = `${card.id}:choice-next:${nextQKey}`
        if (!dismissed.includes(key)) {
          reminders.push({
            key,
            type: 'choice-next',
            card,
            text: `Select ${card.name} category for ${quarterLabel(nextQKey)}`,
            sub: `Set your 5% category in the ${card.issuer} app before the quarter starts.`,
            urgency: daysToNext <= 14 ? 'urgent' : 'normal',
            days: daysToNext,
          })
        }
      }
    }
  })

  if (reminders.length === 0) return null

  return (
    <div className="px-3 pt-2 space-y-1.5">
      {reminders.map(r => (
        <div
          key={r.key}
          className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${
            r.urgency === 'urgent'
              ? 'bg-amber-500/15 border border-amber-500/30'
              : 'bg-zinc-800/80 border border-zinc-700/50'
          }`}
        >
          <Bell size={15} className={`mt-0.5 shrink-0 ${r.urgency === 'urgent' ? 'text-amber-400' : 'text-zinc-400'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium leading-snug ${r.urgency === 'urgent' ? 'text-amber-300' : 'text-zinc-200'}`}>
              {r.text}
            </p>
            {r.sub && <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{r.sub}</p>}
            {r.days !== null && (
              <p className={`text-xs mt-0.5 ${r.urgency === 'urgent' ? 'text-amber-400' : 'text-zinc-500'}`}>
                {r.days === 0 ? 'Due today' : r.days === 1 ? '1 day left' : `${r.days} days`}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed(d => [...d, r.key])}
            className="text-zinc-600 hover:text-zinc-400 shrink-0 mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
