/**
 * IA Avançada para Baduk Go
 * Estratégia: Avaliação de Heurística de Influência + Defesa de Captura
 */

const AI_PLAYER = 2;
const HUMAN_PLAYER = 1;

function aiMove() {
    console.log("IA pensando...");
    const bestMove = getBestMove();

    if (bestMove) {
        // Aplica a jogada
        executeMove(bestMove.r, bestMove.c, AI_PLAYER);
        document.getElementById('status').innerText = "Sua vez (Pretas)";
    } else {
        document.getElementById('status').innerText = "IA Passou a vez";
        currentPlayer = 1;
    }
}

function getBestMove() {
    let candidates = [];
    
    // 1. ANALISAR O TABULEIRO
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) {
                let score = calculateMoveScore(r, c);
                candidates.push({ r, c, score });
            }
        }
    }

    // Ordena as melhores jogadas por pontuação
    candidates.sort((a, b) => b.score - a.score);

    // Adiciona um pequeno fator aleatório entre as 3 melhores para não ser previsível
    const topMoves = candidates.slice(0, 3);
    return topMoves[Math.floor(Math.random() * topMoves.length)];
}

function calculateMoveScore(r, c) {
    let score = 0;

    // Fator 1: Proximidade do centro e cantos (Estratégia de Abertura)
    // No Go, os cantos valem mais território inicialmente
    const distCenter = Math.sqrt(Math.pow(r - 9, 2) + Math.pow(c - 9, 2));
    score += (10 - distCenter) * 0.5;

    // Fator 2: Captura Imediata (MUITO IMPORTANTE)
    // Simula a jogada para ver se captura alguém
    if (checkWouldCapture(r, c, AI_PLAYER)) {
        score += 50; 
    }

    // Fator 3: Defesa (Se o humano for capturar a IA na próxima, ela bloqueia)
    if (checkWouldCapture(r, c, HUMAN_PLAYER)) {
        score += 45;
    }

    // Fator 4: Conexão e Olhos
    // A IA tenta ficar perto de suas próprias pedras para formar grupos fortes
    const neighbors = getNeighbors(r, c);
    neighbors.forEach(n => {
        if (board[n.r][n.c] === AI_PLAYER) score += 15;
        if (board[n.r][n.c] === HUMAN_PLAYER) score += 5; // Ataque/Pressão
    });

    // Fator 5: Evitar "Suicídio" (Jogar onde não tem liberdade)
    if (getLiberties(r, c, AI_PLAYER, [[r,c]]) === 0) {
        score -= 100;
    }

    return score;
}

// --- LÓGICA DE REGRAS DO GO (NECESSÁRIO PARA A IA SER FORTE) ---

function executeMove(r, c, player) {
    board[r][c] = player;
    
    // Verifica capturas do adversário
    const opponent = player === 1 ? 2 : 1;
    const neighbors = getNeighbors(r, c);
    
    neighbors.forEach(n => {
        if (board[n.r][n.c] === opponent) {
            const group = [];
            if (getLiberties(n.r, n.c, opponent, group) === 0) {
                removeGroup(group);
            }
        }
    });

    drawBoard();
    currentPlayer = player === 1 ? 2 : 1;
}

function getNeighbors(r, c) {
    const n = [];
    if (r > 0) n.push({r: r - 1, c: c});
    if (r < size - 1) n.push({r: r + 1, c: c});
    if (c > 0) n.push({r: r, c: c - 1});
    if (c < size - 1) n.push({r: r, c: c + 1});
    return n;
}

function getLiberties(r, c, player, group) {
    // Implementação básica de flood-fill para contar liberdades
    let liberties = 0;
    const stack = [{r, c}];
    const visited = new Set();
    visited.add(`${r},${c}`);
    group.push({r, c});

    while (stack.length > 0) {
        const curr = stack.pop();
        const neighbors = getNeighbors(curr.r, curr.c);
        
        neighbors.forEach(n => {
            const key = `${n.r},${n.c}`;
            if (!visited.has(key)) {
                if (board[n.r][n.c] === 0) {
                    liberties++;
                    visited.add(key);
                } else if (board[n.r][n.c] === player) {
                    visited.add(key);
                    stack.push(n);
                    group.push(n);
                }
            }
        });
    }
    return liberties;
}

function removeGroup(group) {
    group.forEach(p => {
        board[p.r][p.c] = 0;
    });
}

function checkWouldCapture(r, c, player) {
    // Simulação rápida
    let captures = false;
    const opponent = player === 1 ? 2 : 1;
    board[r][c] = player;
    
    const neighbors = getNeighbors(r, c);
    neighbors.forEach(n => {
        if (board[n.r][n.c] === opponent) {
            if (getLiberties(n.r, n.c, opponent, []) === 0) {
                captures = true;
            }
        }
    });
    
    board[r][c] = 0; // Reverte simulação
    return captures;
}

// Sobrescrevendo a função de clique do jogo original para usar a lógica de captura
canvas.onclick = function(e) {
    if (currentPlayer !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.round((x - padding) / cellSize);
    const row = Math.round((y - padding) / cellSize);

    if (row >= 0 && row < size && col >= 0 && col < size && board[row][col] === 0) {
        executeMove(row, col, 1);
        document.getElementById('status').innerText = "IA Pensando...";
        setTimeout(aiMove, 600);
    }
};