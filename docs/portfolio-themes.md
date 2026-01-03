# Portfolio Themes

This document describes the portfolio theme system implemented in the application.

## Overview

Portfolios can be configured with visual themes to help organize and categorize related projects. The system provides 4 pre-defined theme options that apply consistent color schemes across the UI.

## Available Themes

The following 4 themes are available:

1. **Blue** - Professional and trustworthy
2. **Green** - Growth and development
3. **Purple** - Creative and innovative
4. **Orange** - Energetic and dynamic

## Theme Application

Themes are applied in the following UI components:

### Portfolio Settings
- Theme selection dropdown with color indicators
- Portfolio cards display theme-colored badges

### Project Cards
- Left border colored according to portfolio theme
- Background tinted with theme color
- Portfolio name badge with theme styling

### Project Settings
- Portfolio selector shows theme color indicators
- Visual feedback for portfolio association

## Implementation Details

### Theme Constants
Defined in `frontend/src/constants/portfolioThemes.ts`:
- `PORTFOLIO_THEMES` - Theme identifier constants
- `PORTFOLIO_THEME_OPTIONS` - Dropdown options with labels
- `PORTFOLIO_THEME_STYLES` - Tailwind CSS classes for each theme
- `getPortfolioThemeStyles()` - Utility function to retrieve theme styles

### Theme Styles
Each theme includes:
- **border** - Left border color for cards
- **bg** - Background tint (light/dark mode compatible)
- **text** - Text color for theme-specific content
- **badge** - Badge styling for portfolio labels

### Database Schema
The `portfolios` table includes a `theme` column (TEXT, nullable) that stores the theme identifier.

## Usage

### Creating a Portfolio with Theme
1. Navigate to Settings > Portfolios
2. Click "Create Portfolio"
3. Enter portfolio name and description
4. Select a theme from the dropdown
5. Save the portfolio

### Assigning Portfolio to Project
1. Navigate to Settings > Projects
2. Select a project
3. Choose a portfolio from the dropdown
4. Save changes

### Visual Feedback
Projects assigned to themed portfolios will display:
- Colored left border on project cards
- Subtle background tint
- Portfolio name badge with theme color

## Technical Notes

- Themes support both light and dark mode
- Theme styles use Tailwind CSS utility classes
- Colors are consistent across all components
- Theme selection is optional (portfolios can have no theme)
