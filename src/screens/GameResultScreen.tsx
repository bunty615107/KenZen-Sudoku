/**
 * KenZen Sudoku — Game Result Screen
 * 
 * Displays the final score, time elapsed, and allows sharing the scorecard
 * or returning to the dojo.
 */

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, ANIMATION, GRID } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { SCREENS } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'GameResult'>;

export const GameResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { won, score, gameId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;

  // Fade in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION.splash.duration,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleShare = async () => {
    try {
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        await Share.open({
          url: uri,
          message: `I have mastered the KenZen Dojo with a score of ${score.toLocaleString()}!`,
          title: 'KenZen Sudoku Scroll',
        });
      }
    } catch (e: any) {
      if (e.message !== 'User did not share') {
        Alert.alert('Error', 'Could not share the scroll.');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Motif */}
        <Text style={[styles.kanji, { color: won ? colors.ink : colors.sumi, fontFamily: theme.typography.gameFont }]}>
          {won ? '勝' : '敗'}
        </Text>
        
        {/* Title */}
        <Text style={[styles.title, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>
          {won ? 'The Path is Clear' : 'The Mind Wanders'}
        </Text>
        
        {/* Haiku */}
        <Text style={[styles.haiku, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
          {won 
            ? 'Order from chaos,\nNumbers find their rightful home,\nPeace falls on the grid.'
            : 'A misplaced footstep,\nThe pattern breaks and scatters,\nTry again with grace.'}
        </Text>

        {/* Scorecard */}
        <ViewShot 
          ref={viewShotRef} 
          options={{ format: 'png', quality: 0.9 }} 
          style={[styles.scorecard, { backgroundColor: colors.washi }]}
        >
          <Text style={[styles.scoreLabel, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
            FINAL SCORE
          </Text>
          <Text style={[styles.scoreValue, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>
            {score.toLocaleString()}
          </Text>
          <Text style={[styles.watermark, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
            KenZen Sudoku
          </Text>
        </ViewShot>

        {/* Actions */}
        <View style={styles.actions}>
          {won && (
            <TouchableOpacity 
              style={[styles.btn, styles.shareBtn, { borderColor: colors.ink }]}
              onPress={handleShare}
            >
              <Text style={[styles.btnText, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>Share Scroll</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.btn, styles.returnBtn, { backgroundColor: colors.ink }]}
            onPress={() => navigation.replace(SCREENS.HOME)}
          >
            <Text style={[styles.btnText, { color: colors.paper, fontFamily: theme.typography.uiFont }]}>Return to Dojo</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  kanji: {
    fontSize: 120,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.scale['2xl'],
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  haiku: {
    fontSize: TYPOGRAPHY.scale.md,
    lineHeight: 28,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: SPACING['3xl'],
  },
  scorecard: {
    padding: SPACING.xl,
    borderRadius: GRID.cellBorderRadius,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: SPACING['3xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.scale['4xl'],
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  watermark: {
    fontSize: TYPOGRAPHY.scale.xs,
    fontStyle: 'italic',
    opacity: 0.5,
  },
  actions: {
    width: '100%',
    maxWidth: 300,
    gap: SPACING.md,
  },
  btn: {
    width: '100%',
    paddingVertical: SPACING.lg,
    borderRadius: GRID.cellBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    borderWidth: 1,
  },
  returnBtn: {
    // Background set dynamically
  },
  btnText: {
    fontSize: TYPOGRAPHY.scale.md,
    letterSpacing: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});

export default GameResultScreen;
