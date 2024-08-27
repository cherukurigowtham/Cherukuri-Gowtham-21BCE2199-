const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log('Connected to server');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'init':
            initializeGame(data.player);
            break;
        case 'update':
            updateBoard(data);
            document.getElementById('current-turn').textContent = `Current Turn: Player ${data.currentPlayer + 1}`;
            break;
        case 'gameOver':
            alert(`Game Over! Player ${data.winner} wins!`);
            break;
        case 'error':
            alert(data.message);
            break;
    }
};

function initializeGame(player) {
    const pieceSelect = document.getElementById('piece');
    ['P1', 'P2', 'P3', 'H1', 'H2', 'H3'].forEach(piece => {
        const option = document.createElement('option');
        option.value = piece;
        option.textContent = piece;
        pieceSelect.appendChild(option);
    });
    document.getElementById('current-turn').textContent = `Current Turn: Player ${player}`;
}

function sendMove() {
    const piece = document.getElementById('piece').value;
    const direction = document.getElementById('direction').value;
    socket.send(JSON.stringify({ piece, move: direction }));
}

function updateBoard(data) {
    const board = document.getElementById('board');
    board.innerHTML = '';

    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.style.backgroundColor = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
            const piece = data.piecePositions[`${row}-${col}`];
            cell.textContent = piece ? piece : '';
            board.appendChild(cell);
        }
    }
}
