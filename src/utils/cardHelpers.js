import { getActiveRotatingCategories, getCurrentQuarterKey } from './quarterHelpers.js'

const SHORT_NAMES = {
  'wells-fargo-active-cash':       'Active Cash',
  'chase-freedom-unlimited':       'Freedom Unltd',
  'chase-freedom-flex':            'Freedom Flex',
  'discover-it':                   'Discover it',
  'amex-gold':                     'Amex Gold',
  'redstone-fcu-cashbackplus':     'Redstone',
  'citi-double-cash':              'Double Cash',
  'citi-custom-cash':              'Custom Cash',
  'capital-one-savorone':          'SavorOne',
  'capital-one-savor':             'Savor',
  'chase-sapphire-preferred':      'Sapphire Pref',
  'chase-sapphire-reserve':        'Sapphire Resv',
  'amex-blue-cash-preferred':      'Blue Cash Pref',
  'amex-blue-cash-everyday':       'Blue Cash Everyday',
  'amex-platinum':                 'Amex Platinum',
  'capital-one-venture-x':         'Venture X',
  'capital-one-venture':           'Venture',
  'us-bank-cash-plus':             'Cash+',
  'wells-fargo-autograph':         'Autograph',
  'wells-fargo-autograph-journey': 'Autograph Journey',
  'boa-customized-cash':           'BoA Custom Cash',
  'boa-unlimited-cash':            'BoA Unlimited',
  'bilt-mastercard':               'Bilt',
  'citi-strata-premier':           'Strata Premier',
  'apple-card':                    'Apple Card',
  'costco-anywhere-visa':          'Costco Visa',
  'amazon-prime-rewards-visa':     'Amazon Prime',
  'target-redcard':                'RedCard',
  'us-bank-altitude-connect':      'Altitude Connect',
  'fidelity-rewards-visa':         'Fidelity Rewards',
  'navy-federal-more-rewards':     'NavyFed More',
  'penfed-platinum-rewards':       'PenFed Platinum',
  'delta-skymiles-gold':           'Delta Gold',
  'southwest-rapid-rewards-plus':  'SW Rapid Rewards',
  'marriott-bonvoy-boundless':     'Bonvoy Boundless',
  'world-of-hyatt':                'Hyatt Card',
  'chase-ink-business-cash':       'Ink Cash',
  'amex-business-gold':            'Biz Gold',
}

export function getCardShortName(card) {
  return SHORT_NAMES[card.id] || card.name.split(' ').slice(0, 2).join(' ')
}

// userChoiceMap shape: { [cardId]: { [quarterKey]: categoryId } }
function getCurrentChoiceCategory(card, userChoiceMap) {
  if (!card.choiceCategory) return null
  const qKey = getCurrentQuarterKey()
  return (userChoiceMap[card.id] || {})[qKey] || null
}

export function getCardRate(card, categoryId, userChoiceMap = {}) {
  // Check rotating categories first
  if (card.rotating) {
    const activeCats = getActiveRotatingCategories(card)
    if (activeCats.includes(categoryId)) {
      // Use the card's own reward currency type to determine display format
      const isCash = card.rewardsCurrency === 'cash' || card.rewardsCurrency === 'discover-cash'
      return {
        rate: card.rotating.rate,
        isMultiplier: !isCash,
        isRotating: true,
        cap: card.rotating.cap,
        capPeriod: card.rotating.capPeriod,
        notes: [`Rotating category — activate at ${card.issuer}`],
        requiresPortal: false,
      }
    }
  }

  // Check choice category — only applies if user selected it for the CURRENT quarter
  const currentChoice = getCurrentChoiceCategory(card, userChoiceMap)
  if (card.choiceCategory && currentChoice === categoryId) {
    return {
      rate: card.choiceCategory.rate,
      isMultiplier: false,
      isRotating: false,
      isChoice: true,
      cap: card.choiceCategory.cap,
      capPeriod: card.choiceCategory.capPeriod,
      notes: ['Your selected bonus category for this quarter'],
      requiresPortal: false,
    }
  }

  // Check fixed earning rates — find best match for this category
  const rates = card.earningRates.filter(r => r.categoryId === categoryId)
  if (rates.length > 0) {
    return rates.reduce((best, r) => (r.rate > best.rate ? r : best))
  }

  // Fall back to base rate (everything)
  const base = card.earningRates.find(r => r.categoryId === 'everything')
  if (base) return { ...base, isFallback: true }

  return { rate: 0, isMultiplier: false, isFallback: true }
}

