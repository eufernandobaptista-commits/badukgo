const canvas = document.getElementById('goBoard');
const ctx = canvas.getContext('2d');
const statusDisplay = document.getElementById('status');
const blackScoreDisplay = document.getElementById('black-score');
const whiteScoreDisplay = document.getElementById('white-score');

// Configurações do Tabuleiro
const size = 19;
const padding = 30;
const cellSize = (canvas.width - padding * 2) / (size - 1);

let board = Array(size).fill().map(() => Array(size).fill(0));
let currentPlayer = 1; // 1: Pretas (Humano), 2: Brancas (IA)
let captures = { 1: 0, 2: 0 };
let lastBoardState = null; // Para regra do Ko

// Inicializa a conexão com a IA (Web Worker)
const aiWorker = new Worker('ai_mestre.js');

// Ouvir a resposta da IA
aiWorker.onmessage = function(e) {
    const move = e.data;
    if (move) {
        executeMove(move.r, move.c);
    } else {
        statusDisplay.innerText = "IA Passou a vez";
        currentPlayer = 1;
    }
};

// Função principal de desenho
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Desenhar Linhas
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i++) {
        // Verticais
        ctx.beginPath();
        ctx.moveTo(padding + i * cellSize, padding);
        ctx.lineTo(padding + i * cellSize, canvas.height - padding);
        ctx.stroke();
        // Horizontais
        ctx.beginPath();
        ctx.moveTo(padding, padding + i * cellSize);
        ctx.lineTo(canvas.width - padding, padding + i * cellSize);
        ctx.stroke();
    }

    // 2. Desenhar Pontos Hoshi (Referência)
    const hoshi = size === 19 ? [3, 9, 15] : [2, 4, 6];
    hoshi.forEach(r => {
        hoshi.forEach(c => {
            ctx.beginPath();
            ctx.arc(padding + c * cellSize, padding + r * cellSize, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
        });
    });

    // 3. Desenhar Pedras
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] !== 0) {
                const x = padding + c * cellSize;
                const y = padding + r * cellSize;
                
                ctx.beginPath();
                ctx.arc(x, y, cellSize / 2.1, 0, Math.PI * 2);
                
                // Gradiente para efeito 3D
                const grad = ctx.createRadialGradient(x-2, y-2, 1, x, y, cellSize/2);
                if (board[r][c] === 1) {
                    grad.addColorStop(0, '#666');
                    grad.addColorStop(1, '#000');
                } else {
                    grad.addColorStop(0, '#fff');
                    grad.addColorStop(1, '#ccc');
                }
                
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.strokeStyle = board[r][c] === 1 ? '#000' : '#999';
                ctx.stroke();
            }
        }
    }
}

// Lógica de Captura e Liberdades
function getGroup(r, c, color, group = [], visited = new Set()) {
    const key = `${r},${c}`;
    if (visited.has(key) || board[r][c] !== color) return { group, liberties: 0 };
    
    visited.add(key);
    group.push({r, c});
    
    let liberties = 0;
    const neighbors = [[-1,0], [1,0], [0,-1], [0,1]];
    
    for (let [dr, dc] of neighbors) {
        let nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            if (board[nr][nc] === 0) liberties++;
            else if (board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                const res = getGroup(nr, nc, color, group, visited);
                liberties += res.liberties;
            }
        }
    }
    return { group, liberties };
}

function executeMove(r, c) {
    if (board[r][c] !== 0) return false;

    const player = currentPlayer;
    const opponent = player === 1 ? 2 : 1;
    
    // Simular jogada
    board[r][c] = player;
    
    // Verificar capturas do oponente
    let capturedAny = false;
    const neighbors = [[-1,0], [1,0], [0,-1], [0,1]];
    
    for (let [dr, dc] of neighbors) {
        let nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === opponent) {
            const { group, liberties } = getGroup(nr, nc, opponent);
            if (liberties === 0) {
                group.forEach(p => board[p.r][p.c] = 0);
                captures[player] += group.length;
                capturedAny = true;
            }
        }
    }

    // Verificar suicídio
    const { liberties } = getGroup(r, c, player);
    if (liberties === 0 && !capturedAny) {
        board[r][c] = 0; // Reverter
        return false;
    }

    // Atualizar interface
    blackScoreDisplay.innerText = captures[1];
    whiteScoreDisplay.innerText = captures[2];
    drawBoard();
    
    // Alternar turno
    currentPlayer = opponent;
    if (currentPlayer === 2) {
        statusDisplay.innerText = "IA Mestre pensando...";
        aiWorker.postMessage({ board, size, player: 2 });
    } else {
        statusDisplay.innerText = "Sua vez (Pretas)";
    }
    return true;
}

// Evento de Clique
canvas.addEventListener('click', (e) => {
    if (currentPlayer !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);

    if (row >= 0 && row < size && col >= 0 && col < size) {
        executeMove(row, col);
    }
});

function resetGame() {
    board = Array(size).fill().map(() => Array(size).fill(0));
    currentPlayer = 1;
    captures = { 1: 0, 2: 0 };
    blackScoreDisplay.innerText = "0";
    whiteScoreDisplay.innerText = "0";
    statusDisplay.innerText = "Sua vez (Pretas)";
    drawBoard();
}

function passTurn() {
    if (currentPlayer === 1) {
        currentPlayer = 2;
        statusDisplay.innerText = "Você passou. IA pensando...";
        aiWorker.postMessage({ board, size, player: 2 });
    }
}

// Início do jogo
statusDisplay.innerText = "Sua vez (Pretas)";
drawBoard();
