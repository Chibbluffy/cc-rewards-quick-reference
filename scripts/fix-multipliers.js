// Fix isMultiplier consistency in cards.json:
// - Cards earning TRANSFERABLE points (UR, MR, C1 Miles, TYP for Strata, Bilt, airline/hotel) → isMultiplier: true
// - Cards earning cash or cash-equivalent points (WF Rewards, US Bank pts, NavyFed, PenFed) → isMultiplier: false
import { readFileSync, writeFileSync } from 'fs'

const data = JSON.parse(readFileSync('src/data/cards.json', 'utf8'))

// These earn transferable points — should show as "Nx Program"
const makeMultiplier = new Set([
  'chase-freedom-unlimited',
  'chase-freedom-flex',
  'chase-ink-business-cash',
])

// These earn cash-equivalent points — should show as "%"
const makeCashRate = new Set([
  'wells-fargo-autograph',
  'wells-fargo-autograph-journey',
  'us-bank-altitude-connect',
  'navy-federal-more-rewards',
  'penfed-platinum-rewards',
])

for (const card of data.cards) {
  if (makeMultiplier.has(card.id)) {
    for (const r of card.earningRates) r.isMultiplier = true
    console.log(`✓ ${card.id} → isMultiplier: true`)
  }
  if (makeCashRate.has(card.id)) {
    for (const r of card.earningRates) r.isMultiplier = false
    console.log(`✓ ${card.id} → isMultiplier: false`)
  }
}

writeFileSync('src/data/cards.json', JSON.stringify(data, null, 2))
console.log('Done')
