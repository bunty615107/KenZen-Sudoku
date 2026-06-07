/**
 * KenZen Sudoku — GameBoard Organism Component
 * 
 * The 9×9 game grid — the dojo where the player practices their kata.
 * Implemented as a FlatList of 81 cells with React.memo on each cell.
 * Board must render at 60fps on a Pixel 6 or equivalent.
 * 
 * The board feels like hand-ruled paper with ink-line borders.
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  ListRenderItem,
} from 'react-native';
import { Cell } from '../atoms/Cell';
import { useTheme } from '../../theme/ThemeContext';
import { GRID, SPACING } from '../../theme/tokens';
import type { Board, CellState, CellValue } from '../../types';

interface GameBoardProps {
  board: Board;
  selectedCellIndex: number | null;
  onCellPress: (index: number) => void;
  solution: string;
}

interface CellRenderItem {
  index: number;
  value: CellValue;
  state: CellState;
  pencilMarks: number[];
  row: number;
  col: number;
  isGiven: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedCellIndex,
  onCellPress,
  solution,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // ─── Prepare cell data ───────────────────────────────────

  const cellData: CellRenderItem[] = useMemo(() => {
    return board.map((cell, idx) => {
      // Determine display state
      let displayState = cell.state;
      
      if (idx === selectedCellIndex) {
        displayState = 'selected';
      } else if (selectedCellIndex !== null) {
        const selectedCell = board[selectedCellIndex];
        // Highlight cells in same row, column, or box
        if (
          cell.row === selectedCell.row ||
          cell.col === selectedCell.col ||
          cell.box === selectedCell.box
        ) {
          if (displayState === 'normal') {
            displayState = 'selected'; // Subtle highlight for related cells
          }
        }
        // Highlight cells with the same value
        if (
          selectedCell.value > 0 &&
          cell.value === selectedCell.value &&
          idx !== selectedCellIndex
        ) {
          displayState = 'selected';
        }
      }
      
      return {
        index: idx,
        value: cell.value,
        state: displayState,
        pencilMarks: Array.from(cell.pencilMarks),
        row: cell.row,
        col: cell.col,
        isGiven: cell.isGiven,
      };
    });
  }, [board, selectedCellIndex]);

  // ─── Cell renderer ───────────────────────────────────────

  const renderCell: ListRenderItem<CellRenderItem> = useCallback(
    ({ item }) => (
      <Cell
        index={item.index}
        value={item.value}
        state={item.state}
        pencilMarks={item.pencilMarks}
        row={item.row}
        col={item.col}
        isGiven={item.isGiven}
        onPress={onCellPress}
      />
    ),
    [onCellPress],
  );

  const keyExtractor = useCallback(
    (item: CellRenderItem) => `cell-${item.index}`,
    [],
  );

  // ─── Render ──────────────────────────────────────────────

  return (
    <View
      style={[
        styles.boardContainer,
        {
          borderColor: colors.ink + 'CC',
          backgroundColor: colors.washi,
        },
      ]}
    >
      <FlatList
        data={cellData}
        renderItem={renderCell}
        keyExtractor={keyExtractor}
        numColumns={9}
        scrollEnabled={false}
        removeClippedSubviews={false}
        initialNumToRender={81}
        maxToRenderPerBatch={81}
        windowSize={1}
        getItemLayout={(_data, index) => ({
          length: GRID.cellMinSize,
          offset: GRID.cellMinSize * Math.floor(index / 9),
          index,
        })}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    borderWidth: GRID.subGridGapWidth,
    borderRadius: GRID.cellBorderRadius + 2,
    overflow: 'hidden',
    alignSelf: 'center',
    elevation: 0, // No shadows — ink-line borders only
  },
  flatList: {
    width: GRID.cellMinSize * 9,
  },
  flatListContent: {
    alignItems: 'center',
  },
});

export default GameBoard;
