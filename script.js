const minesweeper = document.getElementById('minesweeper');
const rows = 10;
const cols = 10;
const minesCount = 20;
let cells;
let mines;

let keySequence = '';
let lastKeyTime = 0;

document.addEventListener('keydown', (event) => {
    const currentTime = new Date().getTime();
    
    // 1秒以上経過したら入力をリセット
    if (currentTime - lastKeyTime > 1000) {
        keySequence = '';
    }
    
    lastKeyTime = currentTime;
    keySequence += event.key.toLowerCase();

    // チートコードの確認
    if (keySequence.endsWith('lol')) {
        activateCheat();
        keySequence = '';
    }
});

function activateCheat() {
    mines.forEach(mine => {
        const [row, col] = mine.split(',');
        const cell = cells[row][col];
        if (!cell.classList.contains('flag')) {
            const rect = cell.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // パーティクルエフェクトを追加（虹色）
            createParticles(x, y, getRandomRainbowColor(), 'cheat');
            cell.classList.add('flag');
        }
    });
}

function getRandomRainbowColor() {
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function initGame() {
    cells = [];
    mines = [];
    minesweeper.innerHTML = '';
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', revealCell);
            cell.addEventListener('contextmenu', flagCell);
            minesweeper.appendChild(cell);
            row.push(cell);
        }
        cells.push(row);
    }
    placeMines();
    updateNumbers();
}

function placeMines() {
    let placedMines = 0;
    while (placedMines < minesCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        if (!mines.includes(`${row},${col}`)) {
            mines.push(`${row},${col}`);
            cells[row][col].dataset.mine = 'true';
            placedMines++;
        }
    }
}

function updateNumbers() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (!cells[i][j].dataset.mine) {
                let count = 0;
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        const newRow = i + x;
                        const newCol = j + y;
                        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && cells[newRow][newCol].dataset.mine) {
                            count++;
                        }
                    }
                }
                if (count > 0) {
                    const cell = cells[i][j];
                    cell.dataset.number = count;
                    const span = document.createElement('span');
                    span.textContent = count;
                    cell.appendChild(span);
                }
            }
        }
    }
}

function createParticles(x, y, color, type) {
    const particleCount = type === 'cheat' ? 30 : (type === 'flag' ? 15 : 8);
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '1000';
    document.body.appendChild(container);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 6 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = color;
        particle.style.position = 'absolute';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        const angle = (Math.random() * 360 * Math.PI) / 180;
        const velocity = Math.random() * 3 + 2;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        container.appendChild(particle);

        let posX = x;
        let posY = y;
        let opacity = 1;
        let scale = 1;

        const animate = () => {
            if (opacity <= 0) {
                container.removeChild(particle);
                if (container.children.length === 0) {
                    document.body.removeChild(container);
                }
                return;
            }

            posX += vx;
            posY += vy + (type === 'cheat' ? Math.sin(posX * 0.1) * 0.5 : (type === 'flag' ? 0.5 : 1));
            opacity -= type === 'cheat' ? 0.01 : 0.02;
            scale -= type === 'cheat' ? 0.01 : 0.02;

            particle.style.transform = `translate(${posX - x}px, ${posY - y}px) scale(${scale})`;
            particle.style.opacity = opacity;

            requestAnimationFrame(animate);
        };

        animate();
    }
}

function revealCell(event) {
    const cell = event.target.closest('.cell');
    if (!cell || cell.classList.contains('revealed') || cell.classList.contains('flag')) return;
    
    const rect = cell.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    cell.classList.add('revealed');
    createParticles(x, y, '#8b5e34', 'block');

    if (cell.dataset.mine) {
        cell.classList.add('mine');
        revealAllMines();
        setTimeout(() => {
            alert('ゲームオーバー！');
            initGame();
        }, 100);
    } else if (cell.dataset.number) {
        // セルに数字がある場合は何もしない
    } else {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        // 周囲のセルを再帰的に開く
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const newRow = row + x;
                const newCol = col + y;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    revealCell({ target: cells[newRow][newCol] });
                }
            }
        }
    }

    // 最後に勝利判定を追加
    checkWin();
}

function flagCell(event) {
    event.preventDefault();
    const cell = event.target;
    if (cell.classList.contains('revealed')) return;

    const rect = cell.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    if (cell.classList.contains('flag')) {
        createParticles(x, y, '#ff4444', 'flag');
        cell.classList.remove('flag');
    } else {
        cell.classList.add('flag');
    }

    checkWin();
}

function revealAllMines() {
    mines.forEach(mine => {
        const [row, col] = mine.split(',');
        cells[row][col].classList.add('revealed', 'mine');
    });
}

function checkWin() {
    const unrevealedCells = document.querySelectorAll('.cell:not(.revealed):not(.flag)');
    const incorrectFlags = document.querySelectorAll('.cell.flag:not([data-mine])');
    
    if (unrevealedCells.length === 0 && incorrectFlags.length === 0) {
        celebrateWin();
    }
}

function celebrateWin() {
    // 左右から紙吹雪を作成
    createConfetti('left');
    createConfetti('right');
    
    setTimeout(() => {
        alert('おめでとう！クリアしました！');
        initGame();
    }, 1000);
}

function createConfetti(side) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // 紙吹雪の初期位置を設定
            const startX = side === 'left' ? -20 : containerWidth + 20;
            const startY = Math.random() * containerHeight;
            
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = startX + 'px';
            confetti.style.top = startY + 'px';
            
            document.body.appendChild(confetti);
            
            let posX = startX;
            let posY = startY;
            let rotation = 0;
            let opacity = 1;
            
            function animate() {
                if (opacity <= 0) {
                    document.body.removeChild(confetti);
                    return;
                }
                
                // 左右から中心に向かって移動
                posX += side === 'left' ? 5 : -5;
                posY += Math.sin(posX * 0.05) * 2;
                rotation += 5;
                opacity -= 0.003;
                
                confetti.style.transform = `translate(${posX}px, ${posY}px) rotate(${rotation}deg)`;
                confetti.style.opacity = opacity;
                
                requestAnimationFrame(animate);
            }
            
            animate();
        }, Math.random() * 2000); // 2秒間にわたってランダムに紙吹雪を生成
    }
}

initGame();
