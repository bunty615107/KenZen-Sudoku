/**
 * KenZen Sudoku — Dancing Links (DLX) Solver
 * 
 * Implementation of Donald Knuth's Algorithm X with Dancing Links
 * for solving the exact cover problem inherent in Sudoku.
 * 
 * Pure TypeScript — no React Native imports. Fully testable with Jest.
 * 
 * Constraint columns for a 9×9 Sudoku (324 total):
 *   - Cell constraints (81): Each cell must have exactly one number
 *   - Row constraints (81): Each row must have each number 1–9
 *   - Col constraints (81): Each column must have each number 1–9
 *   - Box constraints (81): Each 3×3 box must have each number 1–9
 */

// ─── DLX Node Structure ──────────────────────────────────────

interface DLXNode {
  left: DLXNode;
  right: DLXNode;
  up: DLXNode;
  down: DLXNode;
  column: ColumnNode;
  rowIndex: number;
}

interface ColumnNode extends DLXNode {
  size: number;
  name: string;
}

// ─── DLX Solver ───────────────────────────────────────────────

export class DLXSolver {
  private header: ColumnNode;
  private columns: ColumnNode[];
  private solutions: number[][];
  private currentSolution: number[];
  private maxSolutions: number;

  constructor() {
    this.header = this.createHeaderNode();
    this.columns = [];
    this.solutions = [];
    this.currentSolution = [];
    this.maxSolutions = 2; // For uniqueness check, we only need to find 2
  }

  private createHeaderNode(): ColumnNode {
    const node = {} as ColumnNode;
    node.left = node;
    node.right = node;
    node.up = node;
    node.down = node;
    node.column = node;
    node.size = 0;
    node.name = 'header';
    node.rowIndex = -1;
    return node;
  }

  private createColumnNode(name: string): ColumnNode {
    const node = {} as ColumnNode;
    node.up = node;
    node.down = node;
    node.column = node;
    node.size = 0;
    node.name = name;
    node.rowIndex = -1;

    // Insert to the left of header (i.e., at the end of the row)
    node.right = this.header;
    node.left = this.header.left;
    this.header.left.right = node;
    this.header.left = node;

    return node;
  }

