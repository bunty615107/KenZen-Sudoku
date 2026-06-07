/**
 * KenZen Sudoku — Splash Screen
 * 
 * Ink-brush animated kanji (健全), fade to paper texture.
 * Validates stored session token and navigates to Home or Login.
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, ANIMATION } from '../theme/tokens';
import { bootstrapApp } from '../bootstrap';
import { useStore } from '../store/useStore';

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    let isMounted = true;
    
    async function init() {
      try {
        const authService = await bootstrapApp();
        const session = await authService.validateSession();
        
        // Ensure splash displays for at least the animation duration
        await new Promise(resolve => setTimeout(resolve, ANIMATION.splash.duration));
        
        if (isMounted) {
          if (session.valid && session.user) {
            useStore.getState().setAuth(session.user, session.token!);
          }
          onFinish(session.valid);
        }
      } catch (err) {
        console.error('Splash Init Error:', err);
        if (isMounted) {
          // Fallback to login if fatal error
          onFinish(false);
        }
      }
    }
    
    init();

    return () => {
      isMounted = false;
    };
  }, [onFinish]);

  return (
    <View style={[styles.container, { backgroundColor: colors.paper }]}>
      {/* Kanji title — 健全 */}
      <Text
        style={[
          styles.kanji,
          {
            color: colors.ink,
            fontFamily: theme.typography.gameFont,
          },
        ]}
      >
        健全
      </Text>

      {/* Romanized subtitle */}
      <Text
        style={[
          styles.subtitle,
          {
            color: colors.sumi,
            fontFamily: theme.typography.uiFont,
          },
        ]}
      >
        K E N Z E N
      </Text>

      {/* Tagline */}
      <Text
        style={[
          styles.tagline,
          {
            color: colors.sumi,
            fontFamily: theme.typography.uiFont,
          },
        ]}
      >
        The Way of Nine
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  kanji: {
    fontSize: 96,
    fontWeight: '700',
    letterSpacing: 8,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.scale.lg,
    fontWeight: '300',
    letterSpacing: 12,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: TYPOGRAPHY.scale.base,
    fontWeight: '300',
    letterSpacing: 2,
    opacity: 0.6,
  },
});

export default SplashScreen;
