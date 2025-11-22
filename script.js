/* Firebase Configuration */
const firebaseConfig = {
  apiKey: "AIzaSyBVLAmuo3LWd1rEERoLxZ6qJDSZsRz3Jz8",
  authDomain: "tic-tac-toe-agy.firebaseapp.com",
  databaseURL: "https://tic-tac-toe-agy-default-rtdb.firebaseio.com",
  projectId: "tic-tac-toe-agy",
  storageBucket: "tic-tac-toe-agy.firebasestorage.app",
  messagingSenderId: "104927928596",
  appId: "1:104927928596:web:9f37df182512fa7095e201"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* DOM Elements */
const themeToggle = document.getElementById('themeToggle');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const lobbyScreen = document.getElementById('lobbyScreen');
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
const onlineModeBtn = document.getElementById('onlineModeBtn');

// Lobby Elements
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const waitingArea = document.getElementById('waitingArea');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const shareLinkBtn = document.getElementById('shareLinkBtn');
const lobbyBackBtn = document.getElementById('lobbyBackBtn');
const lobbyCard = document.querySelector('.lobby-card');

/* Game State */
let gameMode = 'pvp'; // 'pvp', 'ai', 'online'
let aiDifficulty = 'hard';
let currentPlayer = 'X';
let startingPlayer = 'X';
let gameActive = false;
let gameState = ["", "", "", "", "", "", "", "", ""];
let scores = { x: 0, o: 0, draw: 0 };
let isDarkMode = localStorage.getItem('theme') !== 'light';

// Online State
let currentRoomId = null;
let myPlayer = null; // 'X' or 'O'
let roomListener = null;

/* Winning Conditions */
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

/* Initialization */
function init() {
    if (!isDarkMode) {
        document.body.classList.add('light-mode');
    }

    // Check URL for room code
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
        // Set value immediately
        roomCodeInput.value = roomCode;
        
        // Show lobby, passing true to prevent clearing the input
        showLobbyScreen(true);
        
        // Auto-join after UI animation (wait slightly longer to be safe)
        setTimeout(() => {
            if (roomCodeInput.value === '') {
                roomCodeInput.value = roomCode;
            }
            joinRoom();
        }, 1000);
    }

    // Event Listeners
    themeToggle.addEventListener('click', toggleTheme);
    
    // Mode Selection
    aiModeBtn.addEventListener('click', toggleDifficultyMenu);
    pvpModeBtn.addEventListener('click', () => startGame('pvp'));
    onlineModeBtn.addEventListener('click', showLobbyScreen);
    
    diffBtns.forEach(btn => btn.addEventListener('click', (e) => {
        handleDifficultySelect(e);
        startGame('ai');
    }));

    // Lobby Listeners
    createRoomBtn.addEventListener('click', createRoom);
    joinRoomBtn.addEventListener('click', joinRoom);
    copyCodeBtn.addEventListener('click', copyRoomCode);
    shareLinkBtn.addEventListener('click', copyRoomLink);
    lobbyBackBtn.addEventListener('click', showStartScreen);

    // Game Listeners
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    backBtn.addEventListener('click', () => {
        if (gameMode === 'online') leaveRoom();
        showStartScreen();
    });
    restartBtn.addEventListener('click', restartRound);
    nextRoundBtn.addEventListener('click', nextRound);
    quitBtn.addEventListener('click', () => {
        if (gameMode === 'online') leaveRoom();
        showStartScreen();
    });
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
    
    if (mode === 'ai') {
        oPlayerName.textContent = `AI (${aiDifficulty.charAt(0).toUpperCase() + aiDifficulty.slice(1)})`;
    } else if (mode === 'online') {
        oPlayerName.textContent = 'Opponent';
    } else {
        oPlayerName.textContent = 'Player O';
    }
    
    // Reset Scores
    scores = { x: 0, o: 0, draw: 0 };
    updateScoreboard();
    
    // Reset Starting Player
    startingPlayer = 'X';

    // Switch Screens
    startScreen.classList.add('hidden');
    lobbyScreen.classList.add('hidden');
    startScreen.style.display = 'none';
    lobbyScreen.style.display = 'none';
    
    gameScreen.style.display = 'flex';
    setTimeout(() => {
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('active');
    }, 50);

    if (mode !== 'online') {
        restartRound();
    }
}