  /**
   * Build the DLX matrix for a standard 9×9 Sudoku.
   * 
   * @param puzzle - 81-char string (0 = empty, 1-9 = given)
   */
  public buildMatrix(puzzle: string): void {
    // Reset
    this.header = this.createHeaderNode();
    this.columns = [];
    this.solutions = [];
    this.currentSolution = [];

    // Create 324 column nodes
    for (let i = 0; i < 324; i++) {
      const col = this.createColumnNode(`C${i}`);
      this.columns.push(col);
    }

    // Create rows for each possible placement
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cellIndex = row * 9 + col;
        const givenValue = parseInt(puzzle[cellIndex], 10);
        const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

        const startNum = givenValue > 0 ? givenValue : 1;
        const endNum = givenValue > 0 ? givenValue : 9;

        for (let num = startNum; num <= endNum; num++) {
          const rowIdx = cellIndex * 9 + (num - 1);

          // Four constraints for this placement
          const cellConstraint = cellIndex;               // 0–80
          const rowConstraint = 81 + row * 9 + (num - 1); // 81–161
          const colConstraint = 162 + col * 9 + (num - 1);// 162–242
          const boxConstraint = 243 + box * 9 + (num - 1);// 243–323

          const constraintIndices = [
            cellConstraint,
            rowConstraint,
            colConstraint,
            boxConstraint,
          ];

          this.addRow(rowIdx, constraintIndices);
        }
      }
    }
  }

  private addRow(rowIndex: number, columnIndices: number[]): void {
    let firstNode: DLXNode | null = null;
    let prevNode: DLXNode | null = null;

    for (const colIdx of columnIndices) {
      const col = this.columns[colIdx];
      const node: DLXNode = {
        rowIndex,
        column: col,
      } as DLXNode;

      // Vertical linking
      node.up = col.up;
      node.down = col;
      col.up.down = node;
      col.up = node;
      col.size++;

      // Horizontal linking
      if (firstNode === null) {
        firstNode = node;
        node.left = node;
        node.right = node;
      } else {
        node.right = firstNode;
        node.left = firstNode.left;
        firstNode.left.right = node;
        firstNode.left = node;
      }

      prevNode = node;
    }
  }

  /**
   * Solve using Algorithm X with Dancing Links.
   * Returns all solutions found (up to maxSolutions).
   */
  public solve(maxSolutions: number = 2): number[][] {
    this.maxSolutions = maxSolutions;
    this.solutions = [];
    this.currentSolution = [];
    this.search(0);
    return this.solutions;
  }

  private search(depth: number): void {
    if (this.solutions.length >= this.maxSolutions) {
      return;
    }

    if (this.header.right === this.header) {
      // All columns covered — solution found
      this.solutions.push([...this.currentSolution]);
      return;
    }

    // Choose column with minimum size (S heuristic)
    const col = this.chooseColumn();
    if (col.size === 0) {
      return; // Dead end
    }

    this.cover(col);

    let rowNode = col.down;
    while (rowNode !== col) {
      this.currentSolution.push(rowNode.rowIndex);

      let rightNode = rowNode.right;
      while (rightNode !== rowNode) {
        this.cover(rightNode.column);
        rightNode = rightNode.right;
      }

      this.search(depth + 1);

      if (this.solutions.length >= this.maxSolutions) {
        return;
      }

      this.currentSolution.pop();

      let leftNode = rowNode.left;
      while (leftNode !== rowNode) {
        this.uncover(leftNode.column);
        leftNode = leftNode.left;
      }

      rowNode = rowNode.down;
    }

    this.uncover(col);
  }

  private chooseColumn(): ColumnNode {
    let minSize = Infinity;
    let minCol = this.header.right as ColumnNode;
    let col = this.header.right as ColumnNode;

    while (col !== this.header) {
      if (col.size < minSize) {
        minSize = col.size;
        minCol = col;
      }
      col = col.right as ColumnNode;
    }

    return minCol;
  }

  private cover(col: ColumnNode): void {
    col.right.left = col.left;
    col.left.right = col.right;

    let rowNode = col.down;
    while (rowNode !== col) {
      let rightNode = rowNode.right;
      while (rightNode !== rowNode) {
        rightNode.down.up = rightNode.up;
        rightNode.up.down = rightNode.down;
        rightNode.column.size--;
        rightNode = rightNode.right;
      }
      rowNode = rowNode.down;
    }
  }

  private uncover(col: ColumnNode): void {
    let rowNode = col.up;
    while (rowNode !== col) {
      let leftNode = rowNode.left;
      while (leftNode !== rowNode) {
        leftNode.column.size++;
        leftNode.down.up = leftNode;
        leftNode.up.down = leftNode;
        leftNode = leftNode.left;
      }
      rowNode = rowNode.up;
    }

    col.right.left = col;
    col.left.right = col;
  }
}

/**
 * Convert a DLX solution (array of row indices) to a 9×9 grid.
 * Each row index encodes: cellIndex * 9 + (number - 1)
 */
export function dlxSolutionToGrid(solution: number[]): number[] {
  const grid = new Array(81).fill(0);
  for (const rowIdx of solution) {
    const cellIndex = Math.floor(rowIdx / 9);
    const num = (rowIdx % 9) + 1;
    grid[cellIndex] = num;
  }
  return grid;
}

/**
 * Solve a Sudoku puzzle and return solutions.
 * 
 * @param puzzle - 81-char string
 * @param maxSolutions - Maximum solutions to find (default 2 for uniqueness check)
 * @returns Array of solved grids (each is a 81-element number array)
 */
export function solvePuzzle(puzzle: string, maxSolutions: number = 2): number[][] {
  const solver = new DLXSolver();
  solver.buildMatrix(puzzle);
  const solutions = solver.solve(maxSolutions);
  return solutions.map(dlxSolutionToGrid);
}

/**
 * Check if a puzzle has exactly one solution.
 */
export function hasUniqueSolution(puzzle: string): boolean {
  const solutions = solvePuzzle(puzzle, 2);
  return solutions.length === 1;
}

/**
 * Validate a complete 9×9 grid.
 */
export function isValidGrid(grid: number[]): boolean {
  if (grid.length !== 81) return false;

  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const val = grid[row * 9 + col];
      if (val < 1 || val > 9 || seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < 9; row++) {
      const val = grid[row * 9 + col];
      if (seen.has(val)) return false;
      seen.add(val);
    }
  }

  // Check 3×3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = grid[(boxRow * 3 + r) * 9 + (boxCol * 3 + c)];
          if (seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }

  return true;
}
