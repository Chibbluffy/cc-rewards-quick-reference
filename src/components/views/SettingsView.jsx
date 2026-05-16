import { useState } from 'react'
import { Download, Upload, Copy, Check, AlertTriangle, ExternalLink } from 'lucide-react'
import cardsData from '../../data/cards.json'

export default function SettingsView({ ownedCardIds, setOwnedCardIds, userChoiceMap, setUserChoiceMap, categoryOrder, setCategoryOrder }) {
  const [copied, setCopied] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const config = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ownedCardIds,
    userChoiceCategories: userChoiceMap,
    categoryOrder,
  }

  async function handleCopy() {
    const text = JSON.stringify(config, null, 2)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for browsers that deny clipboard
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  function handleImport() {
    setImportError('')
    setImportSuccess(false)
    try {
      const parsed = JSON.parse(importText.trim())
      if (!Array.isArray(parsed.ownedCardIds)) {
        setImportError('Invalid config — missing ownedCardIds array')
        return
      }
      // Validate card IDs exist
      const validIds = parsed.ownedCardIds.filter(id =>
        cardsData.cards.some(c => c.id === id)
      )
      const skipped = parsed.ownedCardIds.length - validIds.length
      setOwnedCardIds(validIds)
      if (parsed.userChoiceCategories && typeof parsed.userChoiceCategories === 'object') {
        setUserChoiceMap(parsed.userChoiceCategories)
      }
      if (Array.isArray(parsed.categoryOrder)) {
        setCategoryOrder(parsed.categoryOrder)
      }
      setImportSuccess(true)
      setImportText('')
      setShowImport(false)
      if (skipped > 0) setImportError(`Imported. ${skipped} unknown card ID(s) skipped.`)
    } catch {
      setImportError('Invalid JSON — check your paste and try again')
    }
  }

  function handleReset() {
    if (confirm('Clear all your card selections and settings? This cannot be undone.')) {
      setOwnedCardIds([])
      setUserChoiceMap({})
      // categoryOrder is intentionally kept — resetting cards shouldn't scramble the layout
    }
  }

  return (
    <div className="px-3 pt-3 pb-6 space-y-4">

      {/* Export */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-4">
        <p className="text-sm font-semibold text-zinc-200 mb-1">Export Configuration</p>
        <p className="text-xs text-zinc-500 mb-3 leading-snug">
          Copy your card selections as JSON. Paste it on another device to restore your setup.
        </p>
        <div className="bg-zinc-800 rounded-xl p-3 mb-3 overflow-x-auto scrollbar-none">
          <pre className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap break-all">
            {JSON.stringify({ ...config, exportedAt: '…' }, null, 2).slice(0, 300)}…
          </pre>
        </div>
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
            copied ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-200 active:bg-zinc-600'
          }`}
        >
          {copied ? <Check size={16} strokeWidth={2.5} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      {/* Import */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-4">
        <p className="text-sm font-semibold text-zinc-200 mb-1">Import Configuration</p>
        <p className="text-xs text-zinc-500 mb-3 leading-snug">
          Paste a previously exported JSON config to restore your card selections.
        </p>

        {importSuccess && !importError && (
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3 py-2 mb-3">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300">Config imported successfully!</p>
          </div>
        )}

        {importError && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 mb-3">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">{importError}</p>
          </div>
        )}

        {!showImport ? (
          <button
            onClick={() => setShowImport(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-zinc-700 text-zinc-200 active:bg-zinc-600"
          >
            <Upload size={16} />
            Paste Import JSON
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder='Paste JSON here…'
              rows={6}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-emerald-500 resize-none font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowImport(false); setImportText(''); setImportError('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-400 active:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white active:bg-emerald-600 disabled:opacity-40"
              >
                Import
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data info */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-4">
        <p className="text-sm font-semibold text-zinc-200 mb-2">Data Information</p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">Database version</span>
            <span className="text-xs text-zinc-300">{cardsData.version}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">Last updated</span>
            <span className="text-xs text-zinc-300">{cardsData.lastUpdated}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">Cards in database</span>
            <span className="text-xs text-zinc-300">{cardsData.cards.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">Your cards</span>
            <span className="text-xs text-zinc-300">{ownedCardIds.length}</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 mt-3 leading-snug">
          Card data is bundled with the app and works offline. Rates are verified manually — always confirm with your card issuer for the most current information.
        </p>
      </div>

      {/* Reset */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800/60 p-4">
        <p className="text-sm font-semibold text-zinc-200 mb-1">Reset</p>
        <p className="text-xs text-zinc-500 mb-3">Clear all card selections and category choices. Data stays in the app.</p>
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-xl text-sm font-semibold text-red-400 bg-red-400/10 border border-red-400/20 active:bg-red-400/20"
        >
          Clear All Selections
        </button>
      </div>

      {/* About */}
      <div className="px-1">
        <p className="text-[10px] text-zinc-700 text-center leading-relaxed">
          CC Rewards Quick Reference · Data updated {cardsData.lastUpdated}<br />
          Not affiliated with any card issuer. Verify rates at your issuer's site.
        </p>
      </div>
    </div>
  )
}
