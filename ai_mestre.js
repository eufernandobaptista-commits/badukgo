/**
 * AI Mestre - Motor de busca Monte Carlo (MCTS)
 * Este arquivo processa milhares de simulações para encontrar a jogada vencedora.
 */

self.onmessage = function(e) {
    const { board, size, player } = e.data;
    
    // Define a força da IA: 2000 simulações é um nível mestre para o navegador.
    // Se ficar lento, diminua para 1000. Se quiser "impossível", aumente para 5000.
    const iterations = 2000; 
    
    const bestMove = findBestMove(board, size, player, iterations);
    self.postMessage(bestMove);
};

function findBestMove(board, size, aiPlayer, iterations) {
    const moves = getSmartMoves(board, size);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];

    // Inicializa estatísticas para cada jogada possível
    moves.forEach(m => {
        m.wins = 0;
        m.visits = 0;
    });

    // Loop de Simulação MCTS
    for (let i = 0; i < iterations; i++) {
        // 1. Seleção (UCB1)
        let move = selectMoveUCB(moves, i);
        
        // 2. Simulação (Rollout rápido)
        let result = simulateGame(board, move, size, aiPlayer);
        
        // 3. Retropropagação
        move.visits++;
        if (result > 0) move.wins += result; 
    }

    // Ordena por maior número de visitas (a jogada mais estável)
    moves.sort((a, b) => b.visits - a.visits);
    return moves[0];
}

function selectMoveUCB(moves, totalIterations) {
    let bestUCB = -Infinity;
    let selected = moves[0];

    for (let move of moves) {
        if (move.visits === 0) return move; // Explora jogadas nunca testadas

        const winRate = move.wins / move.visits;
        const exploration = Math.sqrt(2 * Math.log(totalIterations + 1) / move.visits);
        const ucb = winRate + 1.41 * exploration;

        if (ucb > bestUCB) {
            bestUCB = ucb;
            selected = move;
        }
    }
    return selected;
}

function simulateGame(initialBoard, move, size, aiPlayer) {
    // Clone minimalista do tabuleiro
    let tempBoard = initialBoard.map(row => [...row]);
    tempBoard[move.r][move.c] = aiPlayer;

    const opponent = aiPlayer === 1 ? 2 : 1;
    let currentPlayer = opponent;
    
    // Rollout: Joga 40 movimentos aleatórios rápidos para estimar o potencial da área
    for (let i = 0; i < 40; i++) {
        let r = Math.floor(Math.random() * size);
        let c = Math.floor(Math.random() * size);
        
        if (tempBoard[r][c] === 0) {
            tempBoard[r][c] = currentPlayer;
            currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
    }

    return evaluateBoardHeuristic(tempBoard, aiPlayer, size);
}

function evaluateBoardHeuristic(board, aiPlayer, size) {
    let score = 0;
    const opponent = aiPlayer === 1 ? 2 : 1;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === aiPlayer) {
                score += 1;
                // Bônus por posição estratégica (distância das bordas)
                if (r > 2 && r < size-3 && c > 2 && c < size-3) score += 0.5;
            } else if (board[r][c] === opponent) {
                score -= 1;
            }
        }
    }
    return score > 0 ? 1 : 0; // Retorna 1 se a IA está ganhando a simulação
}

function getSmartMoves(board, size) {
    let moves = [];
    let isEmpty = true;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) {
                // Heurística de proximidade: No Go, jogadas boas costumam ser perto de pedras existentes
                // Isso reduz drasticamente o tempo de processamento
                if (hasNeighbor(board, r, c, size)) {
                    moves.push({r, c});
                    isEmpty = false;
                }
            } else {
                isEmpty = false;
            }
        }
    }

    // Se o tabuleiro estiver vazio, sugere os pontos Hoshi (pontos pretos de referência)
    if (isEmpty) {
        return [{r: 3, c: 3}, {r: 3, c: 15}, {r: 15, c: 3}, {r: 15, c: 15}, {r: 9, c: 9}];
    }

    return moves;
}

function hasNeighbor(board, r, c, size) {
    // Procura por pedras em um raio de 2 casas
    for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] !== 0) {
                return true;
            }
        }
    }
    return false;
}
