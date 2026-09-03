export const THEMES = [
  { id: 'cyber', name: 'Cyber Dark', desc: 'Obsidian & Indigo/Purple Glow', icon: '🌌', color: 'from-indigo-600 to-purple-600' },
  { id: 'emerald', name: 'Emerald Mint', desc: 'Deep Forest & Mint Accents', icon: '🌿', color: 'from-emerald-600 to-teal-600' },
  { id: 'midnight', name: 'Midnight Sapphire', desc: 'Oceanic Blue & Cyan Glow', icon: '🌙', color: 'from-blue-600 to-cyan-600' },
  { id: 'light', name: 'Crisp Light', desc: 'Clean Modern Glass Interface', icon: '☀️', color: 'from-indigo-500 to-blue-500' },
];

export function applyTheme(themeId) {
  const selected = THEMES.find(t => t.id === themeId) ? themeId : 'cyber';
  document.documentElement.setAttribute('data-theme', selected);
  localStorage.setItem('app_theme', selected);
  return selected;
}

export function getStoredTheme() {
  return localStorage.getItem('app_theme') || 'cyber';
}
