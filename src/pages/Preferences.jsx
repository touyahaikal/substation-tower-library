import React, { useRef, useState } from 'react'
import { RefreshCw, Download, Upload, RotateCcw, Github } from 'lucide-react'
import { PageTitle, Card, Field, SelectCustom } from '../components/ui.jsx'
import TagsManager from '../components/TagsManager.jsx'
import { useStore } from '../lib/store.jsx'
import { SyncPanel } from '../components/SyncModal.jsx'
import { useNav } from '../lib/nav.jsx'
import { THEMES, variantName, resolveMode } from '../lib/themes.js'
import { CURRENCIES, DEFAULT_RATES, fetchLiveRates } from '../lib/currency.js'
import { LANGUAGES, downloadJSON } from '../lib/utils.js'

const VARIANTS = [
  ['ttpd', 'light', 'THE TORTURED POETS DEPARTMENT', 'Light', ['#F5F2EB', '#FDFBF7', '#7C6F64']],
  ['ttpd', 'dark', 'THE ANTHOLOGY', 'Dark', ['#121110', '#1B1918', '#A89B8C']],
  ['substation', 'light', 'Substation Tower: Daylight Shift', 'Light', ['#F1F3F5', '#FFFFFF', '#D97706']],
  ['substation', 'dark', 'Substation Tower: Blackout', 'Dark', ['#0B0D0F', '#14181D', '#F59E0B']],
]
function Seg({ label, value, onChange, options, name }) {
  return (
    <div data-seg={name}>
      <div className="label">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([id, l]) => <button key={id} type="button" aria-pressed={value === id} className={`btn !py-1 text-sm ${value === id ? 'btn-primary' : ''}`} onClick={() => onChange(id)}>{l}</button>)}
      </div>
    </div>
  )
}
function Appearance({ settings, set }) {
  const pats = [['plain', 'Plain'], ['flowers', 'Flowers'], ['leaves', 'Leaves'], ['stars', 'Stars'], ['dots', 'Dots'], ...(settings.theme === 'substation' || settings.pattern === 'grid' ? [['grid', 'Technical grid']] : [])]
  const resolved = resolveMode(settings.mode)
  return (
    <div className="space-y-4">
      <Card title="Theme & brightness">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VARIANTS.map(([t, m, name, bright, sw]) => {
            const on = settings.theme === t && resolved === m
            return (
              <button key={t + m} type="button" data-variant={`${t}-${m}`} aria-pressed={on} onClick={() => set({ theme: t, mode: m })}
                className={`panel text-left p-3 flex gap-3 items-center ${on ? '!border-accent ring-2 ring-accent' : 'hover:!border-accent'}`}>
                <span className="flex w-16 h-12 rounded overflow-hidden border border-black/20 shrink-0" style={{ background: sw[0] }}>
                  <span className="m-1.5 flex-1 rounded-sm" style={{ background: sw[1] }} />
                  <span className="w-3 my-1.5 mr-1.5 rounded-sm" style={{ background: sw[2] }} />
                </span>
                <span className="min-w-0"><span className="block text-sm font-semibold leading-tight">{name}</span><span className="block text-[11px] text-muted">{bright}</span></span>
              </button>
            )
          })}
        </div>
        <div className="mt-3">
          <Seg name="mode" label="Brightness" value={settings.mode} onChange={(mode) => set({ mode })} options={[['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']]} />
          <p className="text-xs text-muted font-mono mt-2">Active: {variantName(settings.theme, settings.mode)}{settings.mode === 'auto' ? ' (follows your device)' : ''}</p>
        </div>
      </Card>
      <Card title="Background pattern">
        <div className="space-y-3">
          <Seg name="pattern" label="Pattern" value={settings.pattern || 'plain'} onChange={(pattern) => set({ pattern })} options={pats} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Seg name="density" label="Density" value={settings.patternDensity || 'balanced'} onChange={(patternDensity) => set({ patternDensity })} options={[['sparse', 'Sparse'], ['balanced', 'Balanced'], ['dense', 'Dense']]} />
            <Seg name="intensity" label="Intensity" value={settings.patternIntensity || 'soft'} onChange={(patternIntensity) => set({ patternIntensity })} options={[['faint', 'Faint'], ['soft', 'Soft'], ['clear', 'Clear']]} />
          </div>
        </div>
      </Card>
      <Card title="Layout & text">
        <div className="grid sm:grid-cols-2 gap-3">
          <Seg name="spacing" label="Spacing" value={settings.spacing || 'roomy'} onChange={(spacing) => set({ spacing })} options={[['roomy', 'Roomy'], ['compact', 'Compact']]} />
          <Seg name="text" label="Text size" value={settings.textSize || 'normal'} onChange={(textSize) => set({ textSize })} options={[['normal', 'Normal'], ['large', 'Large'], ['larger', 'Larger']]} />
        </div>
      </Card>
    </div>
  )
}

