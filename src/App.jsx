import { useState, useMemo } from 'react'
import cardsData from './data/cards.json'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { searchCards } from './utils/cardHelpers.js'
import { getCurrentQuarterKey, getNextQuarterKey } from './utils/quarterHelpers.js'

const DEFAULT_CATEGORY_ORDER = [
  'dining', 'groceries', 'gas', 'amazon', 'online-shopping',
  'streaming', 'drugstores', 'entertainment', 'transit',
  'home-improvement', 'wholesale-clubs', 'target', 'costco', 'apple',
  'office-supplies', 'phone', 'utilities',
  'travel', 'flights', 'hotels', 'car-rentals',
]
import BottomNav from './components/layout/BottomNav.jsx'
import Header from './components/layout/Header.jsx'
import QuarterlyReminder from './components/common/QuarterlyReminder.jsx'
import HomeView from './components/views/HomeView.jsx'
import MyCardsView from './components/views/MyCardsView.jsx'
import BrowseView from './components/views/BrowseView.jsx'
import GapsView from './components/views/GapsView.jsx'
import SettingsView from './components/views/SettingsView.jsx'

export default function App() {
  const [activeView, setActiveView] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [ownedCardIds, setOwnedCardIds] = useLocalStorage('ownedCards', [])
  // userChoiceMap shape: { [cardId]: { [quarterKey]: categoryId } }
  const [userChoiceMap, setUserChoiceMap] = useLocalStorage('userChoiceCategories', {})
  const [userActivations, setUserActivations] = useLocalStorage('userActivations', {})
  const [categoryOrder, setCategoryOrder] = useLocalStorage('categoryOrder', DEFAULT_CATEGORY_ORDER)

  const { cards, categories, rewardPrograms } = cardsData
  const currentQuarterKey = getCurrentQuarterKey()
  const nextQuarterKey = getNextQuarterKey()

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    return searchCards(cards, categories, searchQuery)
  }, [searchQuery, cards, categories])

  function toggleCard(id) {
    setOwnedCardIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // quarterKey = currentQuarterKey or nextQuarterKey
  function setChoiceCategory(cardId, quarterKey, categoryId) {
    setUserChoiceMap(prev => ({
      ...prev,
      [cardId]: { ...(prev[cardId] || {}), [quarterKey]: categoryId }
    }))
  }

  function setActivation(cardId, quarterKey, activated) {
    setUserActivations(prev => ({
      ...prev,
      [`${cardId}:${quarterKey}`]: activated
    }))
  }

  function isActivated(cardId, quarterKey) {
    return !!userActivations[`${cardId}:${quarterKey}`]
  }

  // Merge saved order with any categories added since — new ones go to the end
  const allCategoryIds = categories.filter(c => c.id !== 'everything').map(c => c.id)
  const mergedOrder = [
    ...categoryOrder.filter(id => allCategoryIds.includes(id)),
    ...allCategoryIds.filter(id => !categoryOrder.includes(id)),
  ]

  const ctx = {
    cards,
    categories,
    rewardPrograms,
    ownedCardIds,
    userChoiceMap,
    currentQuarterKey,
    nextQuarterKey,
    categoryOrder: mergedOrder,
    setCategoryOrder,
    toggleCard,
    setChoiceCategory,
    setActivation,
    isActivated,
    searchQuery,
    searchResults,
  }

  const views = {
    home: <HomeView ctx={ctx} />,
    mycards: <MyCardsView ctx={ctx} />,
    browse: <BrowseView ctx={ctx} />,
    gaps: <GapsView ctx={ctx} />,
    settings: <SettingsView ctx={ctx} ownedCardIds={ownedCardIds} setOwnedCardIds={setOwnedCardIds} userChoiceMap={userChoiceMap} setUserChoiceMap={setUserChoiceMap} categoryOrder={mergedOrder} setCategoryOrder={setCategoryOrder} />,
  }

  return (
    <div className="flex flex-col h-dvh bg-zinc-950">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeView={activeView} setActiveView={setActiveView} />
      <QuarterlyReminder cards={cards} ownedCardIds={ownedCardIds} userChoiceMap={userChoiceMap} isActivated={isActivated} />
      <main className="flex-1 overflow-y-auto scrollbar-none sm:pb-0 pb-nav">
        {views[activeView]}
      </main>
      <BottomNav activeView={activeView} setActiveView={setActiveView} />
    </div>
  )
}
