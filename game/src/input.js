// Mouse and keyboard: every click lands on a box render.js drew, so the two
// files share LAYOUT and can never drift apart.
import { INGREDIENTS, STATIONS } from './config.js';
import { LAYOUT } from './render.js';
import { sfx } from './audio.js';
import {
  handToTray,
  pickIngredient,
  placeOnStation,
  plateUndo,
  serveOrder,
  startDay,
  takeFromStation,
  trashHand,
  trayToPlate,
} from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function inside(x, y, box) {
  return x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;
}

function toCanvas(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

// Serve the first order the plate matches (Space), or the oldest order.
function serveBest(world) {
  for (const order of world.orders) {
    if (serveOrder(world, order.id)) return true;
  }
  return false;
}

function handleClick(canvas, world, event) {
  sfx.unlock();
  const { x, y } = toCanvas(canvas, event);

  if (world.screen === SCREEN_TITLE) {
    // The big START SHIFT button, centred on the title screen.
    if (x >= 490 && x <= 790 && y >= 398 && y <= 462) startDay(world);
    return;
  }
  if (world.screen === SCREEN_OVER) {
    // The COOK AGAIN button.
    if (x >= 490 && x <= 790 && y >= 446 && y <= 502) startDay(world);
    return;
  }

  // The order board: click a ticket to serve the plate to it.
  if (inside(x, y, LAYOUT.board)) {
    const index = Math.floor((y - (LAYOUT.board.y + 40)) / (LAYOUT.ticketH + 6));
    const order = world.orders[index];
    if (order && y >= LAYOUT.board.y + 40 + index * (LAYOUT.ticketH + 6)) serveOrder(world, order.id);
    return;
  }

  // Stations: with something in hand, drop it in; otherwise pick up a finished item.
  // If the held ingredient cannot go on the station, a finished item in the
  // clicked slot still comes out — a full hand never traps a cooked dish.
  for (const stationId of Object.keys(LAYOUT.stations)) {
    const box = LAYOUT.stations[stationId];
    if (!inside(x, y, box)) continue;
    const slotW = box.w / STATIONS[stationId].slots;
    const slotIndex = Math.min(STATIONS[stationId].slots - 1, Math.floor((x - box.x) / slotW));
    // Taking from a station: the clicked slot first, else any slot holding a
    // finished (or burnt) item, so a click anywhere on the station works.
    const take = (index) => takeFromStation(world, stationId, index);
    if (world.hand !== null) {
      if (!placeOnStation(world, stationId)) {
        if (!take(slotIndex)) {
          for (let i = 0; i < STATIONS[stationId].slots; i += 1) {
            if (i !== slotIndex && take(i)) break;
          }
        }
      }
    } else if (!take(slotIndex)) {
      for (let i = 0; i < STATIONS[stationId].slots; i += 1) {
        if (i !== slotIndex && take(i)) break;
      }
    }
    return;
  }

  // The prep tray: with a ready ingredient in hand, drop it on the tray;
  // otherwise click an item to stack it on the plate.
  if (inside(x, y, LAYOUT.tray)) {
    if (world.hand !== null) {
      handToTray(world);
      return;
    }
    const slotW = (LAYOUT.tray.w - 24) / 6;
    const index = Math.floor((x - (LAYOUT.tray.x + 12)) / slotW);
    if (index >= 0 && index < 6) trayToPlate(world, index);
    return;
  }

  // The plate: click it to take the top item back off.
  if (inside(x, y, LAYOUT.plate)) {
    plateUndo(world);
    return;
  }

  // The serve bell: ring it for the first order the plate matches.
  if (inside(x, y, LAYOUT.bell)) {
    if (!serveBest(world)) {
      sfx.wrong();
    }
    return;
  }

  // The bin: toss whatever is in hand.
  if (inside(x, y, LAYOUT.trash)) {
    trashHand(world);
    return;
  }

  // The ingredient bins along the bottom.
  if (inside(x, y, LAYOUT.bins)) {
    const ids = Object.keys(INGREDIENTS);
    const binW = LAYOUT.bins.w / ids.length;
    const index = Math.min(ids.length - 1, Math.floor((x - LAYOUT.bins.x) / binW));
    pickIngredient(world, ids[index]);
  }
}

function handleKey(world, event, onPause) {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === 'm') {
    const muted = sfx.toggleMute();
    return { muted };
  }
  if (world.screen === SCREEN_TITLE && (key === 'enter' || key === ' ')) {
    sfx.unlock();
    startDay(world);
    return null;
  }
  if (world.screen === SCREEN_OVER && key === 'r') {
    startDay(world);
    return null;
  }
  if (world.screen !== SCREEN_PLAY) return null;
  if (key >= '1' && key <= '7') {
    sfx.unlock();
    pickIngredient(world, Object.keys(INGREDIENTS)[Number(key) - 1]);
  } else if (key === ' ') {
    event.preventDefault();
    serveBest(world);
  } else if (key === 't') {
    trashHand(world);
  } else if (key === 'p') {
    onPause();
  } else if (key === 'r') {
    startDay(world);
  }
  return null;
}

// Wire the canvas and the keyboard up to a world. Returns a detach function.
export function attachInput(canvas, world, hooks) {
  const onClick = (event) => handleClick(canvas, world, event);
  const onKey = (event) => handleKey(world, event, hooks.onPause);
  canvas.addEventListener('pointerdown', onClick);
  window.addEventListener('keydown', onKey);
  return () => {
    canvas.removeEventListener('pointerdown', onClick);
    window.removeEventListener('keydown', onKey);
  };
}
