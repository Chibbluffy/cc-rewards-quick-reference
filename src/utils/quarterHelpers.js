export function getCurrentQuarterKey(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const q = Math.floor(month / 3) + 1
  return `${year}-Q${q}`
}

export function getNextQuarterKey(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  let q = Math.floor(month / 3) + 2
  let y = year
  if (q > 4) { q = 1; y++ }
  return `${y}-Q${q}`
}

export function quarterLabel(quarterKey) {
  const [year, qStr] = quarterKey.split('-Q')
  const ranges = { 1: 'Jan–Mar', 2: 'Apr–Jun', 3: 'Jul–Sep', 4: 'Oct–Dec' }
  return `Q${qStr} ${ranges[qStr]} ${year}`
}

export function getQuarterBounds(quarterKey) {
  const [year, qStr] = quarterKey.split('-Q')
  const q = parseInt(qStr)
  const startMonth = (q - 1) * 3
  const start = new Date(parseInt(year), startMonth, 1)
  const end = new Date(parseInt(year), startMonth + 3, 0)
  return { start, end }
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export function formatQuarterLabel(quarterKey) {
  const [year, qStr] = quarterKey.split('-Q')
  const labels = { 1: 'Q1 Jan–Mar', 2: 'Q2 Apr–Jun', 3: 'Q3 Jul–Sep', 4: 'Q4 Oct–Dec' }
  return `${labels[qStr]} ${year}`
}

export function getActiveRotatingCategories(card, date = new Date()) {
  if (!card.rotating) return []
  const key = getCurrentQuarterKey(date)
  const quarter = card.rotating.quarters?.[key]
  if (!quarter || !quarter.announced) return []
  return quarter.categoryIds || []
}

export function getActiveRotatingDisplay(card, date = new Date()) {
  if (!card.rotating) return null
  const key = getCurrentQuarterKey(date)
  const quarter = card.rotating.quarters?.[key]
  if (!quarter) return null
  return quarter
}

export function needsActivation(card, date = new Date()) {
  if (!card.rotating?.activationRequired) return false
  const key = getCurrentQuarterKey(date)
  const quarter = card.rotating.quarters?.[key]
  if (!quarter?.announced) return false
  const deadline = quarter.activationDeadline
  if (!deadline) return false
  return daysUntil(deadline) >= 0
}

export function needsChoiceSelection(card, userChosenCategory) {
  if (!card.choiceCategory?.selectionRequired) return false
  return !userChosenCategory
}

// Returns days until the next quarter starts, as a reminder threshold
export function daysUntilNextQuarter(date = new Date()) {
  const current = getCurrentQuarterKey(date)
  const [year, qStr] = current.split('-Q')
  const q = parseInt(qStr)
  let nextYear = parseInt(year)
  let nextQ = q + 1
  if (nextQ > 4) { nextQ = 1; nextYear++ }
  const nextStart = new Date(nextYear, (nextQ - 1) * 3, 1)
  return daysUntil(nextStart.toISOString().split('T')[0])
}
