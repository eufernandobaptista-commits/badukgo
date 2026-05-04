const canvas = document.getElementById('goBoard');
const ctx = canvas.getContext('2d');
const size = 19; // Tabuleiro 19x19
const padding = 30;
const cellSize = (canvas.width - padding * 2) / (size - 1);

let board = Array(size).fill().map(() => Array(size).fill(0)); // 0:vazio, 1:preto, 2:branco
let currentPlayer = 1;

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    
    // Desenha linhas
    for (let i = 0; i < size; i++) {
        ctx.beginPath();
        ctx.moveTo(padding + i * cellSize, padding);
        ctx.lineTo(padding + i * cellSize, canvas.height - padding);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padding, padding + i * cellSize);
        ctx.lineTo(canvas.width - padding, padding + i * cellSize);
        ctx.stroke();
    }

    // Desenha pedras
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] !== 0) {
                ctx.beginPath();
                ctx.arc(padding + c * cellSize, padding + r * cellSize, cellSize / 2.2, 0, Math.PI * 2);
                ctx.fillStyle = board[r][c] === 1 ? '#000' : '#fff';
                ctx.fill();
                ctx.stroke();
            }
        }
    }
}

canvas.addEventListener('click', (e) => {
    if (currentPlayer !== 1) return; // Espera a IA

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);

    if (row >= 0 && row < size && col >= 0 && col < size && board[row][col] === 0) {
        makeMove(row, col, 1);
        setTimeout(aiMove, 500); // IA joga depois de meio segundo
    }
});

function makeMove(row, col, player) {
    board[row][col] = player;
    // Aqui deveria entrar a lógica de captura de pedras (liberdades)
    // Para simplificar este exemplo, vamos focar na estrutura
    drawBoard();
    currentPlayer = player === 1 ? 2 : 1;
}

drawBoard();