export const PORTFOLIO_THEMES = {
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  ORANGE: 'orange',
} as const;

export type PortfolioTheme = typeof PORTFOLIO_THEMES[keyof typeof PORTFOLIO_THEMES];

export const PORTFOLIO_THEME_OPTIONS = [
  { value: PORTFOLIO_THEMES.BLUE, label: 'Blue' },
  { value: PORTFOLIO_THEMES.GREEN, label: 'Green' },
  { value: PORTFOLIO_THEMES.PURPLE, label: 'Purple' },
  { value: PORTFOLIO_THEMES.ORANGE, label: 'Orange' },
];

export const PORTFOLIO_THEME_STYLES = {
  [PORTFOLIO_THEMES.BLUE]: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  },
  [PORTFOLIO_THEMES.GREEN]: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
  },
  [PORTFOLIO_THEMES.PURPLE]: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
  },
  [PORTFOLIO_THEMES.ORANGE]: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
  },
};

export function getPortfolioThemeStyles(theme?: string | null) {
  if (!theme || !(theme in PORTFOLIO_THEME_STYLES)) {
    return null;
  }
  return PORTFOLIO_THEME_STYLES[theme as PortfolioTheme];
}
