const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
    board: Array.from({ length: 5 }, () => Array(5).fill(null)),
    players: [null, null], // Player 1 and Player 2
    currentPlayer: 0,
    piecePositions: {},
    pieceTypes: ['P', 'H1', 'H2', 'H3'],
    activePiece: null,
};

wss.on('connection', (ws) => {
    if (gameState.players[0] === null) {
        gameState.players[0] = ws;
        ws.send(JSON.stringify({ type: 'init', player: 1 }));
    } else if (gameState.players[1] === null) {
        gameState.players[1] = ws;
        ws.send(JSON.stringify({ type: 'init', player: 2 }));
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Game already full' }));
        ws.close();
        return;
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        handleMove(data, ws);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function handleMove(data, ws) {
    const { piece, move } = data;
    const playerIndex = gameState.players.indexOf(ws);

    if (playerIndex !== gameState.currentPlayer) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
        return;
    }

    if (validateMove(piece, move)) {
        processMove(piece, move);
        if (checkGameOver()) {
            broadcastState({ type: 'gameOver', winner: gameState.currentPlayer + 1 });
            resetGame();
        } else {
            gameState.currentPlayer = (gameState.currentPlayer + 1) % 2;
            broadcastState({ type: 'update' });
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid move' }));
    }
}

function validateMove(piece, move) {
    // Implement detailed validation logic
    // This needs to be expanded based on character types and move types
    const pieceType = piece[0];
    const piecePos = gameState.piecePositions[piece];
    const [row, col] = piecePos || [];
    const [moveDir] = move.split('-');
    const moveDelta = getMoveDelta(pieceType, moveDir);

    if (piecePos) {
        const newRow = row + moveDelta[0];
        const newCol = col + moveDelta[1];
        return (
            newRow >= 0 && newRow < 5 &&
            newCol >= 0 && newCol < 5 &&
            (gameState.piecePositions[`${newRow}-${newCol}`] === undefined ||
            gameState.piecePositions[`${newRow}-${newCol}`][0] !== pieceType)
        );
    }

    return false;
}

function getMoveDelta(pieceType, moveDir) {
    const moveMapping = {
        P: { L: [0, -1], R: [0, 1], F: [-1, 0], B: [1, 0] },
        H1: { L: [-2, 0], R: [2, 0], F: [0, -2], B: [0, 2] },
        H2: { FL: [-2, -2], FR: [-2, 2], BL: [2, -2], BR: [2, 2] },
        // Add Hero3 movement patterns here
    };
    return moveMapping[pieceType][moveDir] || [0, 0];
}

function processMove(piece, move) {
    const piecePos = gameState.piecePositions[piece];
    const [row, col] = piecePos;
    const [moveDir] = move.split('-');
    const moveDelta = getMoveDelta(piece[0], moveDir);

    gameState.piecePositions[piece] = [row + moveDelta[0], col + moveDelta[1]];
    delete gameState.piecePositions[`${row}-${col}`];
}

function checkGameOver() {
    const opponentPlayer = (gameState.currentPlayer + 1) % 2;
    const opponentPieces = Object.keys(gameState.piecePositions).filter(piece => gameState.piecePositions[piece][0] === opponentPlayer);
    return opponentPieces.length === 0;
}

function resetGame() {
    gameState = {
        board: Array.from({ length: 5 }, () => Array(5).fill(null)),
        players: [null, null],
        currentPlayer: 0,
        piecePositions: {},
        pieceTypes: ['P', 'H1', 'H2', 'H3'],
        activePiece: null,
    };
}

function broadcastState(message = { type: 'update' }) {
    const state = {
        ...message,
        board: gameState.board,
        piecePositions: gameState.piecePositions,
        currentPlayer: gameState.currentPlayer,
    };

    gameState.players.forEach(player => {
        if (player) player.send(JSON.stringify(state));
    });
}
