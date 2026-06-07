/**
 * KenZen Sudoku — NumberPad Molecule Component
 * 
 * Custom 3×3 number pad (NOT a keyboard).
 * Numbers 1–9 arranged in a 3×3 grid.
 * Supports long-press for pencil mark mode.
 * Includes erase and pencil mode toggle buttons.
 */

import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { NumberKey } from '../atoms/NumberKey';
import { useTheme } from '../../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, GRID } from '../../theme/tokens';
import type { Board, CellValue } from '../../types';

interface NumberPadProps {
  board: Board;
  isPencilMode: boolean;
  onNumberPress: (value: CellValue) => void;
  onErase: () => void;
  onTogglePencil: () => void;
  onLongPress: (value: number) => void;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  board,
  isPencilMode,
  onNumberPress,
  onErase,
  onTogglePencil,
  onLongPress,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Count remaining numbers
  const remainingCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let n = 1; n <= 9; n++) {
      const placed = board.filter(cell => cell.value === n).length;
      counts[n] = 9 - placed;
    }
    return counts;
  }, [board]);

  const handleNumberPress = useCallback(
    (value: number) => {
      onNumberPress(value as CellValue);
    },
    [onNumberPress],
  );

  const numbers = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  return (
    <View style={styles.container}>
      {/* Number grid */}
      <View style={styles.numberGrid}>
        {numbers.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map(num => (
              <NumberKey
                key={num}
                value={num}
                onPress={handleNumberPress}
                onLongPress={onLongPress}
                isDisabled={remainingCounts[num] === 0}
                remainingCount={remainingCounts[num]}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {/* Erase button */}
        <TouchableOpacity
          onPress={onErase}
          style={[
            styles.actionButton,
            { backgroundColor: colors.washi, borderColor: colors.sumi + '33' },
          ]}
          accessibilityLabel="Erase cell"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.actionText,
              { color: colors.vermilion, fontFamily: theme.typography.uiFont },
            ]}
          >
            ✕
          </Text>
        </TouchableOpacity>

        {/* Pencil mode toggle */}
        <TouchableOpacity
          onPress={onTogglePencil}
          style={[
            styles.actionButton,
            {
              backgroundColor: isPencilMode
                ? colors.indigo + '22'
                : colors.washi,
              borderColor: isPencilMode
                ? colors.indigo
                : colors.sumi + '33',
            },
          ]}
          accessibilityLabel={`Pencil mode ${isPencilMode ? 'on' : 'off'}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isPencilMode }}
        >
          <Text
            style={[
              styles.actionText,
              {
                color: isPencilMode ? colors.indigo : colors.sumi,
                fontFamily: theme.typography.uiFont,
              },
            ]}
          >
            ✎
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  numberGrid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  actionButton: {
    width: GRID.numberPadSize * 1.5,
    height: GRID.numberPadSize * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: GRID.cellBorderRadius,
    borderWidth: 1,
  },
  actionText: {
    fontSize: TYPOGRAPHY.scale.lg,
    fontWeight: '500',
  },
});

export default NumberPad;
