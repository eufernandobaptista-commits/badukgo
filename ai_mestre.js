/**
 * AI MESTRE V4 - BUSCA TÁTICA OTIMIZADA
 * Focada em performance e combate direto.
 */

self.onmessage = function(e) {
    const { board, size, player } = e.data;
    
    // Pequeno delay para não parecer robótico demais
    setTimeout(() => {
        const move = findBestMove(board, size, player);
        self.postMessage(move);
    }, 500);
};

function findBestMove(board, size, aiPlayer) {
    const opponent = aiPlayer === 1 ? 2 : 1;
    let bestScore = -Infinity;
    let bestMove = null;

    // Analisa apenas as casas com potencial (perto de outras pedras)
    const candidates = getCandidateMoves(board, size);

    for (let move of candidates) {
        let score = evaluateMove(board, move.r, move.c, aiPlayer, opponent, size);
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function evaluateMove(board, r, c, ai, hum, size) {
    let score = 0;

    // 1. Defesa de Suicídio (Não joga onde morre)
    if (isSuicide(board, r, c, ai, size)) return -10000;

    // 2. Ataque: Capturar pedras do humano (Valor altíssimo)
    if (checkCapture(board, r, c, ai, hum, size)) score += 1000;

    // 3. Defesa: Evitar que o humano capture a IA
    if (checkCapture(board, r, c, hum, ai, size)) score += 800;

    // 4. Conectividade: Prefere jogar perto de suas próprias pedras (Criar grupos)
    score += countNeighbors(board, r, c, ai, size) * 50;

    // 5. Território: Prefere o centro e pontos estratégicos no início
    const distFromCenter = Math.abs(r - size/2) + Math.abs(c - size/2);
    score += (size - distFromCenter) * 2;

    // 6. Bonus para os pontos Hoshi (estrelas do tabuleiro)
    if ((r === 3 || r === 15 || r === 9) && (c === 3 || c === 15 || c === 9)) {
        score += 30;
    }

    return score;
}

function getCandidateMoves(board, size) {
    const moves = [];
    const hasAnyStone = board.some(row => row.some(cell => cell !== 0));

    // Se o tabuleiro estiver vazio, joga no centro ou pontos hoshi
    if (!hasAnyStone) {
        return [{r: 3, c: 3}, {r: 3, c: 15}, {r: 15, c: 3}, {r: 15, c: 15}, {r: 9, c: 9}];
    }

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) {
                // Só considera casas vizinhas a pedras já existentes (otimização de 90%)
                if (hasAdjacentStone(board, r, c, size)) {
                    moves.push({r, c});
                }
            }
        }
    }
    return moves;
}

function hasAdjacentStone(board, r, c, size) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] !== 0) return true;
        }
    }
    return false;
}

function checkCapture(board, r, c, player, opponent, size) {
    let tempBoard = board.map(row => [...row]);
    tempBoard[r][c] = player;
    
    // Verifica vizinhos do oponente para ver se ficaram sem liberdades
    const neighbors = [[-1,0], [1,0], [0,-1], [0,1]];
    for (let [dr, dc] of neighbors) {
        let nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && tempBoard[nr][nc] === opponent) {
            if (getLiberties(tempBoard, nr, nc, opponent, size) === 0) return true;
        }
    }
    return false;
}

function isSuicide(board, r, c, player, size) {
    let tempBoard = board.map(row => [...row]);
    tempBoard[r][c] = player;
    return getLiberties(tempBoard, r, c, player, size) === 0;
}

function getLiberties(board, r, c, color, size) {
    let liberties = 0;
    let visited = new Set();
    let stack = [{r, c}];
    visited.add(`${r},${c}`);

    while (stack.length > 0) {
        let curr = stack.pop();
        const neighbors = [[-1,0], [1,0], [0,-1], [0,1]];
        
        for (let [dr, dc] of neighbors) {
            let nr = curr.r + dr, nc = curr.c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (board[nr][nc] === 0) {
                    liberties++;
                } else if (board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    stack.push({r: nr, c: nc});
                }
            }
        }
    }
    return liberties;
}

function countNeighbors(board, r, c, color, size) {
    let count = 0;
    const neighbors = [[-1,0], [1,0], [0,-1], [0,1]];
    for (let [dr, dc] of neighbors) {
        let nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === color) count++;
    }
    return count;
}
