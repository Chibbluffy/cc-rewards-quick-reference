import { Home, CreditCard, BarChart2, Settings } from 'lucide-react'

const TABS = [
  { id: 'home',     label: 'Home',    Icon: Home },
  { id: 'mycards',  label: 'My Cards', Icon: CreditCard },
  { id: 'gaps',     label: 'Gaps',    Icon: BarChart2 },
  { id: 'settings', label: 'More',    Icon: Settings },
]

export default function BottomNav({ activeView, setActiveView }) {
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-900 border-t border-zinc-800 safe-bottom">
      <div className="grid grid-cols-4">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeView === id
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
                active ? 'text-emerald-400' : 'text-zinc-500 active:text-zinc-300'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
              <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
