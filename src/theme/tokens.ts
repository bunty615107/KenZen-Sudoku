/**
 * KenZen Sudoku — Design Token System
 * 
 * Bushido-inspired design tokens following the three philosophical lenses:
 * Ma (間) — negative space | Wabi-sabi — beauty in imperfection | Bushido — discipline
 * 
 * All tokens are exported as a JSON-compatible object for consumption
 * by the ThemeContext and Figma design system.
 */

import { Theme, ThemeColors } from '../types';

// ─── Color Tokens ─────────────────────────────────────────────

export const LIGHT_COLORS: ThemeColors = {
  ink: '#1A1A1A',        // Primary text, grid lines, numbers
  paper: '#F5F0E8',      // App background (aged parchment)
  washi: '#EAE4D8',      // Card surfaces, cell backgrounds
  vermilion: '#C0392B',  // Errors, invalid moves, lifeline alert
  indigo: '#2C3E7A',     // Selected cells, active state
  sumi: '#4A4A4A',       // Secondary text, grid separators
  gold: '#B8860B',       // Score highlights, win state, hints
};

export const DARK_COLORS: ThemeColors = {
  ink: '#F0EDE8',        // Primary text, grid lines, numbers
  paper: '#0E0D0B',      // App background (sumi night)
  washi: '#1A1814',      // Card surfaces, cell backgrounds
  vermilion: '#E74C3C',  // Errors, invalid moves, lifeline alert
  indigo: '#6C7FBF',     // Selected cells, active state
  sumi: '#B0A898',       // Secondary text, grid separators
  gold: '#DAA520',       // Score highlights, win state, hints
};

// ─── Typography Tokens ────────────────────────────────────────

export const TYPOGRAPHY = {
  gameFont: 'NotoSerifJP',       // All numbers on game board
  uiFont: 'NotoSansJP',          // All UI chrome text
  
  // Font weight mappings
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    bold: '700',
  },
  
  // Type scale (modular scale, base 16dp, ratio 1.25)
  scale: {
    xs: 10,      // Pencil marks, timestamps
    sm: 12,      // Captions, helper text
    base: 14,    // Body text
    md: 16,      // Default UI text
    lg: 20,      // Section headers
    xl: 24,      // Screen titles
    '2xl': 30,   // Game board numbers
    '3xl': 36,   // Score displays
    '4xl': 48,   // Splash kanji
  },
};

// ─── Spacing Tokens ───────────────────────────────────────────
// Base: 4dp grid (Material You aligned)

export const SPACING = {
  xxs: 2,    // Cell borders, micro gaps
  xs: 4,     // Base unit
  sm: 8,     // Tight spacing
  md: 12,    // Default padding
  lg: 16,    // Section spacing
  xl: 24,    // Card padding
  '2xl': 32, // Screen margins
  '3xl': 48, // Major section breaks
  '4xl': 64, // Splash spacing
};

// ─── Grid Tokens ──────────────────────────────────────────────

export const GRID = {
  cellBorderRadius: 2,                    // Near-square, minimal rounding
  subGridGapWidth: 2,                     // 3×3 boundary lines
  subGridGapOpacity: 0.8,                 // --color-ink at 80%
  cellGapWidth: 0.5,                      // Inner cell boundaries
  cellGapOpacity: 0.4,                    // --color-sumi at 40%
  cellMinSize: 44,                        // Material You touch target
  numberPadSize: 56,                      // Number pad button size
};

// ─── Elevation Tokens ─────────────────────────────────────────
// Only two levels: flat paper + raised washi. No shadows.

export const ELEVATION = {
  flat: {
    borderWidth: 0,
    elevation: 0,
  },
  raised: {
    borderWidth: 1,  // Ink-line border only
    elevation: 0,    // No shadow
  },
};

// ─── Animation Tokens ─────────────────────────────────────────

export const ANIMATION = {
  // Board entrance: cells emerge like ink drying
  boardEntrance: {
    duration: 600,        // ms, staggered
    staggerDelay: 8,      // ms per cell
    easing: 'easeOut',
  },
  // Cell selection: subtle indigo wash
  cellSelection: {
    duration: 120,
    easing: 'easeInOut',
  },
  // Error shake: 4dp horizontal, 3 cycles
  errorShake: {
    displacement: 4,      // dp
    cycles: 3,
    duration: 200,
    easing: 'easeInOut',
  },
  // Win state: sumi-e brush stroke sweep
  winBrushStroke: {
    duration: 1200,
    easing: 'easeOut',
  },
  // Timer ring depletion
  timerRing: {
    updateInterval: 100,  // ms
  },
  // Screen transitions
  screenTransition: {
    duration: 300,
    easing: 'easeInOut',
  },
  // Splash ink brush animation
  splash: {
    duration: 2000,
    fadeDelay: 1500,
  },
};

// ─── Composed Themes ──────────────────────────────────────────

export const LIGHT_THEME: Theme = {
  mode: 'light',
  colors: LIGHT_COLORS,
  typography: {
    gameFont: TYPOGRAPHY.gameFont,
    uiFont: TYPOGRAPHY.uiFont,
  },
};

export const DARK_THEME: Theme = {
  mode: 'dark',
  colors: DARK_COLORS,
  typography: {
    gameFont: TYPOGRAPHY.gameFont,
    uiFont: TYPOGRAPHY.uiFont,
  },
};

// ─── Token Export (JSON-compatible) ───────────────────────────

export const DESIGN_TOKENS = {
  colors: {
    light: LIGHT_COLORS,
    dark: DARK_COLORS,
  },
  typography: TYPOGRAPHY,
  spacing: SPACING,
  grid: GRID,
  elevation: ELEVATION,
  animation: ANIMATION,
};

export default DESIGN_TOKENS;
