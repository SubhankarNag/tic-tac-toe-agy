/* DOM Elements */
const themeToggle = document.getElementById('themeToggle');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDrawEl = document.getElementById('scoreDraw');
const oPlayerName = document.getElementById('oPlayerName');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverModal = document.getElementById('gameOverModal');
const winnerText = document.getElementById('winnerText');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const quitBtn = document.getElementById('quitBtn');
const aiModeBtn = document.getElementById('aiModeBtn');
const difficultyWrapper = document.getElementById('difficultyWrapper');
const diffBtns = document.querySelectorAll('.diff-btn');
const pvpModeBtn = document.querySelector('[data-mode="pvp"]');

/* Game State */
let gameMode = 'pvp'; // 'pvp' or 'ai'
let aiDifficulty = 'hard'; // 'easy', 'medium', 'hard'
let currentPlayer = 'X';
let startingPlayer = 'X';
let gameActive = false;
let gameState = ["", "", "", "", "", "", "", "", ""];
let scores = { x: 0, o: 0, draw: 0 };
let isDarkMode = localStorage.getItem('theme') !== 'light';

/* Winning Conditions */
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

/* Initialization */
function init() {
    // Set initial theme
    if (!isDarkMode) {
        document.body.classList.add('light-mode');
    }

    // Event Listeners
    themeToggle.addEventListener('click', toggleTheme);
    
    // Mode Selection
    aiModeBtn.addEventListener('click', toggleDifficultyMenu);
    pvpModeBtn.addEventListener('click', () => startGame('pvp'));
    
    diffBtns.forEach(btn => btn.addEventListener('click', (e) => {
        handleDifficultySelect(e);
        startGame('ai');
    }));

    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    backBtn.addEventListener('click', showStartScreen);
    restartBtn.addEventListener('click', restartRound);
    nextRoundBtn.addEventListener('click', nextRound);
    quitBtn.addEventListener('click', showStartScreen);
}

/* Theme Logic */
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    isDarkMode = !document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

/* UI Logic */
function toggleDifficultyMenu() {
    const isOpen = difficultyWrapper.classList.contains('open');
    
    if (isOpen) {
        difficultyWrapper.classList.remove('open');
        aiModeBtn.classList.remove('active');
    } else {
        difficultyWrapper.classList.add('open');
        aiModeBtn.classList.add('active');
    }
}

function handleDifficultySelect(e) {
    diffBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    aiDifficulty = e.target.dataset.diff;
}

/* Navigation Logic */
function startGame(mode) {
    gameMode = mode;
    oPlayerName.textContent = mode === 'ai' ? `AI (${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})` : 'Player O';
    
    // Reset Scores
    scores = { x: 0, o: 0, draw: 0 };
    updateScoreboard();
    
    // Reset Starting Player
    startingPlayer = 'X';

    // Switch Screens
    startScreen.classList.remove('active');
    startScreen.classList.add('hidden');
    setTimeout(() => {
        startScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        setTimeout(() => {
            gameScreen.classList.remove('hidden');
            gameScreen.classList.add('active');
        }, 50);
    }, 400);

    restartRound();
}

function showStartScreen() {
    gameOverModal.classList.add('hidden');
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    
    setTimeout(() => {
        gameScreen.style.display = 'none';
        startScreen.style.display = 'flex';
        setTimeout(() => {
            startScreen.classList.remove('hidden');
            startScreen.classList.add('active');
            
            // Reset UI state
            difficultyWrapper.classList.remove('open');
            aiModeBtn.classList.remove('active');
        }, 50);
    }, 400);
}

/* Game Logic */
function restartRound() {
    gameActive = true;
    currentPlayer = startingPlayer;
    gameState = ["", "", "", "", "", "", "", "", ""];
    
    updateStatusDisplay();
    
    cells.forEach(cell => {
        cell.innerHTML = "";
        cell.classList.remove('taken', 'x', 'o');
    });
    
    gameOverModal.classList.add('hidden');
    highlightCurrentPlayer();

    // If AI starts
    if (gameMode === 'ai' && currentPlayer === 'O') {
        setTimeout(makeAiMove, 500);
    }
}

function nextRound() {
    // Rotate starting player
    startingPlayer = startingPlayer === 'X' ? 'O' : 'X';
    restartRound();
}

