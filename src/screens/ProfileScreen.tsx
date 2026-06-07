/**
 * KenZen Sudoku — Profile & Settings Screen
 * 
 * Manages user preferences, theme toggling, and authentication state.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, GRID } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { SCREENS } from '../navigation/types';
import { useStore } from '../store/useStore';
import { getAuthService } from '../bootstrap';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const colors = theme.colors;

  const authUser = useStore((state) => state.auth.user);
  const clearAuth = useStore((state) => state.clearAuth);

  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Depart the Dojo',
      'Are you sure you wish to leave?',
      [
        { text: 'Stay', style: 'cancel' },
        { 
          text: 'Depart', 
          style: 'destructive',
          onPress: async () => {
            try {
              const authService = getAuthService();
              await authService.logout();
            } catch (e) {
              console.error('Logout failed natively', e);
            } finally {
              clearAuth();
              navigation.reset({
                index: 0,
                routes: [{ name: SCREENS.SPLASH }],
              });
            }
          }
        }
      ]
    );
  };

  const SettingRow = ({ 
    label, 
    value, 
    onToggle 
  }: { 
    label: string; 
    value: boolean; 
    onToggle: (v: boolean) => void 
  }) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.sumi + '22' }]}>
      <Text style={[styles.settingLabel, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>{label}</Text>
      <Switch
        trackColor={{ false: colors.sumi + '44', true: colors.ink }}
        thumbColor={colors.paper}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.sumi, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.ink, fontFamily: theme.typography.gameFont }]}>道場</Text>
        <View style={styles.backBtn} />
      </View>
      <Text style={[styles.subtitle, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>Dojo Settings</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: colors.washi }]}>
          <Text style={[styles.cardTitle, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>IDENTIFICATION</Text>
          <Text style={[styles.emailText, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>
            {authUser?.email || 'Wandering Samurai'}
          </Text>
          <Text style={[styles.statusText, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
            Rank: Bushido Initiate
          </Text>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>PREFERENCES</Text>
          <SettingRow label="Dark Washi (Night Mode)" value={isDark} onToggle={toggleTheme} />
          <SettingRow label="Tactile Feedback" value={hapticsEnabled} onToggle={setHapticsEnabled} />
          <SettingRow label="Zen Chimes (Sound)" value={soundEnabled} onToggle={setSoundEnabled} />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.btn, styles.outlineBtn, { borderColor: colors.ink }]}
            onPress={handleLogout}
          >
            <Text style={[styles.btnText, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>Depart Dojo (Log Out)</Text>
          </TouchableOpacity>
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
  card: {
    padding: SPACING.xl,
    borderRadius: GRID.cellBorderRadius,
    marginBottom: SPACING['3xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.scale.xs,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  emailText: {
    fontSize: TYPOGRAPHY.scale.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.scale.sm,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: SPACING['3xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.scale.xs,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.scale.md,
    letterSpacing: 1,
  },
  btn: {
    width: '100%',
    paddingVertical: SPACING.lg,
    borderRadius: GRID.cellBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 1,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default ProfileScreen;
