/**
 * KenZen Sudoku — Game Screen
 * 
 * The main playing dojo. Wires up the GameBoard, NumberPad, Timer,
 * and interacts with the Zustand store and MoveRecorder.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../store/useStore';
import { GameBoard } from '../components/organisms/GameBoard';
import { NumberPad } from '../components/molecules/NumberPad';
import { TimerRing } from '../components/atoms/TimerRing';
import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, ANIMATION, GRID } from '../theme/tokens';
import { formatTimerDisplay } from '../modules/timer/timerController';
import { ONNXSLMEngine } from '../modules/slm/onnxEngine';
import { HintService } from '../modules/slm/hintService';
import type { CellValue, HintRequest } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

// Initialize the engine once
const slmEngine = new ONNXSLMEngine();
const hintService = new HintService(slmEngine);

export const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { gameId } = route.params;
  const { theme } = useTheme();
  const colors = theme.colors;

  // ─── Store State ─────────────────────────────────────────────
  const currentGame = useStore((state) => state.game.currentGame);
  const selectedCellIndex = useStore((state) => state.game.selectedCellIndex);
  const isPencilMode = useStore((state) => state.game.isPencilMode);
  const isHintModalVisible = useStore((state) => state.game.isHintModalVisible);
  const isHintLoading = useStore((state) => state.game.isHintLoading);
  const hintText = useStore((state) => state.game.hintText);

  // ─── Store Actions ───────────────────────────────────────────
  const selectCell = useStore((state) => state.selectCell);
  const placeNumber = useStore((state) => state.placeNumber);
  const eraseCell = useStore((state) => state.eraseCell);
  const togglePencilMode = useStore((state) => state.togglePencilMode);
  const togglePencilMark = useStore((state) => state.togglePencilMark);
  const useLifeline = useStore((state) => state.useLifeline);
  const showHint = useStore((state) => state.showHint);
  const hideHint = useStore((state) => state.hideHint);
  const setHintLoading = useStore((state) => state.setHintLoading);

  // Fallback if game state is lost (shouldn't happen in normal flow)
  if (!currentGame) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]}>
        <View style={styles.centerContent}>
          <Text style={{ color: colors.sumi, fontFamily: theme.typography.uiFont }}>
            Loading Dojo...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Handlers ────────────────────────────────────────────────
  
  const handleCellPress = useCallback((index: number) => {
    selectCell(index);
  }, [selectCell]);

  const handleNumberPress = useCallback((value: CellValue) => {
    if (isPencilMode) {
      togglePencilMark(value);
    } else {
      placeNumber(value);
    }
  }, [isPencilMode, togglePencilMark, placeNumber]);

  const handleLongPress = useCallback((value: number) => {
    togglePencilMark(value);
  }, [togglePencilMark]);

  const handleErase = useCallback(() => {
    eraseCell();
  }, [eraseCell]);

  const handleHintPress = useCallback(() => {
    if (selectedCellIndex === null) {
      Alert.alert('Patience', 'Select an empty cell to focus your mind first.');
      return;
    }
    if (currentGame.lifelinesUsed >= 3) {
      Alert.alert('The well is dry', 'You have exhausted your lifelines for this session.');
      return;
    }

    Alert.alert(
      'Seek Guidance',
      'Using a lifeline incurs a 15% score penalty. Are you sure you wish to disturb Sensei?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Seek Wisdom', style: 'destructive', onPress: requestHint }
      ]
    );
  }, [selectedCellIndex, currentGame.lifelinesUsed]);

  const requestHint = async () => {
    setHintLoading(true);
    showHint(''); // Opens the modal in loading state
    useLifeline();

    try {
      if (!slmEngine.isReady()) {
        await slmEngine.loadModel();
      }
      
      const request: HintRequest = {
        boardState: currentGame.board.map(c => c.value === 0 ? '.' : c.value.toString()).join(''),
        targetCell: selectedCellIndex!,
        difficulty: currentGame.difficulty,
        playerDwellTimeMs: 46000,
      };

      const response = await hintService.generateHint(request);
      showHint(response.text);
    } catch (error) {
      showHint('The spirits are clouded. No guidance can be offered at this time.');
    }
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.paper }]}>
      {/* Top Bar: Timer and Difficulty */}
      <View style={styles.topBar}>
        <Text style={[styles.difficultyText, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
          {currentGame.difficulty.toUpperCase()}
        </Text>
        <TimerRing
          size={56}
          strokeWidth={4}
          maxSeconds={currentGame.timerMaxSeconds}
          elapsedMs={currentGame.timerElapsedMs}
        >
          <Text style={[styles.timerText, { color: colors.ink, fontFamily: theme.typography.gameFont }]}>
            {formatTimerDisplay(currentGame.timerMaxSeconds > 0 ? (currentGame.timerMaxSeconds * 1000) - currentGame.timerElapsedMs : Infinity)}
          </Text>
        </TimerRing>
        <TouchableOpacity style={styles.iconButton} onPress={handleHintPress}>
          <Text style={{ color: colors.sumi, fontSize: 24, textAlign: 'right' }}>⛩️</Text>
        </TouchableOpacity>
      </View>

      {/* Main Board */}
      <View style={styles.boardWrapper}>
        <GameBoard
          board={currentGame.board}
          selectedCellIndex={selectedCellIndex}
          onCellPress={handleCellPress}
          solution={currentGame.solution}
        />
      </View>

      {/* Input Area */}
      <View style={styles.inputWrapper}>
        <NumberPad
          board={currentGame.board}
          isPencilMode={isPencilMode}
          onNumberPress={handleNumberPress}
          onErase={handleErase}
          onTogglePencil={togglePencilMode}
          onLongPress={handleLongPress}
        />
      </View>

      {/* Hint / Sensei Modal */}
      <Modal
        visible={isHintModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.washi }]}>
            {isHintLoading ? (
              <>
                <ActivityIndicator size="large" color={colors.ink} style={{ marginBottom: SPACING.md }} />
                <Text style={[styles.senseiText, { color: colors.sumi, fontFamily: theme.typography.uiFont }]}>
                  Sensei is meditating...
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.kanjiTitle, { color: colors.ink, fontFamily: theme.typography.gameFont }]}>
                  教え
                </Text>
                <Text style={[styles.hintText, { color: colors.ink, fontFamily: theme.typography.uiFont }]}>
                  {hintText}
                </Text>
                <TouchableOpacity
                  style={[styles.acknowledgeBtn, { backgroundColor: colors.ink }]}
                  onPress={hideHint}
                >
                  <Text style={[styles.acknowledgeText, { color: colors.paper }]}>Bow</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  difficultyText: {
    fontSize: TYPOGRAPHY.scale.sm,
    letterSpacing: 2,
    flex: 1,
  },
  timerText: {
    fontSize: TYPOGRAPHY.scale.xl,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    flex: 1,
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  inputWrapper: {
    paddingBottom: SPACING['2xl'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    width: '100%',
    padding: SPACING['2xl'],
    borderRadius: GRID.cellBorderRadius,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  senseiText: {
    fontSize: TYPOGRAPHY.scale.md,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  kanjiTitle: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  hintText: {
    fontSize: TYPOGRAPHY.scale.lg,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
    fontStyle: 'italic',
  },
  acknowledgeBtn: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: GRID.cellBorderRadius,
  },
  acknowledgeText: {
    fontSize: TYPOGRAPHY.scale.md,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default GameScreen;
