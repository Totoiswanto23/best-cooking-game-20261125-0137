// Bootstrap: size the canvas, stage a screenshot scene when ?shot= is set,
// otherwise run the real game loop (fixed-step world, painted every frame).
import { VIEW } from './config.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { createWorld, startDay, step } from './world.js';
import { stageShot } from './shots.js';
import { SCREEN_OVER, SCREEN_PLAY } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '7') || 7;

const world = createWorld(seed);
let paused = false;

attachInput(canvas, world, {
  onPause() {
    paused = !paused;
  },
});

if (shotName) {
  // Screenshot mode: stage the scene once and paint it. The world clock does
  // not advance, so timers and progress bars hold still for the camera; only
  // the pulsing glows animate with the wall clock.
  stageShot(shotName, world);
  const paint = () => {
    render(ctx, world, performance.now());
    requestAnimationFrame(paint);
  };
  requestAnimationFrame(paint);
} else {
  let last = performance.now();
  let accumulator = 0;
  const STEP = 1 / 60;
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused && world.screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        step(world, STEP);
        accumulator -= STEP;
      }
    }
    render(ctx, world, now);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Expose the world for play-testing from the console (and for the shot tool).
window.__bistro = { world, startDay };
