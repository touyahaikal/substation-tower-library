export const THEMES = {
  ttpd: { id: 'ttpd', label: 'THE TORTURED POETS DEPARTMENT', light: 'THE TORTURED POETS DEPARTMENT', dark: 'THE TORTURED POETS DEPARTMENT: THE ANTHOLOGY' },
  substation: { id: 'substation', label: 'Substation Tower', light: 'Substation Tower: Daylight Shift', dark: 'Substation Tower: Blackout' },
}

export const variantName = (theme, mode) => THEMES[theme][mode]
