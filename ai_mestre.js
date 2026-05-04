/**
 * AI MESTRE V2 - HEURÍSTICA TÁTICA + BUSCA DE INFLUÊNCIA
 * Esta versão prioriza captura, sobrevivência e território.
 */

self.onmessage = function(e) {
    const { board, size, player } = e.data;
    const move = getMasterMove(board, size, player);
    self.postMessage(move);
};

function getMasterMove(board, size, aiPlayer) {
    let candidates = [];
    const opponent = aiPlayer === 1 ? 2 : 1;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) {
                let score = evaluatePosition(board, r, c, aiPlayer, opponent, size);
                if (score > -1000) { // Filtra suicídios óbvios
                    candidates.push({ r, c, score });
                }
            }
        }
    }

    // Ordena pelas melhores jogadas
    candidates.sort((a, b) => b.score - a.score);

    // Se não houver jogadas boas, passa a vez
    if (candidates.length === 0) return null;

    // Escolhe entre as 2 melhores para não ser 100% previsível
    const bestOnes = candidates.slice(0, 2);
    return bestOnes[Math.floor(Math.random() * bestOnes.length)];
}

function evaluatePosition(board, r, c, ai, hum, size) {
    let score = 0;

    // 1. PRIORIDADE MÁXIMA: CAPTURA (Matar peças do humano)
    if (wouldCapture(board, r, c, ai, hum, size)) {
        score += 500; 
    }

    // 2. PRIORIDADE ALTA: SALVAMENTO (Não deixar o humano te capturar)
    if (isUnderAtari(board, r, c, ai, size)) {
        score += 400;
    }
    
    // Bloquear capturas do humano
    if (wouldCapture(board, r, c, hum, ai, size)) {
        score += 350;
    }

    // 3. ESTRATÉGIA DE TERRITÓRIO (Influência)
    const neighbors = getNeighbors(r, c, size);
    neighbors.forEach(n => {
        if (board[n.r][n.c] === ai) score += 30; // Conectar pedras
        if (board[n.r][n.c] === hum) score += 15; // Pressionar oponente
    });

    // 4. POSICIONAMENTO CLÁSSICO (Cantos e Laterais no início)
    // No Go, os cantos são mais fáceis de dominar
    const distEdgeR = Math.min(r, size - 1 - r);
    const distEdgeC = Math.min(c, size - 1 - c);
    if (distEdgeR === 3 && distEdgeC === 3) score += 100; // Pontos Hoshi
    if (distEdgeR < 2 || distEdgeC < 2) score -= 20; // Evita a borda extrema (linha 1)

    // 5. EVITAR SUICÍDIO (Não jogar onde será capturado)
    if (isSuicide(board, r, c, ai, size)) {
        return -2000;
    }

    // 6. ALEATORIEDADE LEVE (Para exploração)
    score += Math.random() * 10;

    return score;
}

// --- FUNÇÕES TÁTICAS AUXILIARES ---

function getNeighbors(r, c, size) {
    const n = [];
    if (r > 0) n.push({r: r-1, c: c});
    if (r < size-1) n.push({r: r+1, c: c});
    if (c > 0) n.push({r: r, c: c-1});
    if (c < size-1) n.push({r: r, c: c+1});
    return n;
}

function wouldCapture(board, r, c, player, opponent, size) {
    let tempBoard = board.map(row => [...row]);
    tempBoard[r][c] = player;
    let captures = false;
    
    const neighbors = getNeighbors(r, c, size);
    neighbors.forEach(n => {
        if (tempBoard[n.r][n.c] === opponent) {
            if (countLiberties(tempBoard, n.r, n.c, opponent, size) === 0) {
                captures = true;
            }
        }
    });
    return captures;
}

function isUnderAtari(board, r, c, player, size) {
    // Verifica se colocar uma pedra aqui ajuda a salvar um grupo em perigo
    const neighbors = getNeighbors(r, c, size);
    for (let n of neighbors) {
        if (board[n.r][n.c] === player) {
            if (countLiberties(board, n.r, n.c, player, size) === 1) return true;
        }
    }
    return false;
}

function isSuicide(board, r, c, player, size) {
    let tempBoard = board.map(row => [...row]);
    tempBoard[r][c] = player;
    
    // Se a própria pedra não tem liberdades e não captura ninguém, é suicídio
    if (countLiberties(tempBoard, r, c, player, size) === 0) {
        const opponent = player === 1 ? 2 : 1;
        if (!wouldCapture(board, r, c, player, opponent, size)) {
            return true;
        }
    }
    return false;
}

function countLiberties(board, r, c, color, size, visited = new Set()) {
    const stack = [{r, c}];
    let liberties = 0;
    const groupVisited = new Set();
    groupVisited.add(`${r},${c}`);

    while (stack.length > 0) {
        const curr = stack.pop();
        const neighbors = getNeighbors(curr.r, curr.c, size);
        
        for (let n of neighbors) {
            const key = `${n.r},${n.c}`;
            if (board[n.r][n.c] === 0) {
                if (!visited.has(key)) {
                    liberties++;
                    visited.add(key);
                }
            } else if (board[n.r][n.c] === color && !groupVisited.has(key)) {
                groupVisited.add(key);
                stack.push(n);
            }
        }
    }
    return liberties;
}
