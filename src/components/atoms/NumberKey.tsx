/**
 * KenZen Sudoku — NumberKey Atom Component
 * 
 * Individual key in the 3×3 number pad.
 * Supports long-press for pencil mark mode.
 * Haptic feedback on every valid cell fill.
 */

import React, { memo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  AccessibilityRole,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GRID, TYPOGRAPHY } from '../../theme/tokens';

interface NumberKeyProps {
  value: number; // 1–9
  onPress: (value: number) => void;
  onLongPress: (value: number) => void;
  isDisabled: boolean;
  remainingCount: number; // How many of this number can still be placed
}

const NumberKeyComponent: React.FC<NumberKeyProps> = ({
  value,
  onPress,
  onLongPress,
  isDisabled,
  remainingCount,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      onPress(value);
    }
  }, [value, onPress, isDisabled]);

  const handleLongPress = useCallback(() => {
    if (!isDisabled) {
      onLongPress(value);
    }
  }, [value, onLongPress, isDisabled]);

  const opacity = isDisabled ? 0.3 : 1;

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      disabled={isDisabled}
      activeOpacity={0.6}
      accessibilityLabel={`Number ${value}, ${remainingCount} remaining`}
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.key,
        {
          backgroundColor: colors.washi,
          borderColor: colors.sumi + '33',
          opacity,
        },
      ]}
    >
      <Text
        style={[
          styles.keyText,
          {
            color: colors.ink,
            fontFamily: theme.typography.gameFont,
          },
        ]}
        allowFontScaling={false}
      >
        {value}
      </Text>
      {remainingCount < 9 && (
        <Text
          style={[
            styles.countText,
            {
              color: colors.sumi,
              fontFamily: theme.typography.uiFont,
            },
          ]}
          allowFontScaling={false}
        >
          {remainingCount}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  key: {
    width: GRID.numberPadSize,
    height: GRID.numberPadSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: GRID.cellBorderRadius,
    borderWidth: 1,
    margin: 3,
    position: 'relative',
  },
  keyText: {
    fontSize: TYPOGRAPHY.scale.xl,
    fontWeight: '700',
  },
  countText: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    fontSize: TYPOGRAPHY.scale.xs,
    fontWeight: '300',
  },
});

export const NumberKey = memo(NumberKeyComponent);
export default NumberKey;