function updateStatusDisplay() {
    if (gameMode === 'ai' && currentPlayer === 'O') {
        statusDisplay.innerHTML = `AI is thinking...`;
    } else {
        statusDisplay.innerHTML = `Player <span class="current-player" style="color: var(--${currentPlayer === 'X' ? 'primary' : 'secondary'}-color)">${currentPlayer}</span>'s Turn`;
    }
}

function handleCellClick(e) {
    const clickedCell = e.target.closest('.cell');
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

    if (gameState[clickedCellIndex] !== "" || !gameActive) {
        return;
    }

    if (gameMode === 'ai' && currentPlayer === 'O') return; // Prevent clicking during AI turn

    handleCellPlayed(clickedCell, clickedCellIndex);
    
    if (checkResult()) return;

    changePlayer();

    if (gameMode === 'ai' && gameActive && currentPlayer === 'O') {
        setTimeout(makeAiMove, 500);
    }
}

function handleCellPlayed(clickedCell, clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    
    const span = document.createElement('span');
    span.innerText = currentPlayer;
    clickedCell.appendChild(span);
    
    clickedCell.classList.add('taken', currentPlayer.toLowerCase());
}

function changePlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatusDisplay();
    highlightCurrentPlayer();
}

function highlightCurrentPlayer() {
    const xScore = document.querySelector('.x-score');
    const oScore = document.querySelector('.o-score');
    
    if (currentPlayer === 'X') {
        xScore.classList.add('active');
        oScore.classList.remove('active');
    } else {
        oScore.classList.add('active');
        xScore.classList.remove('active');
    }
}

function checkResult() {
    const result = checkWinner(gameState);
    
    if (result === 'X' || result === 'O') {
        endGame(false);
        return true;
    }
    
    if (result === 'tie') {
        endGame(true);
        return true;
    }

    return false;
}

function endGame(draw) {
    gameActive = false;
    if (draw) {
        statusDisplay.innerHTML = "It's a Draw!";
        winnerText.innerHTML = "It's a Draw!";
        scores.draw++;
    } else {
        const winnerName = currentPlayer === 'O' && gameMode === 'ai' ? 'AI' : `Player ${currentPlayer}`;
        statusDisplay.innerHTML = `${winnerName} Wins!`;
        winnerText.innerHTML = `<span class="${currentPlayer.toLowerCase()}">${winnerName}</span> Wins!`;
        if (currentPlayer === 'X') scores.x++;
        else scores.o++;
    }
    updateScoreboard();
    setTimeout(() => gameOverModal.classList.remove('hidden'), 1000);
}

function updateScoreboard() {
    scoreXEl.innerText = scores.x;
    scoreOEl.innerText = scores.o;
    scoreDrawEl.innerText = scores.draw;
}

/* AI Logic */
function makeAiMove() {
    if (!gameActive) return;

    let move;

    if (aiDifficulty === 'easy') {
        move = getRandomMove();
    } else if (aiDifficulty === 'medium') {
        // 60% chance to make best move, 40% random
        if (Math.random() > 0.4) {
            move = getBestMove();
        } else {
            move = getRandomMove();
        }
    } else {
        move = getBestMove();
    }

    const cell = document.querySelector(`[data-cell-index="${move}"]`);
    handleCellPlayed(cell, move);
    
    if (checkResult()) return;
    changePlayer();
}

function getRandomMove() {
    const availableMoves = gameState.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

function getBestMove() {
    // Optimization: If first move and center is open, take it
    if (gameState.filter(c => c !== '').length <= 1 && gameState[4] === '') {
        return 4;
    }

    let bestScore = -Infinity;
    let move;
    
    for (let i = 0; i < 9; i++) {
        if (gameState[i] === '') {
            gameState[i] = 'O';
            let score = minimax(gameState, 0, false);
            gameState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

const scoresMap = {
    O: 10,
    X: -10,
    tie: 0
};

function minimax(board, depth, isMaximizing) {
    let result = checkWinner(board);
    if (result !== null) {
        return scoresMap[result];
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinner(board) {
    for (let i = 0; i < 8; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes('')) {
        return 'tie';
    }
    return null;
}

// Initialize Game
init();
