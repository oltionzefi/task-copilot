export const PORTFOLIO_THEMES = {
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  ORANGE: 'orange',
  RED: 'red',
  PINK: 'pink',
  YELLOW: 'yellow',
  TEAL: 'teal',
  INDIGO: 'indigo',
  GRAY: 'gray',
} as const;

export type PortfolioTheme = typeof PORTFOLIO_THEMES[keyof typeof PORTFOLIO_THEMES];

export const PORTFOLIO_THEME_OPTIONS = [
  { value: PORTFOLIO_THEMES.BLUE, label: 'Blue' },
  { value: PORTFOLIO_THEMES.GREEN, label: 'Green' },
  { value: PORTFOLIO_THEMES.PURPLE, label: 'Purple' },
  { value: PORTFOLIO_THEMES.ORANGE, label: 'Orange' },
  { value: PORTFOLIO_THEMES.RED, label: 'Red' },
  { value: PORTFOLIO_THEMES.PINK, label: 'Pink' },
  { value: PORTFOLIO_THEMES.YELLOW, label: 'Yellow' },
  { value: PORTFOLIO_THEMES.TEAL, label: 'Teal' },
  { value: PORTFOLIO_THEMES.INDIGO, label: 'Indigo' },
  { value: PORTFOLIO_THEMES.GRAY, label: 'Gray' },
];

export const PORTFOLIO_THEME_STYLES = {
  [PORTFOLIO_THEMES.BLUE]: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    accent: 'bg-blue-500',
  },
  [PORTFOLIO_THEMES.GREEN]: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    accent: 'bg-green-500',
  },
  [PORTFOLIO_THEMES.PURPLE]: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
    accent: 'bg-purple-500',
  },
  [PORTFOLIO_THEMES.ORANGE]: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
    accent: 'bg-orange-500',
  },
  [PORTFOLIO_THEMES.RED]: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
    accent: 'bg-red-500',
  },
  [PORTFOLIO_THEMES.PINK]: {
    border: 'border-l-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    text: 'text-pink-700 dark:text-pink-300',
    badge: 'bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200',
    accent: 'bg-pink-500',
  },
  [PORTFOLIO_THEMES.YELLOW]: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
    accent: 'bg-yellow-500',
  },
  [PORTFOLIO_THEMES.TEAL]: {
    border: 'border-l-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    text: 'text-teal-700 dark:text-teal-300',
    badge: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200',
    accent: 'bg-teal-500',
  },
  [PORTFOLIO_THEMES.INDIGO]: {
    border: 'border-l-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200',
    accent: 'bg-indigo-500',
  },
  [PORTFOLIO_THEMES.GRAY]: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    text: 'text-gray-700 dark:text-gray-300',
    badge: 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200',
    accent: 'bg-gray-500',
  },
};

export function getPortfolioThemeStyles(theme?: string | null) {
  if (!theme || !(theme in PORTFOLIO_THEME_STYLES)) {
    return null;
  }
  return PORTFOLIO_THEME_STYLES[theme as PortfolioTheme];
}
