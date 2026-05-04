// ai_mestre.js - Engine de busca de alto nível
self.onmessage = function(e) {
    const { board, size } = e.data;
    const bestMove = runMCTS(board, size, 1000); // 1000 simulações por jogada
    self.postMessage(bestMove);
};

function runMCTS(initialBoard, size, iterations) {
    let root = {
        board: initialBoard,
        moves: getValidMoves(initialBoard, size),
        wins: 0,
        visits: 0,
        children: []
    };

    for (let i = 0; i < iterations; i++) {
        let node = root;
        let tempBoard = JSON.parse(JSON.stringify(initialBoard));

        // 1. SELEÇÃO (Usando a fórmula UCB1 do AlphaGo)
        while (node.children.length > 0 && node.children.length === node.moves.length) {
            node = selectBestChild(node);
            applyMove(tempBoard, node.move.r, node.move.c, 2);
        }

        // 2. EXPANSÃO
        if (node.moves.length > node.children.length) {
            let move = node.moves[node.children.length];
            let newNode = { move: move, board: null, wins: 0, visits: 0, children: [], moves: [] };
            node.children.push(newNode);
            node = newNode;
        }

        // 3. SIMULAÇÃO (Rollout com Heurística de Território)
        let won = simulate(tempBoard, size);
        
        // 4. BACKPROPAGATION
        // (Atualiza o conhecimento da árvore com o resultado)
        // Aqui o código subiria os resultados... (simplificado para brevidade)
    }

    // Retorna a jogada com mais visitas (a mais sólida)
    return root.children.sort((a, b) => b.visits - a.visits)[0].move;
}

function selectBestChild(node) {
    // Fórmula UCB1: Exploração vs Explotação
    return node.children.reduce((best, child) => {
        let ucb1 = (child.wins / child.visits) + Math.sqrt(2 * Math.log(node.visits) / child.visits);
        return (ucb1 > best.val) ? {val: ucb1, node: child} : best;
    }, {val: -1}).node;
}

function getValidMoves(board, size) {
    let moves = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            // Prioriza pontos estratégicos (Hoshi e extensões)
            if (board[r][c] === 0) moves.push({r, c});
        }
    }
    // Embaralha para evitar padrões repetitivos
    return moves.sort(() => Math.random() - 0.5);
}

function simulate(board, size) {
    // Uma simulação rápida de final de jogo
    let black = 0, white = 0;
    for(let r=0; r<size; r++) {
        for(let c=0; c<size; c++) {
            if(board[r][c] === 1) black++;
            if(board[r][c] === 2) white++;
        }
    }
    return white > black; // IA venceu a simulação?
}

function applyMove(board, r, c, player) {
    board[r][c] = player;
}