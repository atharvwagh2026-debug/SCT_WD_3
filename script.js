/* ==========================================================
   TIC TAC TOE - GAME LOGIC
   ========================================================== */

// ----- DOM references -----
const boardEl = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('status');
const winLineEl = document.getElementById('winLine');

const pvpBtn = document.getElementById('pvpBtn');
const pvcBtn = document.getElementById('pvcBtn');
const oLabel = document.getElementById('oLabel');

const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDrawEl = document.getElementById('scoreDraw');

const restartBtn = document.getElementById('restartBtn');
const resetScoreBtn = document.getElementById('resetScoreBtn');

// ----- Game state -----
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' or 'pvc'

let scores = { X: 0, O: 0, draw: 0 };

// All possible winning combinations (index positions on the board)
// Each combo has a "type" so the winning line can be drawn edge-to-edge correctly
const winningCombos = [
  { combo: [0, 1, 2], type: 'row' },
  { combo: [3, 4, 5], type: 'row' },
  { combo: [6, 7, 8], type: 'row' },
  { combo: [0, 3, 6], type: 'col' },
  { combo: [1, 4, 7], type: 'col' },
  { combo: [2, 5, 8], type: 'col' },
  { combo: [0, 4, 8], type: 'diag-main' }, // top-left to bottom-right
  { combo: [2, 4, 6], type: 'diag-anti' }  // top-right to bottom-left
];

// ==========================================================
// INITIAL SETUP
// ==========================================================
function init() {
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  pvpBtn.addEventListener('click', () => setMode('pvp'));
  pvcBtn.addEventListener('click', () => setMode('pvc'));

  restartBtn.addEventListener('click', restartRound);
  resetScoreBtn.addEventListener('click', resetScores);

  updateStatus();
}

// ==========================================================
// MODE SWITCHING
// ==========================================================
function setMode(mode) {
  gameMode = mode;

  pvpBtn.classList.toggle('active', mode === 'pvp');
  pvcBtn.classList.toggle('active', mode === 'pvc');
  oLabel.textContent = mode === 'pvc' ? 'Computer' : 'Player O';

  restartRound();
}

// ==========================================================
// HANDLE A CLICK ON A CELL
// ==========================================================
function handleCellClick(e) {
  const index = Number(e.target.dataset.index);

  // Ignore click if cell is filled, game is over, or it's the computer's turn
  if (board[index] !== '' || !gameActive) return;
  if (gameMode === 'pvc' && currentPlayer === 'O') return;

  placeMark(index, currentPlayer);

  const result = checkResult();
  if (result) {
    endRound(result);
    return;
  }

  switchPlayer();

  // If playing against computer and it's now O's turn, let it move
  if (gameMode === 'pvc' && currentPlayer === 'O' && gameActive) {
    statusEl.textContent = "Computer is thinking...";
    setTimeout(computerMove, 400);
  }
}

// ==========================================================
// PLACE A MARK ON THE BOARD (data + UI)
// ==========================================================
function placeMark(index, player) {
  board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add('filled', player === 'X' ? 'x-mark' : 'o-mark');
}

function switchPlayer() {
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  updateStatus();
}

function updateStatus() {
  if (!gameActive) return;
  const label = gameMode === 'pvc' && currentPlayer === 'O' ? 'Computer' : `Player ${currentPlayer}`;
  statusEl.textContent = `${label}'s Turn`;
}

// ==========================================================
// CHECK FOR WIN / DRAW
// Returns { winner, combo } or { winner: 'draw' } or null
// ==========================================================
function checkResult(testBoard = board) {
  for (const line of winningCombos) {
    const [a, b, c] = line.combo;
    if (testBoard[a] && testBoard[a] === testBoard[b] && testBoard[a] === testBoard[c]) {
      return { winner: testBoard[a], combo: line.combo, type: line.type };
    }
  }
  if (testBoard.every(cell => cell !== '')) {
    return { winner: 'draw', combo: null, type: null };
  }
  return null;
}

// ==========================================================
// END OF ROUND HANDLING
// ==========================================================
function endRound(result) {
  gameActive = false;

  if (result.winner === 'draw') {
    statusEl.textContent = "🤝It's a draw!🤝";
    scores.draw++;
    scoreDrawEl.textContent = scores.draw;
  } else {
    const winnerLabel = gameMode === 'pvc' && result.winner === 'O' ? 'Computer' : `Player ${result.winner}`;
    statusEl.textContent = `${winnerLabel} Wins!!!🎉`;
    scores[result.winner]++;
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;

    highlightWinningCells(result.combo);
    drawWinLine(result.combo, result.type);
  }
}

// ==========================================================
// HIGHLIGHT WINNING CELLS (glow effect)
// ==========================================================
function highlightWinningCells(combo) {
  combo.forEach(index => {
    cells[index].classList.add('win-cell');
  });
}

