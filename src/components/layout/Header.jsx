import { Search, X, Home, CreditCard, BarChart2, Settings } from 'lucide-react'

const NAV_TABS = [
  { id: 'home',     label: 'Home',     Icon: Home },
  { id: 'mycards',  label: 'My Cards', Icon: CreditCard },
  { id: 'gaps',     label: 'Gaps',     Icon: BarChart2 },
  { id: 'settings', label: 'More',     Icon: Settings },
]

export default function Header({ searchQuery, setSearchQuery, activeView, setActiveView }) {
  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/60 safe-top">
      {/* Mobile: search bar only */}
      <div className="sm:hidden px-3 pb-2">
        <SearchBar query={searchQuery} setQuery={setSearchQuery} />
      </div>

      {/* Desktop: title + search + nav in one row */}
      <div className="hidden sm:flex items-center gap-4 px-6 py-3">
        <span className="text-sm font-bold text-zinc-100 whitespace-nowrap shrink-0">💳 CC Rewards</span>
        <div className="flex-1 max-w-md">
          <SearchBar query={searchQuery} setQuery={setSearchQuery} />
        </div>
        <nav className="flex items-center gap-1 shrink-0">
          {NAV_TABS.map(({ id, label, Icon }) => {
            const active = activeView === id
            return (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-800 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

function SearchBar({ query, setQuery }) {
  return (
    <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 h-10">
      <Search size={15} className="text-zinc-500 shrink-0" />
      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search cards, categories, issuers…"
        className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none min-w-0"
      />
      {query && (
        <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-300 p-0.5">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