export default function Preferences() {
  const { settings, actions, data, admin, syncState, flash, ask } = useStore()
  const { setSyncOpen } = useNav()
  const [busy, setBusy] = useState(false)
  const file = useRef(null)
  const set = actions.setSettings

  const refresh = async () => {
    setBusy(true)
    try {
      const live = await fetchLiveRates()
      set({ rates: { ...settings.rates, ...live }, ratesUpdated: new Date().toISOString() })
      flash('Live rates updated')
    } catch {
      flash('Could not reach the rate service — keeping saved rates')
    } finally { setBusy(false) }
  }
  const setRate = (c, v) => set({ rates: { ...settings.rates, [c]: Number(v) || 0 } })

  const importFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => { try { actions.importData(JSON.parse(r.result)); flash('Library imported', 'success') } catch (err) { flash(err.message || 'That file is not a valid library', 'error') } }
    r.readAsText(f)
    e.target.value = ''
  }

  const SECTIONS = [['profile', 'Profile'], ['goals', 'Goals'], ['appearance', 'Appearance'], ['language', 'Language & region'], ['tags', 'Tags & labels'], ['currency', 'Currency & Rates'], ['sync', 'GitHub Sync'], ['data', 'Data & backup'], ['about', 'About']]
  const [sec, setSec] = useState('profile')

  return (
    <>
      <PageTitle sub="Make it yours">Preferences</PageTitle>
      <div className="flex flex-col md:flex-row gap-5">
        <nav className="md:w-52 shrink-0 flex md:flex-col gap-1 overflow-x-auto" aria-label="Preferences sections">
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => setSec(id)} aria-current={sec === id} data-sec={id}
              className={`text-left whitespace-nowrap px-3 py-2 text-sm rounded-[var(--radius)] transition ${sec === id ? 'bg-accent/15 text-accent font-semibold' : 'text-ink/80 hover:bg-line/50'}`}>{label}</button>
          ))}
        </nav>
        <div className="flex-1 min-w-0 space-y-4">
          {sec === 'profile' && (
            <Card title="Profile">
              <Field label="Reader name"><input className="input" value={settings.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            </Card>
          )}

          {sec === 'goals' && (
            <Card title="Goals">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Yearly book goal"><input className="input" type="number" min="1" value={settings.goalBooks} onChange={(e) => set({ goalBooks: Number(e.target.value) })} /></Field>
                <Field label="Yearly page goal"><input className="input" type="number" min="1" value={settings.goalPages} onChange={(e) => set({ goalPages: Number(e.target.value) })} /></Field>
              </div>
            </Card>
          )}

          {sec === 'appearance' && <Appearance settings={settings} set={set} />}

          {sec === 'language' && (
            <Card title="Language & region">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Default language for new books"><SelectCustom value={settings.defaultLanguage || 'English'} onChange={(v) => set({ defaultLanguage: v })} options={LANGUAGES} placeholder="Language" /></Field>
                <Field label="Primary summary currency">
                  <select className="input" value={settings.primaryCurrency} onChange={(e) => set({ primaryCurrency: e.target.value })}>{CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}</select>
                </Field>
              </div>
            </Card>
          )}

          {sec === 'tags' && (
            <>
              <p className="text-sm text-muted">Renaming or deleting a tag updates every book that uses it. Counts show how many books use each tag.</p>
              <TagsManager />
            </>
          )}

          {sec === 'currency' && (
            <Card title="Currency & exchange rates">
              <div className="flex items-end gap-3 flex-wrap mb-3">
                <Field label="Primary summary currency">
                  <select className="input" value={settings.primaryCurrency} onChange={(e) => set({ primaryCurrency: e.target.value })}>{CURRENCIES.map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}</select>
                </Field>
                <button className="btn" onClick={refresh} disabled={busy}><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh live rates</button>
                <button className="btn" onClick={() => set({ rates: { ...DEFAULT_RATES } })}>Reset to defaults</button>
                <span className="text-xs text-muted">{settings.ratesUpdated ? `Updated ${new Date(settings.ratesUpdated).toLocaleString()}` : 'Using built-in default rates'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {CURRENCIES.filter(([c]) => c !== 'USD').map(([c]) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <span className="font-mono w-20 text-muted text-xs">1 USD =</span>
                    <input className="input !py-1" type="number" step="any" value={settings.rates[c] ?? ''} onChange={(e) => setRate(c, e.target.value)} />
                    <span className="font-mono text-xs">{c}</span>
                  </label>
                ))}
              </div>
            </Card>
          )}

          {sec === 'sync' && <Card title="GitHub Sync"><SyncPanel /></Card>}

          {sec === 'data' && (
            <Card title="Data & backup">
              <div className="flex gap-2 flex-wrap">
                <button className="btn" onClick={() => downloadJSON(data, `reading-journal-${new Date().toISOString().slice(0, 10)}.json`)}><Download size={14} /> Export JSON</button>
                <button className="btn" onClick={() => file.current?.click()}><Upload size={14} /> Import JSON</button>
                <input ref={file} type="file" accept="application/json" className="hidden" onChange={importFile} />
                <button className="btn" onClick={async () => { if (await ask({ title: 'Reset to demo library?', message: 'This replaces every book, log and task with the demo library. If you are logged in, it will be saved to GitHub too.', confirmLabel: 'Yes, reset', danger: true })) { actions.resetDemo(); flash('Demo library restored', 'success') } }}><RotateCcw size={14} /> Reset demo data</button>
              </div>
            </Card>
          )}

          {sec === 'about' && (
            <Card title="About & keyboard shortcuts">
              <p className="text-sm text-muted mb-3">Book Tracker – Reading Journal. Your library lives in one JSON file in your GitHub repository; nothing is stored in this browser.</p>
              <ul className="text-sm divide-y divide-line panel" data-shortcuts>
                {[['N', 'Add a book'], ['/', 'Search'], ['Ctrl + Z', 'Undo'], ['Esc', 'Close']].map(([k, d]) => (
                  <li key={k} className="flex items-center justify-between px-3 py-2"><span>{d}</span><kbd className="font-mono text-xs border border-line rounded px-2 py-0.5 bg-bg">{k}</kbd></li>
                ))}
              </ul>
              <p className="text-xs text-muted mt-3">Shortcuts are ignored while you are typing in a field. Ctrl + Z undoes your last change made in this session.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
