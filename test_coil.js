// ponytail: minimal self-check, run with `node test_coil.js`
global.window = global;
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};

require("./game.js");

// growth on eating food
window.newGame();
const s = window.getState();
const before = s.snake.length;
s.food = { x: s.snake[0].x + 1, y: s.snake[0].y }; // right in front, since dir=right
window.tick(1000); // force a move regardless of interval
console.assert(window.getState().snake.length === before + 1, "snake should grow after eating food");
console.assert(window.getState().score === 1, "score should increment after eating food");

// wall collision -> game over
window.newGame();
const s2 = window.getState();
s2.snake = [{ x: GRID - 1, y: 5 }, { x: GRID - 2, y: 5 }];
s2.dir = "right";
s2.pendingDir = "right";
s2.food = { x: 0, y: 0 };
window.tick(1000);
console.assert(window.getState().over === true, "running into the wall should end the game");

// self collision -> game over
window.newGame();
const s3 = window.getState();
s3.snake = [
  { x: 5, y: 5 },
  { x: 6, y: 5 },
  { x: 6, y: 6 },
  { x: 5, y: 6 },
  { x: 4, y: 6 },
];
s3.dir = "down";
s3.pendingDir = "down"; // moves head into (5,6), occupied by tail segment
s3.food = { x: 0, y: 0 };
window.tick(1000);
console.assert(window.getState().over === true, "running into own body should end the game");

// reversal prevention: can't flip 180 degrees
window.newGame();
console.assert(window.getState().dir === "right", "should start moving right");
window.setDirection("left");
console.assert(window.getState().pendingDir === "right", "should refuse to reverse directly into itself");
window.setDirection("up");
console.assert(window.getState().pendingDir === "up", "should accept a perpendicular turn");

console.log("Coil self-check passed");