// ==========================================================
// DRAW THE ANIMATED WINNING LINE
// Positions the line based on the actual rendered cell coordinates
// so it always lines up correctly for rows, columns, and diagonals.
// ==========================================================
function drawWinLine(combo, type) {
  const [a, , c] = combo;
  const startCell = cells[a];
  const endCell = cells[c];

  // Line color matches the winner: blue for X, red for O
  const winnerColor = board[a] === 'X' ? 'var(--winline-x)' : 'var(--winline-o)';
  winLineEl.style.background = winnerColor;

  const boardRect = boardEl.getBoundingClientRect();
  const startRect = startCell.getBoundingClientRect();
  const endRect = endCell.getBoundingClientRect();

  let startX, startY, endX, endY;

  // Depending on the line type, start from the true outer edge of the
  // first cell and end at the true outer edge of the last cell, while
  // staying centered through the marks (X/O) along the other axis.
  switch (type) {
    case 'row': // horizontal line - full left edge to full right edge
      startX = startRect.left - boardRect.left;
      startY = startRect.top + startRect.height / 2 - boardRect.top;
      endX = endRect.right - boardRect.left;
      endY = endRect.top + endRect.height / 2 - boardRect.top;
      break;

    case 'col': // vertical line - full top edge to full bottom edge
      startX = startRect.left + startRect.width / 2 - boardRect.left;
      startY = startRect.top - boardRect.top;
      endX = endRect.left + endRect.width / 2 - boardRect.left;
      endY = endRect.bottom - boardRect.top;
      break;

    case 'diag-main': // top-left corner of first cell to bottom-right corner of last cell
      startX = startRect.left - boardRect.left;
      startY = startRect.top - boardRect.top;
      endX = endRect.right - boardRect.left;
      endY = endRect.bottom - boardRect.top;
      break;

    case 'diag-anti': // top-right corner of first cell to bottom-left corner of last cell
      startX = startRect.right - boardRect.left;
      startY = startRect.top - boardRect.top;
      endX = endRect.left - boardRect.left;
      endY = endRect.bottom - boardRect.top;
      break;
  }

  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  winLineEl.style.top = `${startY}px`;
  winLineEl.style.left = `${startX}px`;
  winLineEl.style.transform = `rotate(${angle}deg)`;

  // Trigger the width transition after the line is positioned
  requestAnimationFrame(() => {
    winLineEl.style.width = `${length}px`;
    winLineEl.classList.add('show');
  });
}

function resetWinLine() {
  winLineEl.classList.remove('show');
  winLineEl.style.width = '0';
  winLineEl.style.top = '0';
  winLineEl.style.left = '0';
  winLineEl.style.transform = 'rotate(0deg)';
}

// ==========================================================
// RESTART A SINGLE ROUND (keeps scores)
// ==========================================================
function restartRound() {
  board = ['', '', '', '', '', '', '', '', ''];
  currentPlayer = 'X';
  gameActive = true;

  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('filled', 'x-mark', 'o-mark', 'win-cell');
  });

  resetWinLine();
  updateStatus();
}

// ==========================================================
// RESET SCOREBOARD
// ==========================================================
function resetScores() {
  scores = { X: 0, O: 0, draw: 0 };
  scoreXEl.textContent = 0;
  scoreOEl.textContent = 0;
  scoreDrawEl.textContent = 0;
  restartRound();
}

// ==========================================================
// COMPUTER MOVE (uses Minimax algorithm for intelligent play)
// ==========================================================
function computerMove() {
  if (!gameActive) return;

  const bestIndex = getBestMove();
  placeMark(bestIndex, 'O');

  const result = checkResult();
  if (result) {
    endRound(result);
    return;
  }

  switchPlayer();
}

// Finds the best possible move for the computer ('O') using minimax
function getBestMove() {
  let bestScore = -Infinity;
  let move = null;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === '') {
      board[i] = 'O';
      const score = minimax(board, 0, false);
      board[i] = '';

      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

// Minimax algorithm: recursively scores every possible outcome
// 'O' (computer) tries to maximize the score, 'X' (human) tries to minimize it
function minimax(currentBoard, depth, isMaximizing) {
  const result = checkResult(currentBoard);

  if (result) {
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    return 0; // draw
  }

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] === '') {
        currentBoard[i] = 'O';
        best = Math.max(best, minimax(currentBoard, depth + 1, false));
        currentBoard[i] = '';
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] === '') {
        currentBoard[i] = 'X';
        best = Math.min(best, minimax(currentBoard, depth + 1, true));
        currentBoard[i] = '';
      }
    }
    return best;
  }
}

// Recalculate the win line position if the window is resized
window.addEventListener('resize', () => {
  if (!gameActive && winLineEl.classList.contains('show')) {
    const result = checkResult();
    if (result && result.combo) drawWinLine(result.combo, result.type);
  }
});

// ----- Start the app -----
init();