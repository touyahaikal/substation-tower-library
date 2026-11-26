export const THEMES = {
  ttpd: { id: 'ttpd', label: 'THE TORTURED POETS DEPARTMENT', light: 'THE TORTURED POETS DEPARTMENT', dark: 'THE TORTURED POETS DEPARTMENT: THE ANTHOLOGY' },
  substation: { id: 'substation', label: 'Substation Tower', light: 'Substation Tower: Daylight Shift', dark: 'Substation Tower: Blackout' },
}

export const resolveMode = (mode) =>
  mode === 'auto' ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode === 'dark' ? 'dark' : 'light'
export const variantName = (theme, mode) => THEMES[theme][resolveMode(mode)]
// appearance options (stored in settings, applied as data-* attributes on <html>)
export const APPEARANCE_KEYS = ['theme', 'mode', 'pattern', 'patternDensity', 'patternIntensity', 'spacing', 'textSize']
export const APPEARANCE_DEFAULTS = { pattern: 'plain', patternDensity: 'balanced', patternIntensity: 'soft', spacing: 'roomy', textSize: 'normal', shelfDecor: 'auto' }
