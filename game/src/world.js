// The kitchen itself: orders, stations, the prep tray, the plate, coins and the
// day timer. Nothing here draws anything; render.js reads this state and paints it.
// Every action a player (or the screenshot autopilot) can take is one function.
import {
  BURN_AFTER_SECONDS,
  COMBO_TIP_PER_STREAK,
  CUSTOMERS,
  DAY_SECONDS,
  GRUMBLES,
  INGREDIENTS,
  MAX_ORDERS,
  ORDER_EVERY_MIN_SECONDS,
  ORDER_EVERY_SECONDS,
  ORDER_PATIENCE_SECONDS,
  PRAISE,
  RECIPES,
  STATIONS,
} from './config.js';
import { makeRandom, pick } from './random.js';
import { sfx } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const TRAY_MAX = 6;

let nextOrderId = 1;
let nextFloatId = 1;

export function createWorld(seed) {
  const world = {
    seed,
    random: makeRandom(seed),
    screen: SCREEN_TITLE,
    timeLeft: DAY_SECONDS,
    elapsed: 0,
    orderTimer: 4,
    orders: [],
    hand: null,
    stations: { board: [], grill: [], pan: [], toaster: [] },
    tray: [],
    plate: [],
    coins: 0,
    tips: 0,
    served: 0,
    lost: 0,
    burnt: 0,
    combo: 0,
    bestCombo: 0,
    floats: [],
    banner: '',
    bannerUntil: 0,
    verdict: '',
    stars: 0,
  };
  return world;
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
  world.random = makeRandom(world.seed);
}

// --- Orders -----------------------------------------------------------------

function spawnOrder(world) {
  const recipe = pick(world.random, RECIPES);
  const customer = pick(world.random, CUSTOMERS);
  world.orders.push({
    id: nextOrderId,
    recipe,
    customer,
    patience: ORDER_PATIENCE_SECONDS,
    maxPatience: ORDER_PATIENCE_SECONDS,
  });
  nextOrderId += 1;
}

function orderGap(world) {
  // Orders hurry up as the shift wears on: the gap shrinks with elapsed time.
  const progress = 1 - world.timeLeft / DAY_SECONDS;
  return ORDER_EVERY_SECONDS - (ORDER_EVERY_SECONDS - ORDER_EVERY_MIN_SECONDS) * progress;
}

// --- Floating feedback -------------------------------------------------------

function addFloat(world, text, x, y, color) {
  world.floats.push({ id: nextFloatId, text, x, y, life: 1.4, color });
  nextFloatId += 1;
}

function showBanner(world, text, seconds) {
  world.banner = text;
  world.bannerUntil = world.elapsed + seconds;
}

// --- Player actions -----------------------------------------------------------

// Pick an ingredient up from the counter bins (or swap what is in hand).
export function pickIngredient(world, ingredientId) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (!INGREDIENTS[ingredientId]) return false;
  world.hand = ingredientId;
  sfx.pick();
  return true;
}

// Drop the held ingredient on a station, if it accepts it and has a free slot.
export function placeOnStation(world, stationId) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (world.hand === null) return false;
  const station = STATIONS[stationId];
  if (!station || !station.accepts.includes(world.hand)) return false;
  if (world.stations[stationId].length >= station.slots) return false;
  const ingredient = INGREDIENTS[world.hand];
  world.stations[stationId].push({
    ingredient: world.hand,
    progress: 0,
    done: false,
    burnt: false,
    burnTimer: 0,
  });
  world.hand = null;
  if (stationId === 'grill' || stationId === 'pan') sfx.sizzle();
  else sfx.chop();
  return true;
}

// Take a finished item off a station onto the prep tray. A burnt item goes
// straight in the bin instead, with a grumble.
export function takeFromStation(world, stationId, slotIndex) {
  if (world.screen !== SCREEN_PLAY) return false;
  const slot = world.stations[stationId]?.[slotIndex];
  if (!slot) return false;
  if (slot.burnt) {
    world.stations[stationId].splice(slotIndex, 1);
    world.burnt += 1;
    showBanner(world, pick(world.random, GRUMBLES), 2);
    sfx.burn();
    return true;
  }
  if (!slot.done) return false;
  if (world.tray.length >= TRAY_MAX) {
    showBanner(world, 'Prep tray is full! Plate something first.', 2);
    sfx.wrong();
    return false;
  }
  world.stations[stationId].splice(slotIndex, 1);
  world.tray.push(INGREDIENTS[slot.ingredient].prepped);
  sfx.pick();
  return true;
}

// Move a tray item onto the plate, stacking the dish.
export function trayToPlate(world, trayIndex) {
  if (world.screen !== SCREEN_PLAY) return false;
  const item = world.tray[trayIndex];
  if (item === undefined) return false;
  world.tray.splice(trayIndex, 1);
  world.plate.push(item);
  sfx.pick();
  return true;
}

