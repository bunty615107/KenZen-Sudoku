/**
 * KenZen Sudoku — Home / Lobby Screen
 * 
 * Play vs AI, multiplayer modes, lifetime stats strip.
 * The gateway to all game modes — designed as a serene dojo entrance.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, GRID } from '../theme/tokens';
import type { LifetimeStats } from '../types';
import { calculateWinRate, formatScore } from '../modules/scoring/scoreEngine';

interface HomeScreenProps {
  userName: string;
  stats: LifetimeStats | null;
  onPlaySolo: () => void;
  onPlayVsAI: () => void;
  onMultiplayer: () => void;
  onViewStats: () => void;
  onProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName,
  stats,
  onPlaySolo,
  onPlayVsAI,
  onMultiplayer,
  onViewStats,
  onProfile,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.paper }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.greeting,
            { color: colors.sumi, fontFamily: theme.typography.uiFont },
          ]}
        >
          Welcome back
        </Text>
        <Text
          style={[
            styles.userName,
            { color: colors.ink, fontFamily: theme.typography.gameFont },
          ]}
        >
          {userName}
        </Text>
      </View>

      {/* Stats Strip */}
      {stats && (
        <View style={[styles.statsStrip, { backgroundColor: colors.washi, borderColor: colors.sumi + '22' }]}>
          <View style={styles.statItem}>
            <Text
              style={[styles.statValue, { color: colors.gold, fontFamily: theme.typography.gameFont }]}
            >
              {stats.totalGamesPlayed}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}
            >
              Games
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.sumi + '22' }]} />

          <View style={styles.statItem}>
            <Text
              style={[styles.statValue, { color: colors.gold, fontFamily: theme.typography.gameFont }]}
            >
              {calculateWinRate(stats)}%
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}
            >
              Win Rate
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.sumi + '22' }]} />

          <View style={styles.statItem}>
            <Text
              style={[styles.statValue, { color: colors.gold, fontFamily: theme.typography.gameFont }]}
            >
              {stats.longestWinStreak}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}
            >
              Best Streak
            </Text>
          </View>
        </View>
      )}

      {/* Game Mode Buttons */}
      <View style={styles.modesContainer}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.ink, fontFamily: theme.typography.uiFont },
          ]}
        >
          Choose Your Path
        </Text>

        {/* Solo Mode */}
        <TouchableOpacity
          onPress={onPlaySolo}
          style={[styles.modeCard, { backgroundColor: colors.washi, borderColor: colors.sumi + '22' }]}
          accessibilityLabel="Play solo"
          accessibilityRole="button"
        >
          <View style={styles.modeCardContent}>
            <Text style={[styles.modeEmoji]}>🧘</Text>
            <View style={styles.modeTextContainer}>
              <Text
                style={[
                  styles.modeTitle,
                  { color: colors.ink, fontFamily: theme.typography.gameFont },
                ]}
              >
                Solo Practice
              </Text>
              <Text
                style={[
                  styles.modeDescription,
                  { color: colors.sumi, fontFamily: theme.typography.uiFont },
                ]}
              >
                Perfect your kata in solitude
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* VS AI Mode */}
        <TouchableOpacity
          onPress={onPlayVsAI}
          style={[styles.modeCard, { backgroundColor: colors.washi, borderColor: colors.sumi + '22' }]}
          accessibilityLabel="Play versus AI"
          accessibilityRole="button"
        >
          <View style={styles.modeCardContent}>
            <Text style={[styles.modeEmoji]}>⚔️</Text>
            <View style={styles.modeTextContainer}>
              <Text
                style={[
                  styles.modeTitle,
                  { color: colors.ink, fontFamily: theme.typography.gameFont },
                ]}
              >
                Challenge Sensei
              </Text>
              <Text
                style={[
                  styles.modeDescription,
                  { color: colors.sumi, fontFamily: theme.typography.uiFont },
                ]}
              >
                Face the AI opponent in battle
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Multiplayer Mode */}
        <TouchableOpacity
          onPress={onMultiplayer}
          style={[styles.modeCard, { backgroundColor: colors.washi, borderColor: colors.sumi + '22' }]}
          accessibilityLabel="Multiplayer"
          accessibilityRole="button"
        >
          <View style={styles.modeCardContent}>
            <Text style={[styles.modeEmoji]}>🏯</Text>
            <View style={styles.modeTextContainer}>
              <Text
                style={[
                  styles.modeTitle,
                  { color: colors.ink, fontFamily: theme.typography.gameFont },
                ]}
              >
                Multiplayer Dojo
              </Text>
              <Text
                style={[
                  styles.modeDescription,
                  { color: colors.sumi, fontFamily: theme.typography.uiFont },
                ]}
              >
                Wi-Fi · Bluetooth · Share Link
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          onPress={onViewStats}
          style={[styles.bottomButton, { borderColor: colors.sumi + '33' }]}
          accessibilityLabel="View lifetime statistics"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.bottomButtonText,
              { color: colors.sumi, fontFamily: theme.typography.uiFont },
            ]}
          >
            📊  Lifetime Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onProfile}
          style={[styles.bottomButton, { borderColor: colors.sumi + '33' }]}
          accessibilityLabel="Profile and settings"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.bottomButtonText,
              { color: colors.sumi, fontFamily: theme.typography.uiFont },
            ]}
          >
            ⚙️  Settings
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
  },
  header: {
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: TYPOGRAPHY.scale.base,
    fontWeight: '300',
    letterSpacing: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.scale.xl,
    fontWeight: '700',
    marginTop: SPACING.xxs,
  },
  statsStrip: {
    flexDirection: 'row',
    borderRadius: GRID.cellBorderRadius + 4,
    borderWidth: 1,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING['2xl'],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.scale.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.scale.xs,
    fontWeight: '300',
    marginTop: SPACING.xxs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  modesContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.scale.sm,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  modeCard: {
    borderRadius: GRID.cellBorderRadius + 4,
    borderWidth: 1,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeEmoji: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: TYPOGRAPHY.scale.lg,
    fontWeight: '700',
    marginBottom: SPACING.xxs,
  },
  modeDescription: {
    fontSize: TYPOGRAPHY.scale.sm,
    fontWeight: '300',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  bottomButton: {
    flex: 1,
    borderRadius: GRID.cellBorderRadius + 4,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: TYPOGRAPHY.scale.sm,
    fontWeight: '400',
  },
});

export default HomeScreen;
