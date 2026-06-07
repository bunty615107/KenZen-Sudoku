/**
 * KenZen Sudoku — Timer Ring
 * 
 * A Skia-powered canvas arc showing the remaining time.
 * Smoothly interpolates the elapsed time to draw a dynamic ring.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useTheme } from '../../theme/ThemeContext';

interface TimerRingProps {
  size: number;
  strokeWidth: number;
  maxSeconds: number;
  elapsedMs: number;
  children?: React.ReactNode;
}

export const TimerRing: React.FC<TimerRingProps> = ({
  size,
  strokeWidth,
  maxSeconds,
  elapsedMs,
  children,
}) => {
  const { theme } = useTheme();
  
  // If no max timer, just return the children (unlimited mode)
  if (maxSeconds === 0) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </View>
    );
  }

  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const maxMs = maxSeconds * 1000;
  
  // Calculate percentage remaining (0 to 1)
  const remainingPercent = Math.max(0, 1 - (elapsedMs / maxMs));
  
  // Create path for the background ring
  const bgPath = Skia.Path.Make();
  bgPath.addCircle(center, center, radius);

  // Create path for the foreground arc
  const fgPath = Skia.Path.Make();
  // Start from top (-90 degrees)
  const startAngle = -90;
  // Sweep angle based on remaining time (360 degrees * percent)
  const sweepAngle = 360 * remainingPercent;
  
  // Note: Skia's addArc takes a bounding rect (left, top, right, bottom)
  fgPath.addArc(
    {
      x: strokeWidth / 2,
      y: strokeWidth / 2,
      width: size - strokeWidth,
      height: size - strokeWidth,
    },
    startAngle,
    sweepAngle
  );

  // Determine color (turn red if in danger zone <= 20%)
  const isDanger = remainingPercent <= 0.2;
  const fgColor = isDanger ? theme.colors.vermilion : theme.colors.ink;
  const bgColor = theme.colors.sumi + '22'; // 22 hex = ~13% opacity

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={bgPath}
          color={bgColor}
          style="stroke"
          strokeWidth={strokeWidth}
        />
        <Path
          path={fgPath}
          color={fgColor}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        />
      </Canvas>
      <View style={styles.centerContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