function showStartScreen() {
    gameOverModal.classList.add('hidden');
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    lobbyScreen.classList.remove('active');
    lobbyScreen.classList.add('hidden');
    
    setTimeout(() => {
        gameScreen.style.display = 'none';
        lobbyScreen.style.display = 'none';
        startScreen.style.display = 'flex';
        setTimeout(() => {
            startScreen.classList.remove('hidden');
            startScreen.classList.add('active');
            difficultyWrapper.classList.remove('open');
            aiModeBtn.classList.remove('active');
        }, 50);
    }, 400);
}

function showLobbyScreen(keepInput = false) {
    startScreen.classList.add('hidden');
    setTimeout(() => {
        startScreen.style.display = 'none';
        lobbyScreen.style.display = 'flex';
        // Reset Lobby State
        lobbyCard.style.display = 'flex';
        waitingArea.classList.add('hidden');
        if (!keepInput) {
            roomCodeInput.value = '';
        }
        
        setTimeout(() => {
            lobbyScreen.classList.remove('hidden');
            lobbyScreen.classList.add('active');
        }, 50);
    }, 400);
}

/* Online Logic */
function createRoom() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    currentRoomId = code;
    myPlayer = 'X';
    
    db.ref('rooms/' + code).set({
        gameState: ["", "", "", "", "", "", "", "", ""],
        currentPlayer: 'X',
        gameActive: true,
        players: {
            X: true,
            O: false
        }
    });

    // Show Waiting Area
    lobbyCard.style.display = 'none';
    waitingArea.classList.remove('hidden');
    roomCodeDisplay.textContent = code;

    // Listen for opponent
    listenForUpdates();
}

function joinRoom() {
    const code = roomCodeInput.value.trim();
    if (code.length !== 6) {
        alert("Please enter a valid 6-digit code.");
        return;
    }

    db.ref('rooms/' + code).get().then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.players.O) {
                alert("Room is full!");
                return;
            }

            currentRoomId = code;
            myPlayer = 'O';
            
            // Update room to show O joined
            db.ref('rooms/' + code + '/players/O').set(true);
            
            startGame('online');
            listenForUpdates();
        } else {
            alert("Room not found!");
        }
    });
}

function listenForUpdates() {
    const roomRef = db.ref('rooms/' + currentRoomId);
    
    roomListener = roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (!data) {
            // Room deleted or invalid
            alert("Room closed.");
            leaveRoom();
            showStartScreen();
            return;
        }

        // Check if game started (both players present)
        if (data.players.X && data.players.O) {
            if (lobbyScreen.style.display !== 'none') {
                startGame('online');
            }
        }

        // Update Game State
        gameState = data.gameState || ["", "", "", "", "", "", "", "", ""];
        currentPlayer = data.currentPlayer;
        gameActive = data.gameActive;

        // Update UI
        updateBoardUI();
        updateStatusDisplay();
        highlightCurrentPlayer();

        // Check for win/draw from DB state
        // (Optional: You can rely on local checkResult, but syncing state is safer)
        const winner = checkWinner(gameState);
        if (winner) {
            if (winner === 'tie') endGame(true);
            else endGame(false, winner);
        }
    });
}

function leaveRoom() {
    if (currentRoomId) {
        db.ref('rooms/' + currentRoomId).off(); // Remove listener
        // Optional: Delete room if creator leaves, or just remove player
        db.ref('rooms/' + currentRoomId).remove();
        currentRoomId = null;
        myPlayer = null;
    }
}

function copyRoomCode() {
    navigator.clipboard.writeText(currentRoomId).then(() => {
        const originalText = roomCodeDisplay.textContent;
        roomCodeDisplay.textContent = "COPIED!";
        setTimeout(() => {
            roomCodeDisplay.textContent = originalText;
        }, 1500);
    });
}

function copyRoomLink() {
    const link = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    navigator.clipboard.writeText(link).then(() => {
        // Visual feedback on the button itself
        const originalHTML = shareLinkBtn.innerHTML;
        shareLinkBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
            shareLinkBtn.innerHTML = originalHTML;
        }, 1500);
    });
}

