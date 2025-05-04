
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const grid = 30;
const cols = 10;
const rows = 20;
let board = [];
let currentPiece;
let dropInterval = 800;
let lastDrop = 0;
let score = 0;
let level = 1;
let gameRunning = false;

const pieces = ['I','J','L','O','S','T','Z'];

const background = new Image();
background.src = 'assets/hyperdrop_background.png';
let backgroundLoaded = false;
background.onload = () => { backgroundLoaded = true; };

const images = {};
pieces.forEach(p => {
  const img = new Image();
  img.src = 'assets/' + p + '.png';
  images[p] = img;
});

function createPiece(type) {
  const shapes = {
    'T': [[0,1,0],[1,1,1],[0,0,0]],
    'O': [[1,1],[1,1]],
    'L': [[0,0,1],[1,1,1],[0,0,0]],
    'J': [[1,0,0],[1,1,1],[0,0,0]],
    'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    'S': [[0,1,1],[1,1,0],[0,0,0]],
    'Z': [[1,1,0],[0,1,1],[0,0,0]]
  };
  return {
    shape: shapes[type],
    type: type,
    x: Math.floor((cols - shapes[type][0].length) / 2),
    y: -1
  };
}

function initBoard() {
  board = [];
  for (let r = 0; r < rows; r++) {
    board.push(new Array(cols).fill(null));
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c]) {
        ctx.drawImage(images[board[r][c]], c * grid, r * grid, grid, grid);
      }
    }
  }
}

function drawPiece(piece) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        ctx.drawImage(images[piece.type], (piece.x + c) * grid, (piece.y + r) * grid, grid, grid);
      }
    }
  }
}

function merge(piece) {
  piece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val) {
        const x = piece.x + dx;
        const y = piece.y + dy;
        if (y >= 0) board[y][x] = piece.type;
      }
    });
  });
}

function collide(piece) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const x = piece.x + c;
        const y = piece.y + r;
        if (y >= rows || x < 0 || x >= cols || (y >= 0 && board[y][x])) {
          return true;
        }
      }
    }
  }
  return false;
}

function rotate(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function drop() {
  currentPiece.y++;
  if (collide(currentPiece)) {
    currentPiece.y--;
    merge(currentPiece);
    clearLines();
    currentPiece = nextPiece();
    if (collide(currentPiece)) {
      gameRunning = false;
      endGame();
    }
  }
  lastDrop = Date.now();
}

function clearLines() {
  let cleared = 0;
  outer: for (let r = rows - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c]) continue outer;
    }
    board.splice(r, 1);
    board.unshift(new Array(cols).fill(null));
    cleared++;
  }
  if (cleared) {
    score += cleared * 100;
    document.getElementById("score").textContent = "Score: " + score;
  }
}

function update() {
  if (!gameRunning) return;
  const now = Date.now();
  if (now - lastDrop > dropInterval) {
    drop();
  }
  drawBoard();
  drawPiece(currentPiece);
  requestAnimationFrame(update);
}

function nextPiece() {
  const rand = pieces[Math.floor(Math.random() * pieces.length)];
  return createPiece(rand);
}

function endGame() {
  const name = localStorage.getItem("currentPlayer") || "Anonymous";
  const scores = JSON.parse(localStorage.getItem("hyperdropScores") || "[]");
  scores.push({ name, score });
  localStorage.setItem("hyperdropScores", JSON.stringify(scores));
  alert("Game Over! Score: " + score);
  window.location.reload();
}




document.addEventListener("keydown", e => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft") {
    currentPiece.x--;
    if (collide(currentPiece)) currentPiece.x++;
  } else if (e.key === "ArrowRight") {
    currentPiece.x++;
    if (collide(currentPiece)) currentPiece.x--;
  } else if (e.key === "ArrowDown") {
    currentPiece.y++;
    if (collide(currentPiece)) {
      currentPiece.y--;
      merge(currentPiece);
      clearLines();
      currentPiece = nextPiece();
      if (collide(currentPiece)) {
        gameRunning = false;
        endGame();
      }
    }
    lastDrop = Date.now();
  } else if (e.key === " ") {
    const rotated = rotate(currentPiece.shape);
    const prev = currentPiece.shape;
    currentPiece.shape = rotated;
    if (collide(currentPiece)) currentPiece.shape = prev;
  } else if (e.key === "ArrowUp") {
    // HARD DROP
    while (!collide(currentPiece)) {
      currentPiece.y++;
    }
    currentPiece.y--;
    merge(currentPiece);
    clearLines();
    currentPiece = nextPiece();
    if (collide(currentPiece)) {
      gameRunning = false;
      endGame();
    }
    lastDrop = Date.now();
  }
});




document.getElementById("startBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("playerName");
  const name = nameInput.value.trim();
  if (name === "") {
    alert("Enter your name to start!");
    return;
  }
  localStorage.setItem("currentPlayer", name);
  document.getElementById("startScreen").style.display = "none";
  startGame();
});

function startGame() {
  initBoard();
  currentPiece = nextPiece();
  gameRunning = true;
  score = 0;
  document.getElementById("score").textContent = "Score: 0";
  update();
}