export function getBestCardsForCategory(allCards, ownedCardIds, categoryId, userChoiceMap = {}) {
  const owned = allCards.filter(c => ownedCardIds.includes(c.id))

  return owned
    .map(card => {
      const rateInfo = getCardRate(card, categoryId, userChoiceMap)
      return { card, ...rateInfo }
    })
    .filter(entry => entry.rate > 0)
    .sort((a, b) => b.rate - a.rate)
}

export function splitByRewardType(cardRates) {
  const cash = cardRates.filter(r => {
    const prog = r.card.rewardsCurrency
    return prog === 'cash' || prog === 'discover-cash'
  })
  const points = cardRates.filter(r => {
    const prog = r.card.rewardsCurrency
    return prog !== 'cash' && prog !== 'discover-cash'
  })
  return { cash, points }
}

export function getRateLabel(rateInfo, rewardPrograms) {
  if (!rateInfo) return '—'
  const prog = rewardPrograms?.[rateInfo.card?.rewardsCurrency]
  const suffix = rateInfo.isMultiplier ? 'x' : '%'
  if (rateInfo.isMultiplier) {
    const shortName = prog?.name?.replace('Chase Ultimate Rewards', 'UR')
      .replace('Amex Membership Rewards', 'MR')
      .replace('Capital One Miles', 'Miles')
      .replace('Citi ThankYou Points', 'TYP')
      .replace('Bilt Points', 'Bilt')
      .replace('Delta SkyMiles', 'Miles')
      .replace('World of Hyatt Points', 'Pts')
      .replace('Marriott Bonvoy Points', 'Pts')
      .replace('Southwest Rapid Rewards', 'Pts')
      .replace('United MileagePlus', 'Miles') || 'pts'
    return `${rateInfo.rate}x ${shortName}`
  }
  return `${rateInfo.rate}%`
}

export function getCoverageLevel(rate) {
  if (rate >= 5) return 'excellent'
  if (rate >= 3) return 'good'
  if (rate >= 2) return 'ok'
  return 'weak'
}

export function getGapAnalysis(allCards, ownedCardIds, categories, userChoiceMap = {}) {
  return categories
    .filter(cat => cat.id !== 'everything')
    .map(cat => {
      const best = getBestCardsForCategory(allCards, ownedCardIds, cat.id, userChoiceMap)
      const topRate = best[0]?.rate ?? 0
      const topFallback = best.find(b => b.isFallback)
      const effectiveRate = topRate

      // Find non-owned cards that would improve this category
      const notOwned = allCards.filter(c => !ownedCardIds.includes(c.id))
      const upgrades = notOwned
        .map(card => {
          const r = getCardRate(card, cat.id, {})
          return { card, ...r }
        })
        .filter(r => r.rate > effectiveRate)
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 3)

      return {
        category: cat,
        bestCards: best.slice(0, 3),
        topRate: effectiveRate,
        coverageLevel: getCoverageLevel(effectiveRate),
        suggestedUpgrades: upgrades,
      }
    })
    .sort((a, b) => a.topRate - b.topRate)
}

export function searchCards(allCards, categories, query) {
  if (!query?.trim()) return { cards: [], categories: [] }
  const q = query.toLowerCase().trim()

  const matchedCards = allCards.filter(card => {
    const searchable = [
      card.name,
      card.issuer,
      card.network,
      card.rewardsCurrency,
      card.annualFee === 0 ? 'no annual fee no fee' : `${card.annualFee} annual fee`,
      card.type,
      ...card.earningRates.map(r => `${r.rate}${r.isMultiplier ? 'x' : '%'} ${r.categoryId}`),
      ...card.earningRates.flatMap(r => r.notes),
    ].join(' ').toLowerCase()
    return searchable.includes(q)
  })

  const matchedCategories = categories.filter(cat => {
    const searchable = [
      cat.name,
      cat.id,
      ...cat.aliases,
      ...cat.notes,
    ].join(' ').toLowerCase()
    return searchable.includes(q)
  })

  return { cards: matchedCards, categories: matchedCategories }
}