// Drop a ready-as-is ingredient (bun, cheese) straight from the hand onto the
// prep tray. Things that need a station must go through one first.
export function handToTray(world) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (world.hand === null) return false;
  const ingredient = INGREDIENTS[world.hand];
  if (ingredient.station !== null) return false;
  if (world.tray.length >= TRAY_MAX) {
    showBanner(world, 'Prep tray is full! Plate something first.', 2);
    sfx.wrong();
    return false;
  }
  world.tray.push(ingredient.prepped);
  world.hand = null;
  sfx.pick();
  return true;
}

// Take the top item off the plate back onto the tray (changed your mind).
export function plateUndo(world) {
  if (world.screen !== SCREEN_PLAY) return false;
  const item = world.plate.pop();
  if (item === undefined) return false;
  if (world.tray.length >= TRAY_MAX) {
    world.plate.push(item);
    return false;
  }
  world.tray.push(item);
  sfx.pick();
  return true;
}

// Throw away whatever is in hand.
export function trashHand(world) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (world.hand === null) return false;
  world.hand = null;
  sfx.wrong();
  return true;
}

// Does the plate hold exactly the dish this order asks for (any stacking order)?
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const counts = new Map();
  for (const item of plate) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const need of recipe.needs) {
    const left = counts.get(need) ?? 0;
    if (left === 0) return false;
    counts.set(need, left - 1);
  }
  return true;
}

// Serve the plate to an order. A matching dish pays the price plus a tip for
// speed and for the combo streak; a wrong plate just gets a buzz.
export function serveOrder(world, orderId) {
  if (world.screen !== SCREEN_PLAY) return false;
  const index = world.orders.findIndex((order) => order.id === orderId);
  if (index === -1) return false;
  const order = world.orders[index];
  if (!plateMatches(world.plate, order.recipe)) {
    showBanner(world, `That plate is not a ${order.recipe.name}!`, 2);
    sfx.wrong();
    return false;
  }
  const speedTip = Math.round((order.patience / order.maxPatience) * 8);
  const comboTip = world.combo * COMBO_TIP_PER_STREAK;
  const earned = order.recipe.price + speedTip + comboTip;
  world.coins += earned;
  world.tips += speedTip + comboTip;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.orders.splice(index, 1);
  world.plate = [];
  addFloat(world, `+$${earned} ${pick(world.random, PRAISE)}`, 640, 300, '#ffd94d');
  showBanner(world, `${order.customer.name}: "${order.customer.quip}"`, 3);
  sfx.serve();
  return true;
}

// --- Starting and ending the day -----------------------------------------------

export function startDay(world) {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  spawnOrder(world);
  spawnOrder(world);
  showBanner(world, 'Shift started! Serve them all, Chef Pip!', 3);
}

export function endDay(world) {
  world.screen = SCREEN_OVER;
  world.banner = '';
  world.bannerUntil = 0;
  world.stars = world.served >= 12 ? 3 : world.served >= 8 ? 2 : world.served >= 4 ? 1 : 0;
  if (world.stars === 3) world.verdict = 'Three stars! The Burnt Toast Bistro is the talk of the town!';
  else if (world.stars === 2) world.verdict = 'Two stars! Solid cooking. The smoke alarm only went off twice.';
  else if (world.stars === 1) world.verdict = 'One star. The customers survived. Mostly.';
  else world.verdict = 'No stars... but the fire department sends its regards.';
}

// --- The clock ------------------------------------------------------------------

export function step(world, dt) {
  if (world.screen !== SCREEN_PLAY) return;
  world.elapsed += dt;
  world.timeLeft -= dt;

  // Floating texts drift up and fade.
  for (const float of world.floats) float.life -= dt;
  world.floats = world.floats.filter((float) => float.life > 0);

  // New orders, on a gap that shrinks as the shift goes on.
  world.orderTimer -= dt;
  if (world.orderTimer <= 0 && world.orders.length < MAX_ORDERS) {
    spawnOrder(world);
    world.orderTimer = orderGap(world);
  }

  // Patience runs out: the customer storms off and the combo dies with them.
  for (let i = world.orders.length - 1; i >= 0; i -= 1) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.lost += 1;
      world.combo = 0;
      showBanner(world, `${order.customer.name} stormed out! "${order.customer.quip}"`, 3);
      sfx.lost();
    }
  }

  // Stations cook: progress fills, then the item sits done until it burns.
  for (const stationId of Object.keys(world.stations)) {
    for (const slot of world.stations[stationId]) {
      if (slot.done) {
        slot.burnTimer += dt;
        if (slot.burnTimer >= BURN_AFTER_SECONDS) slot.burnt = true;
        continue;
      }
      slot.progress += dt / INGREDIENTS[slot.ingredient].prepSeconds;
      if (slot.progress >= 1) {
        slot.progress = 1;
        slot.done = true;
        sfx.ding();
      }
    }
  }

  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    endDay(world);
  }
}
