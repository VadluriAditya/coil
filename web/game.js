// Coil -- classic grid snake. Eat food to grow; hit a wall or yourself and it's over.

const GRID = 18;
const CELL = 20;
const CANVAS_W = GRID * CELL;
const CANVAS_H = GRID * CELL;
const BASE_INTERVAL_MS = 160;
const MIN_INTERVAL_MS = 70;

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

let state;

function randCell(exclude) {
  const taken = new Set(exclude.map((c) => c.x + "," + c.y));
  let x, y;
  do {
    x = Math.floor(Math.random() * GRID);
    y = Math.floor(Math.random() * GRID);
  } while (taken.has(x + "," + y));
  return { x, y };
}

function freshState() {
  const start = [
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
  ];
  return {
    snake: start,
    dir: "right",
    pendingDir: "right",
    food: randCell(start),
    score: 0,
    over: false,
    sinceMove: 0,
    best: state ? state.best : Number(localStorage.getItem("coil.best") || 0),
  };
}

function newGame() {
  state = freshState();
  render();
}

function moveInterval() {
  return Math.max(MIN_INTERVAL_MS, BASE_INTERVAL_MS - state.score * 4);
}

function setDirection(dir) {
  if (!DIRS[dir]) return;
  if (OPPOSITE[dir] === state.dir) return; // can't reverse into self
  state.pendingDir = dir;
}

function tick(dtMs) {
  if (state.over) return;
  state.sinceMove += dtMs;
  if (state.sinceMove < moveInterval()) return;
  state.sinceMove = 0;

  state.dir = state.pendingDir;
  const d = DIRS[state.dir];
  const head = state.snake[0];
  const next = { x: head.x + d.x, y: head.y + d.y };

  if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
    state.over = true;
    saveBest();
    return;
  }
  if (state.snake.some((c) => c.x === next.x && c.y === next.y)) {
    state.over = true;
    saveBest();
    return;
  }

  state.snake.unshift(next);
  if (next.x === state.food.x && next.y === state.food.y) {
    state.score += 1;
    state.food = randCell(state.snake);
  } else {
    state.snake.pop();
  }
}

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("coil.best", String(state.best));
  }
}

function draw() {
  const canvas = document.getElementById("game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0d0e13";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = "#c98a3e";
  ctx.fillRect(state.food.x * CELL + 3, state.food.y * CELL + 3, CELL - 6, CELL - 6);

  state.snake.forEach((c, i) => {
    ctx.fillStyle = i === 0 ? "#6fcf97" : "#4a9d76";
    ctx.fillRect(c.x * CELL + 1, c.y * CELL + 1, CELL - 2, CELL - 2);
  });

  ctx.fillStyle = "#ece7e1";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Score " + state.score, 8, 20);
  ctx.textAlign = "right";
  ctx.fillText("Best " + state.best, CANVAS_W - 8, 20);

  if (state.over) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#ece7e1";
    ctx.textAlign = "center";
    ctx.font = "bold 26px -apple-system, sans-serif";
    ctx.fillText("Game Over", CANVAS_W / 2, CANVAS_H / 2 - 8);
    ctx.font = "15px -apple-system, sans-serif";
    ctx.fillText("Score " + state.score + "  ·  Tap to retry", CANVAS_W / 2, CANVAS_H / 2 + 20);
  }
}

function render() {
  draw();
}

let rafId = null;
let lastT = null;
function loop(t) {
  if (lastT == null) lastT = t;
  const dt = t - lastT;
  lastT = t;
  tick(dt);
  draw();
  rafId = requestAnimationFrame(loop);
}

function startLoop() {
  if (rafId != null) cancelAnimationFrame(rafId);
  lastT = null;
  rafId = requestAnimationFrame(loop);
}

window.GRID = GRID;
window.CELL = CELL;
window.CANVAS_W = CANVAS_W;
window.CANVAS_H = CANVAS_H;
window.newGame = newGame;
window.setDirection = setDirection;
window.tick = tick;
window.draw = draw;
window.getState = () => state;

newGame();
startLoop();

document.addEventListener("keydown", (e) => {
  if (state.over) { if (e.key === " " || e.key === "Enter") newGame(); return; }
  if (e.key === "ArrowUp") setDirection("up");
  if (e.key === "ArrowDown") setDirection("down");
  if (e.key === "ArrowLeft") setDirection("left");
  if (e.key === "ArrowRight") setDirection("right");
});
document.addEventListener("click", () => {
  if (state.over) newGame();
});
