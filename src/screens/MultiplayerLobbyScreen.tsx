/**
 * KenZen Sudoku — Multiplayer Lobby Screen
 * 
 * Allows users to host or join a game via Wi-Fi Direct, Bluetooth, or Deep Links.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, GRID } from '../theme/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MultiplayerLobby'>;

type TabType = 'WIFI' | 'BLUETOOTH' | 'LINK';

export const MultiplayerLobbyScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [activeTab, setActiveTab] = useState<TabType>('WIFI');
  const [isDiscovering, setIsDiscovering] = useState(false);

  const renderTabHeader = (title: string, tab: TabType) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tabHeader,
          isActive && { borderBottomColor: colors.ink, borderBottomWidth: 2 },
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Text
          style={[
            styles.tabText,
            { color: isActive ? colors.ink : colors.sumi, fontFamily: theme.typography.uiFont },
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderWifiContent = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.instruction, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
        Connect directly to a nearby warrior without internet.
      </Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.ink }]}>
          <Text style={[styles.btnText, { color: colors.paper, fontFamily: theme.typography.uiFont }]}>Host Game</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.outlineBtn, { borderColor: colors.ink }]}>
          <Text style={[styles.btnText, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>Scan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deviceList}>
        <Text style={[styles.listHeader, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>Nearby Devices</Text>
        {isDiscovering ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: SPACING.lg }} />
        ) : (
          <Text style={[styles.emptyText, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
            No devices found. Tap Scan.
          </Text>
        )}
      </View>
    </View>
  );

  const renderBluetoothContent = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.instruction, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
        Duel against paired devices.
      </Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.ink }]}>
          <Text style={[styles.btnText, { color: colors.paper, fontFamily: theme.typography.uiFont }]}>Await Challenger</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deviceList}>
        <Text style={[styles.listHeader, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>Paired Devices</Text>
        <Text style={[styles.emptyText, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
          You must pair via Android Settings first.
        </Text>
      </View>
    </View>
  );

  const renderLinkContent = () => (
    <View style={styles.tabContent}>
      <Text style={[styles.instruction, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
        Send a sealed scroll to challenge anyone anywhere.
      </Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.ink }]}>
          <Text style={[styles.btnText, { color: colors.paper, fontFamily: theme.typography.uiFont }]}>Create Scroll</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.outlineBtn, { borderColor: colors.ink }]}>
          <Text style={[styles.btnText, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>Paste Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink, fontFamily: theme.typography.gameFont }]}>交戦</Text>
        <Text style={[styles.subtitle, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>Multiplayer</Text>
      </View>

      <View style={styles.tabsContainer}>
        {renderTabHeader('Wi-Fi', 'WIFI')}
        {renderTabHeader('Bluetooth', 'BLUETOOTH')}
        {renderTabHeader('Scroll', 'LINK')}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'WIFI' && renderWifiContent()}
        {activeTab === 'BLUETOOTH' && renderBluetoothContent()}
        {activeTab === 'LINK' && renderLinkContent()}
      </ScrollView>

      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backText, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>Return to Dojo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.scale['3xl'],
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  tabText: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 1,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },
  tabContent: {
    flex: 1,
  },
  instruction: {
    fontSize: TYPOGRAPHY.scale.base,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
    fontStyle: 'italic',
    opacity: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING['2xl'],
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: GRID.cellBorderRadius,
    alignItems: 'center',
  },
  outlineBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: TYPOGRAPHY.scale.sm,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  deviceList: {
    flex: 1,
  },
  listHeader: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.scale.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  backBtn: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  backText: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default MultiplayerLobbyScreen;
