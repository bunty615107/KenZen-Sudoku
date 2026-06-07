/**
 * KenZen Sudoku — Lifetime Stats Screen
 * 
 * Displays aggregate statistics, win streaks, and best times.
 * Designed like a scroll of achievements.
 */

import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, GRID } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { calculateWinRate, formatTime, createInitialStats } from '../modules/scoring/scoreEngine';
import type { LifetimeStats } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'LifetimeStats'>;

export const LifetimeStatsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // In production, this would be fetched from the DB via React Query or Zustand
  // Mock data for UI development:
  const stats: LifetimeStats = useMemo(() => {
    const s = createInitialStats('user-123');
    s.totalGamesPlayed = 142;
    s.totalGamesWonAi = 85;
    s.totalGamesWonHuman = 12;
    s.totalGamesLost = 45;
    s.winStreak = 3;
    s.longestWinStreak = 11;
    s.bestTimeZenMs = 185000;      // 3m 5s
    s.bestTimeWarriorMs = 340000;  // 5m 40s
    s.bestTimeRoninMs = 620000;    // 10m 20s
    s.bestTimeBushidoMs = 1250000; // 20m 50s
    s.avgScoreZen = 12500;
    s.avgScoreWarrior = 18400;
    s.avgScoreRonin = 26000;
    s.avgScoreBushido = 41000;
    return s;
  }, []);

  const winRate = calculateWinRate(stats);
  const totalWins = stats.totalGamesWonAi + stats.totalGamesWonHuman;

  const StatBlock = ({ label, value }: { label: string; value: string | number }) => (
    <View style={[styles.statBlock, { borderColor: colors.sumi + '22' }]}>
      <Text style={[styles.statValue, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>{label}</Text>
    </View>
  );

  const DifficultyRow = ({ diff, time, score }: { diff: string; time: number | null; score: number | null }) => (
    <View style={[styles.diffRow, { borderBottomColor: colors.sumi + '22' }]}>
      <Text style={[styles.diffName, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>{diff}</Text>
      <Text style={[styles.diffTime, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
        {time ? formatTime(time) : '—'}
      </Text>
      <Text style={[styles.diffScore, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>
        {score ? Math.round(score).toLocaleString() : '—'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.sumi, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.ink, fontFamily: theme.typography.gameFont }]}>記録</Text>
        <View style={styles.backBtn} /> {/* Spacer */}
      </View>
      <Text style={[styles.subtitle, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>The Warrior's Path</Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Level Metrics */}
        <View style={styles.metricsGrid}>
          <StatBlock label="BATTLES" value={stats.totalGamesPlayed} />
          <StatBlock label="VICTORIES" value={totalWins} />
          <StatBlock label="WIN RATE" value={`${winRate}%`} />
          <StatBlock label="STREAK" value={stats.winStreak} />
        </View>

        {/* Detailed Times */}
        <View style={[styles.card, { backgroundColor: colors.washi }]}>
          <Text style={[styles.cardTitle, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>BEST PERFORMANCES</Text>
          
          <View style={styles.diffHeader}>
            <Text style={[styles.diffHeaderCol, { flex: 1, color: colors.sumi }]}>Path</Text>
            <Text style={[styles.diffHeaderCol, { width: 80, color: colors.sumi, textAlign: 'right' }]}>Time</Text>
            <Text style={[styles.diffHeaderCol, { width: 100, color: colors.sumi, textAlign: 'right' }]}>Avg Score</Text>
          </View>
          
          <DifficultyRow diff="ZEN" time={stats.bestTimeZenMs} score={stats.avgScoreZen} />
          <DifficultyRow diff="WARRIOR" time={stats.bestTimeWarriorMs} score={stats.avgScoreWarrior} />
          <DifficultyRow diff="RONIN" time={stats.bestTimeRoninMs} score={stats.avgScoreRonin} />
          <DifficultyRow diff="BUSHIDO" time={stats.bestTimeBushidoMs} score={stats.avgScoreBushido} />
        </View>

        {/* Honor Section */}
        <View style={[styles.honorSection, { borderColor: colors.ink }]}>
          <Text style={[styles.honorKanji, { color: colors.ink, fontFamily: theme.typography.gameFont }]}>誉</Text>
          <Text style={[styles.honorText, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
            Your highest unbroken chain of victories is {stats.longestWinStreak}.
            The dojo remembers your discipline.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backBtn: {
    padding: SPACING.sm,
    width: 44,
  },
  title: {
    fontSize: TYPOGRAPHY.scale['3xl'],
  },
  subtitle: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING['2xl'],
    gap: SPACING.md,
  },
  statBlock: {
    width: '47%',
    padding: SPACING.lg,
    borderWidth: 1,
    borderRadius: GRID.cellBorderRadius,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.scale['2xl'],
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.scale.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    padding: SPACING.xl,
    borderRadius: GRID.cellBorderRadius,
    marginBottom: SPACING['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 2,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  diffHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  diffHeaderCol: {
    fontSize: TYPOGRAPHY.scale.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  diffName: {
    flex: 1,
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 1,
  },
  diffTime: {
    width: 80,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.scale.sm,
    fontVariant: ['tabular-nums'],
  },
  diffScore: {
    width: 100,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.scale.sm,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  honorSection: {
    alignItems: 'center',
    padding: SPACING['2xl'],
    borderWidth: 1,
    borderRadius: GRID.cellBorderRadius,
    borderStyle: 'dashed',
  },
  honorKanji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  honorText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.scale.md,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});

export default LifetimeStatsScreen;
