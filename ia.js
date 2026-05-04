/**
 * IA DE GO - MONTE CARLO TREE SEARCH (MCTS)
 * Esta IA "alucina" centenas de futuros possíveis para decidir a melhor jogada.
 */

const ITERATIONS = 300; // Quantidade de simulações. Aumente para ficar mais difícil (mas mais lento).

function aiMove() {
    console.log("MCTS pensando...");
    const move = getMCTSMove();

    if (move) {
        executeMove(move.r, move.c, 2);
        document.getElementById('status').innerText = "Sua vez (Pretas)";
    } else {
        document.getElementById('status').innerText = "IA Passou";
        currentPlayer = 1;
    }
}

function getMCTSMove() {
    let possibleMoves = [];
    
    // Filtra jogadas válidas para reduzir o processamento
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0 && !isSuicide(r, c, 2)) {
                possibleMoves.push({r, c, wins: 0, trials: 0});
            }
        }
    }

    if (possibleMoves.length === 0) return null;

    // Se estiver no início do jogo, joga perto das bordas/pontos hoshi (otimização)
    if (countStones() < 5) {
        return possibleMoves.find(m => (m.r === 3 || m.r === 15) && (m.c === 3 || m.c === 15)) || possibleMoves[0];
    }

    // Loop de Simulação MCTS
    for (let i = 0; i < ITERATIONS; i++) {
        possibleMoves.forEach(move => {
            const win = simulateRandomPlayout(move.r, move.c);
            if (win) move.wins++;
            move.trials++;
        });
    }

    // Escolhe a jogada com a melhor taxa de vitória
    possibleMoves.sort((a, b) => (b.wins / b.trials) - (a.wins / a.trials));
    return possibleMoves[0];
}

/**
 * SIMULAÇÃO (ROLLOUT): Joga uma partida inteira aleatoriamente
 * a partir de uma jogada para ver se ela leva à vitória.
 */
function simulateRandomPlayout(startR, startC) {
    // Clonar o tabuleiro atual para não estragar o jogo real
    let tempBoard = board.map(row => [...row]);
    tempBoard[startR][startC] = 2; // IA joga aqui

    let simPlayer = 1; // Próximo jogador na simulação
    let movesLimit = 40; // Limite de profundidade para não travar o browser

    for (let i = 0; i < movesLimit; i++) {
        let r = Math.floor(Math.random() * size);
        let c = Math.floor(Math.random() * size);

        if (tempBoard[r][c] === 0) {
            tempBoard[r][c] = simPlayer;
            simPlayer = simPlayer === 1 ? 2 : 1;
        }
    }

    // Avalia quem ganhou na simulação (Heurística de território simples)
    return evaluateBoard(tempBoard) > 0; // Retorna true se IA (Brancas) ganhou
}

function evaluateBoard(targetBoard) {
    let whiteScore = 0;
    let blackScore = 0;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (targetBoard[r][c] === 2) whiteScore++;
            if (targetBoard[r][c] === 1) blackScore++;
        }
    }
    return whiteScore - blackScore;
}

function isSuicide(r, c, player) {
    // Verifica se a jogada resultaria em uma peça sem liberdades imediata
    // (Simplificado para evitar que a IA jogue onde será capturada)
    const neighbors = getNeighbors(r, c);
    let hasLiberty = false;
    neighbors.forEach(n => {
        if (board[n.r][n.c] === 0) hasLiberty = true;
    });
    return !hasLiberty;
}

function countStones() {
    return board.flat().filter(s => s !== 0).length;
}

// Re-implementação das funções de suporte para garantir que o MCTS funcione
function getNeighbors(r, c) {
    const n = [];
    if (r > 0) n.push({r: r - 1, c: c});
    if (r < size - 1) n.push({r: r + 1, c: c});
    if (c > 0) n.push({r: r, c: c - 1});
    if (c < size - 1) n.push({r: r, c: c + 1});
    return n;
}

// Garante que o clique do humano use a lógica de captura
canvas.onclick = function(e) {
    if (currentPlayer !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);

    if (row >= 0 && row < size && col >= 0 && col < size && board[row][col] === 0) {
        executeMove(row, col, 1);
        setTimeout(aiMove, 100);
    }
};

function executeMove(r, c, player) {
    board[r][c] = player;
    checkCaptures(r, c, player);
    drawBoard();
    currentPlayer = player === 1 ? 2 : 1;
}

function checkCaptures(r, c, player) {
    const opponent = player === 1 ? 2 : 1;
    getNeighbors(r, c).forEach(n => {
        if (board[n.r][n.c] === opponent) {
            let group = [];
            if (countLiberties(n.r, n.c, opponent, group, new Set()) === 0) {
                group.forEach(p => board[p.r][p.c] = 0);
            }
        }
    });
}

function countLiberties(r, c, player, group, visited) {
    const key = `${r},${c}`;
    if (visited.has(key)) return 0;
    visited.add(key);
    group.push({r, c});

    let liberties = 0;
    getNeighbors(r, c).forEach(n => {
        if (board[n.r][n.c] === 0) {
            liberties++;
        } else if (board[n.r][n.c] === player) {
            liberties += countLiberties(n.r, n.c, player, group, visited);
        }
    });
    return liberties;
}
