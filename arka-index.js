const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Tamaño Canvas
canvas.width = 800;
canvas.height = 550;

// Variables del juego
const paddleWidth = 120;
const paddleHeight = 10;
const paddleSpeed = 8;
const ballRadius = 8;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;

// Sonidos
const backgroundMusic = new Audio("sounds/start-sound.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const paddleSound = new Audio("sounds/sonido-paddle.mp3");
function playPaddleSound() {
  paddleSound.currentTime = 0;
  paddleSound.play();
}

const brickSound = new Audio("sounds/sonido-ladrillo.mp3");
function playBrickSound() {
  brickSound.currentTime = 0;
  brickSound.play();
}
const gameOverSound = new Audio("sounds/end-credits.mp3");
function lostGameSound() {
  gameOverSound.currentTime = 0;
  gameOverSound.play();
}

let paddleX = (canvas.width - paddleWidth) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height - 30;
let ballDX = 4;
let ballDY = -4;
let rightPressed = false;
let leftPressed = false;
let score = 0;
let level = 0;
let bricks = [];
let isGameRunning = false;

// Configuraciones de los niveles (con distintas fases)
const levels = [
  // Level 1: Rectángulo
  {
    layout: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
    brickStrength: 1,
  },
  // Level 2: Pirámide
  {
    layout: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ],
    brickStrength: 2,
  },
  // Level 3: Zigzag
  {
    layout: [
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
    ],
    brickStrength: 2,
  },
  // Level 4: Diamante
  {
    layout: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
    brickStrength: 3,
  },
];

// Event listeners
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

// Crear ladrillos en fases aleatorias
function createBricks(levelConfig) {
  const layout = levelConfig.layout;
  const rows = layout.length;
  const cols = layout[0].length;

  // Calcular el centro dinámico
  const totalWidth = cols * (brickWidth + brickPadding) - brickPadding;
  const offsetLeft = (canvas.width - totalWidth) / 2;

  bricks = [];
  for (let c = 0; c < cols; c++) {
    bricks[c] = [];
    for (let r = 0; r < rows; r++) {
      if (layout[r][c] === 1) {
        const brickX = c * (brickWidth + brickPadding) + offsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r] = {
          x: brickX,
          y: brickY,
          strength: levelConfig.brickStrength,
          status: 1,
        };
      } else {
        bricks[c][r] = { x: 0, y: 0, strength: 0, status: 0 }; // Empty space
      }
    }
  }
}

// Ladrillos (sprite o darle color sólido)
function drawBricks() {
  for (let c = 0; c < bricks.length; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      const brick = bricks[c][r];
      if (brick.status === 1) {
        ctx.fillStyle = `rgba(135, 255, 0, ${
          brick.strength / levels[level].brickStrength
        })`;
        ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
      }
    }
  }
}

// Pala (meter sprite)
function drawPaddle() {
  ctx.fillStyle = "#00ffb7";
  ctx.fillRect(
    paddleX,
    canvas.height - paddleHeight,
    paddleWidth,
    paddleHeight
  );
}

// Bola (sprite/efectos?)
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#FF13F0";
  ctx.fill();
  ctx.closePath();
}

// Deteccion de la colisión
function collisionDetection() {
  for (let c = 0; c < bricks.length; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      const brick = bricks[c][r];
      if (brick.status === 1) {
        if (
          ballX > brick.x &&
          ballX < brick.x + brickWidth &&
          ballY > brick.y &&
          ballY < brick.y + brickHeight
        ) {
          ballDY = -ballDY;
          brick.strength--;
          if (brick.strength <= 0) {
            brick.status = 0;
            score++;
            playBrickSound();
          }

          // Verificar si quedan ladrillos activos
          if (bricks.flat().filter((b) => b.status === 1).length === 0) {
            level++;
            if (level < levels.length) {
              startNextLevel();
            } else {
              alert("You Win! Game Completed!");
              document.location.reload();
            }
          }
        }
      }
    }
  }
}

// Calcula el total de ladrillos por nivel
function calculateTotalBricks() {
  return bricks.flat().filter((brick) => brick.status === 1).length;
}

// Score
function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#FFF";
  ctx.fillText(`Score: ${score}`, 8, 20);
}

// Todas las partes
function draw() {
  if (!isGameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  collisionDetection();

  // Movimiento de la bola
  ballX += ballDX;
  ballY += ballDY;

  // Colisiones de la bola con los muros y la pala
  if (
    ballX + ballDX > canvas.width - ballRadius ||
    ballX + ballDX < ballRadius
  ) {
    ballDX = -ballDX;
  }
  if (ballY + ballDY < ballRadius) {
    ballDY = -ballDY;
  } else if (ballY + ballDY > canvas.height - ballRadius) {
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      ballDY = -ballDY;
      playPaddleSound();
    } else {
      endGame();
      return;
    }
  }

  // Movimiento de la pala
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += paddleSpeed;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= paddleSpeed;
  }

  requestAnimationFrame(draw);
}

// Comenzar el siguiente nivel
function startNextLevel() {
  createBricks(levels[level]);
  paddleX = (canvas.width - paddleWidth) / 2;
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  ballDX = 4;
  ballDY = -4;
}

// Start Game
function startGame() {
  level = 0;
  score = 0;
  isGameRunning = true;
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameOverScreen").style.display = "none";
  canvas.style.display = "block";
  backgroundMusic.play();
  startNextLevel();
  draw();
}

// GameOver
function endGame() {
  isGameRunning = false;
  canvas.style.display = "none";
  document.getElementById("gameOverScreen").style.display = "flex";
  document.getElementById("finalScore").textContent = `Final Score: ${score}`;
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  gameOverSound.play();
}

// Event listeners: botones de start y play again
document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("restartButton").addEventListener("click", startGame);
