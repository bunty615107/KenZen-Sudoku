/**
 * KenZen Sudoku — Cell Atom Component
 * 
 * The fundamental building block of the game board.
 * Each cell is a shodo (書道) practice square.
 * 
 * Cell states: Normal | Selected | Conflict | Locked | Hint-revealed
 * Memoized — re-renders ONLY when its own value or state changes.
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AccessibilityRole,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GRID, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import type { CellState, CellValue } from '../../types';

interface CellProps {
  index: number;
  value: CellValue;
  state: CellState;
  pencilMarks: number[];
  row: number;
  col: number;
  isGiven: boolean;
  onPress: (index: number) => void;
}

const CellComponent: React.FC<CellProps> = ({
  index,
  value,
  state,
  pencilMarks,
  row,
  col,
  isGiven,
  onPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = useCallback(() => {
    onPress(index);
  }, [index, onPress]);

  // ─── Dynamic Styles ──────────────────────────────────────
  
  const cellBackgroundColor = useMemo(() => {
    switch (state) {
      case 'selected':
        return colors.indigo + '22'; // 13% opacity indigo wash
      case 'conflict':
        return colors.vermilion + '18'; // 9% opacity vermilion
      case 'hint-revealed':
        return colors.gold + '1A'; // 10% opacity gold
      case 'locked':
      case 'normal':
      default:
        return 'transparent';
    }
  }, [state, colors]);

  const textColor = useMemo(() => {
    if (state === 'conflict') return colors.vermilion;
    if (state === 'hint-revealed') return colors.gold;
    if (isGiven) return colors.ink;
    return colors.indigo;
  }, [state, isGiven, colors]);

  const fontWeight = isGiven ? '700' : '400';

  // ─── Border Logic ────────────────────────────────────────
  // Sub-grid boundaries: 2dp at 80% opacity
  // Inner cell boundaries: 0.5dp at 40% opacity

  const borderRightWidth = (col + 1) % 3 === 0 && col < 8
    ? GRID.subGridGapWidth
    : GRID.cellGapWidth;

  const borderBottomWidth = (row + 1) % 3 === 0 && row < 8
    ? GRID.subGridGapWidth
    : GRID.cellGapWidth;

  const borderRightColor = (col + 1) % 3 === 0 && col < 8
    ? colors.ink + 'CC' // 80% opacity
    : colors.sumi + '66'; // 40% opacity

  const borderBottomColor = (row + 1) % 3 === 0 && row < 8
    ? colors.ink + 'CC'
    : colors.sumi + '66';

  // ─── Accessibility ───────────────────────────────────────

  const accessibilityLabel = useMemo(() => {
    const rowLabel = `Row ${row + 1}`;
    const colLabel = `Column ${col + 1}`;
    const valueLabel = value > 0 ? `Value ${value}` : 'Empty';
    const stateLabel = isGiven ? 'Given' : state;
    return `${rowLabel}, ${colLabel}, ${valueLabel}, ${stateLabel}`;
  }, [row, col, value, isGiven, state]);

  // ─── Render ──────────────────────────────────────────────

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isGiven}
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityState={{ disabled: isGiven }}
      style={[
        styles.cell,
        {
          backgroundColor: cellBackgroundColor,
          borderRightWidth,
          borderBottomWidth,
          borderRightColor,
          borderBottomColor,
        },
      ]}
    >
      {value > 0 ? (
        <Text
          style={[
            styles.cellText,
            {
              color: textColor,
              fontWeight,
              fontFamily: theme.typography.gameFont,
            },
          ]}
          allowFontScaling={false}
        >
          {value}
        </Text>
      ) : pencilMarks.length > 0 ? (
        <View style={styles.pencilGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <Text
              key={num}
              style={[
                styles.pencilText,
                {
                  color: pencilMarks.includes(num)
                    ? colors.sumi
                    : 'transparent',
                  fontFamily: theme.typography.uiFont,
                },
              ]}
              allowFontScaling={false}
            >
              {num}
            </Text>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  cell: {
    width: GRID.cellMinSize,
    height: GRID.cellMinSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: GRID.cellBorderRadius,
  },
  cellText: {
    fontSize: TYPOGRAPHY.scale['2xl'],
    textAlign: 'center',
    lineHeight: GRID.cellMinSize,
  },
  pencilGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
  },
  pencilText: {
    fontSize: TYPOGRAPHY.scale.xs,
    width: '33.33%',
    textAlign: 'center',
    lineHeight: GRID.cellMinSize / 3.5,
  },
});

// ─── Memoized Export ──────────────────────────────────────────
// Re-renders ONLY when props change (value, state, pencilMarks)

export const Cell = memo(CellComponent, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.state === next.state &&
    prev.isGiven === next.isGiven &&
    prev.index === next.index &&
    prev.pencilMarks.length === next.pencilMarks.length &&
    prev.pencilMarks.every((v, i) => v === next.pencilMarks[i])
  );
});

export default Cell;
