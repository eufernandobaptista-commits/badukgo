/**
 * IA MESTRE V3 - MONTE CARLO TREE SEARCH (MCTS) COM ÁRVORE DE DECISÃO
 * Este é o motor mais próximo do AlphaGo que podemos rodar em JS puro.
 */

// Configurações de força
const SIMULATIONS = 3000; // Milhares de simulações por jogada
const EXPLORATION_PARAM = 1.41; // Equilíbrio entre explorar novo e jogar o seguro

self.onmessage = function(e) {
    const { board, size, player } = e.data;
    const bestMove = runMCTS(board, size, player);
    self.postMessage(bestMove);
};

function runMCTS(currentBoard, size, aiPlayer) {
    const root = {
        board: currentBoard,
        player: aiPlayer,
        moves: getValidMoves(currentBoard, size),
        children: new Map(),
        visits: 0,
        wins: 0
    };

    for (let i = 0; i < SIMULATIONS; i++) {
        let node = root;
        let tempBoard = JSON.parse(JSON.stringify(currentBoard));
        let path = [node];

        // 1. SELEÇÃO (Desce na árvore usando a lógica UCT)
        while (node.moves.length === 0 && node.children.size > 0) {
            node = selectBestChild(node);
            applyMoveToBoard(tempBoard, node.move.r, node.move.c, node.player);
            path.push(node);
        }

        // 2. EXPANSÃO (Cria um novo nó se ainda não explorou tudo)
        if (node.moves.length > 0) {
            const move = node.moves.pop();
            const nextPlayer = node.player === 1 ? 2 : 1;
            const newNode = {
                move: move,
                player: nextPlayer,
                moves: getValidMoves(tempBoard, size),
                children: new Map(),
                visits: 0,
                wins: 0
            };
            node.children.set(`${move.r},${move.c}`, newNode);
            applyMoveToBoard(tempBoard, move.r, move.c, nextPlayer);
            node = newNode;
            path.push(node);
        }

        // 3. SIMULAÇÃO (Rollout - joga rápido até o fim para ver quem ganha)
        const winner = simulateRandomPlayout(tempBoard, size, node.player);

        // 4. BACKPROPAGATION (Sobe os resultados para a raiz)
        for (let n of path) {
            n.visits++;
            if (winner === aiPlayer) n.wins++;
            else if (winner !== 0) n.wins -= 0.5; // Penaliza derrota
        }
    }

    // Escolhe a jogada mais visitada (a mais testada e segura)
    let bestMove = null;
    let maxVisits = -1;
    for (let child of root.children.values()) {
        if (child.visits > maxVisits) {
            maxVisits = child.visits;
            bestMove = child.move;
        }
    }
    return bestMove;
}

function selectBestChild(node) {
    let bestScore = -Infinity;
    let bestChild = null;

    for (let child of node.children.values()) {
        // Fórmula UCT (AlphaGo)
        const uctScore = (child.wins / child.visits) + 
            EXPLORATION_PARAM * Math.sqrt(Math.log(node.visits) / child.visits);
        
        if (uctScore > bestScore) {
            bestScore = ucbScore;
            bestChild = child;
        }
    }
    return bestChild || Array.from(node.children.values())[0];
}

function simulateRandomPlayout(board, size, lastPlayer) {
    let currentPlayer = lastPlayer === 1 ? 2 : 1;
    // Simula apenas 30 movimentos para manter a performance alta
    for (let i = 0; i < 30; i++) {
        const moves = getValidMoves(board, size);
        if (moves.length === 0) break;
        const move = moves[Math.floor(Math.random() * moves.length)];
        board[move.r][move.c] = currentPlayer;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
    return evaluateTerritory(board, size);
}

function evaluateTerritory(board, size) {
    let black = 0, white = 0;
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
            if(board[r][c] === 1) black++;
            else if(board[r][c] === 2) white++;
        }
    }
    if (white > black) return 2;
    if (black > white) return 1;
    return 0;
}

function getValidMoves(board, size) {
    const moves = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) {
                // Filtro de proximidade (Essencial para Go):
                // Só avalia casas perto de pedras já jogadas para economizar CPU
                if (hasNeighbor(board, r, c, size)) {
                    moves.push({r, c});
                }
            }
        }
    }
    if (moves.length === 0) return [{r: 9, c: 9}]; // Fallback para o centro
    return moves.sort(() => Math.random() - 0.5); // Embaralha para variedade
}

function hasNeighbor(board, r, c, size) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] !== 0) return true;
        }
    }
    return false;
}

function applyMoveToBoard(board, r, c, p) {
    board[r][c] = p;
}