/* Game Logic */
function restartRound() {
    if (gameMode === 'online') {
        // Only allow restart if game is over
        if (gameActive) return;
        
        // Reset DB state
        db.ref('rooms/' + currentRoomId).update({
            gameState: ["", "", "", "", "", "", "", "", ""],
            currentPlayer: 'X', // Or alternate
            gameActive: true
        });
        return;
    }

    gameActive = true;
    currentPlayer = startingPlayer;
    gameState = ["", "", "", "", "", "", "", "", ""];
    
    updateStatusDisplay();
    updateBoardUI();
    
    gameOverModal.classList.add('hidden');
    highlightCurrentPlayer();

    if (gameMode === 'ai' && currentPlayer === 'O') {
        setTimeout(makeAiMove, 500);
    }
}

function nextRound() {
    if (gameMode === 'online') {
        restartRound();
        gameOverModal.classList.add('hidden');
        return;
    }
    startingPlayer = startingPlayer === 'X' ? 'O' : 'X';
    restartRound();
}

function updateBoardUI() {
    cells.forEach((cell, index) => {
        cell.innerHTML = "";
        cell.classList.remove('taken', 'x', 'o');
        
        if (gameState[index] !== "") {
            cell.innerText = gameState[index];
            cell.classList.add('taken', gameState[index].toLowerCase());
        }
    });
}

function updateStatusDisplay() {
    if (gameMode === 'ai' && currentPlayer === 'O') {
        statusDisplay.innerHTML = `AI is thinking...`;
    } else if (gameMode === 'online') {
        if (myPlayer === currentPlayer) {
            statusDisplay.innerHTML = `Your Turn (<span class="current-player" style="color: var(--${currentPlayer === 'X' ? 'primary' : 'secondary'}-color)">${currentPlayer}</span>)`;
        } else {
            statusDisplay.innerHTML = `Opponent's Turn`;
        }
    } else {
        statusDisplay.innerHTML = `Player <span class="current-player" style="color: var(--${currentPlayer === 'X' ? 'primary' : 'secondary'}-color)">${currentPlayer}</span>'s Turn`;
    }
}

function handleCellClick(e) {
    const clickedCell = e.target.closest('.cell');
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index'));

    if (gameState[clickedCellIndex] !== "" || !gameActive) return;

    // Online Check
    if (gameMode === 'online') {
        if (currentPlayer !== myPlayer) return; // Not your turn
        
        // Update DB
        const newGameState = [...gameState];
        newGameState[clickedCellIndex] = myPlayer;
        const nextPlayer = myPlayer === 'X' ? 'O' : 'X';
        
        db.ref('rooms/' + currentRoomId).update({
            gameState: newGameState,
            currentPlayer: nextPlayer
        });
        return; // UI updates via listener
    }

    // AI Check
    if (gameMode === 'ai' && currentPlayer === 'O') return;

    handleCellPlayed(clickedCell, clickedCellIndex);
    
    if (checkResult()) return;

    changePlayer();

    if (gameMode === 'ai' && gameActive && currentPlayer === 'O') {
        setTimeout(makeAiMove, 500);
    }
}

function handleCellPlayed(clickedCell, clickedCellIndex) {
    gameState[clickedCellIndex] = currentPlayer;
    updateBoardUI();
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
        endGame(false, result);
        return true;
    }
    
    if (result === 'tie') {
        endGame(true);
        return true;
    }

    return false;
}

function endGame(draw, winner) {
    gameActive = false;
    if (draw) {
        statusDisplay.innerHTML = "It's a Draw!";
        winnerText.innerHTML = "It's a Draw!";
        scores.draw++;
    } else {
        const winnerName = (gameMode === 'ai' && winner === 'O') ? 'AI' : 
                          (gameMode === 'online' && winner === myPlayer) ? 'You' :
                          (gameMode === 'online' && winner !== myPlayer) ? 'Opponent' :
                          `Player ${winner}`;
                          
        statusDisplay.innerHTML = `${winnerName} Wins!`;
        winnerText.innerHTML = `<span class="${winner.toLowerCase()}">${winnerName}</span> Wins!`;
        if (winner === 'X') scores.x++;
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
