// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the
// real rules forward from a fresh world, driving the game's own action
// functions (pick, place, take, stack, serve) with the seeded RNG, so the
// frame is what a short game really looks like and the same seed always
// gives the same frame.
import { CUSTOMERS, ORDER_PATIENCE_SECONDS, RECIPES } from './config.js';
import {
  handToTray,
  pickIngredient,
  placeOnStation,
  startDay,
  step,
  takeFromStation,
  trayToPlate,
  serveOrder,
} from './world.js';
import { SCREEN_TITLE } from './world.js';

let orderCounter = 1000;

// Put a known order on the board: the same shape the game itself spawns,
// pinned so the staged dish always has a ticket waiting for it.
function pinOrder(world, recipeIndex, customerIndex, patience) {
  const order = {
    id: orderCounter,
    recipe: RECIPES[recipeIndex],
    customer: CUSTOMERS[customerIndex],
    patience,
    maxPatience: ORDER_PATIENCE_SECONDS,
  };
  orderCounter += 1;
  world.orders[0] = order;
  return order;
}

// Cook one Classic Blush (recipe 0) from scratch and serve it, using only the
// actions a player would take. Returns true when the dish went out.
function cookAndServeBlush(world) {
  pinOrder(world, 0, 1, ORDER_PATIENCE_SECONDS);
  pickIngredient(world, 'patty');
  placeOnStation(world, 'grill');
  pickIngredient(world, 'tomato');
  placeOnStation(world, 'board');
  step(world, 4.5);
  takeFromStation(world, 'grill', 0);
  takeFromStation(world, 'board', 0);
  pickIngredient(world, 'lettuce');
  placeOnStation(world, 'board');
  step(world, 2.5);
  takeFromStation(world, 'board', 0);
  pickIngredient(world, 'bun');
  handToTray(world);
  pickIngredient(world, 'cheese');
  handToTray(world);
  // Stack in the recipe's order: bun, patty, cheese, lettuce, tomato.
  const wanted = ['bun', 'grilled patty', 'cheese', 'chopped lettuce', 'tomato slices'];
  for (const item of wanted) {
    const index = world.tray.indexOf(item);
    if (index === -1) return false;
    trayToPlate(world, index);
  }
  return serveOrder(world, world.orders[0].id);
}

// Set `world` to the named scene and return the screen to draw over it.
export function stageShot(name, world) {
  startDay(world);
  if (name === 'start') {
    // Title screen over a kitchen that already has two tickets waiting.
    world.screen = SCREEN_TITLE;
    world.banner = '';
    world.bannerUntil = 0;
    return { screen: SCREEN_TITLE };
  }
  if (name === 'serve') {
    // A finished Classic Blush on the plate, its ticket waiting, bell glowing.
    pinOrder(world, 0, 0, 38);
    pickIngredient(world, 'patty');
    placeOnStation(world, 'grill');
    pickIngredient(world, 'tomato');
    placeOnStation(world, 'board');
    step(world, 4.5);
    takeFromStation(world, 'grill', 0);
    takeFromStation(world, 'board', 0);
    pickIngredient(world, 'lettuce');
    placeOnStation(world, 'board');
    step(world, 2.5);
    takeFromStation(world, 'board', 0);
    pickIngredient(world, 'bun');
    handToTray(world);
    pickIngredient(world, 'cheese');
    handToTray(world);
    for (const item of ['bun', 'grilled patty', 'cheese', 'chopped lettuce', 'tomato slices']) {
      trayToPlate(world, world.tray.indexOf(item));
    }
    // One more ticket, so the board looks busy, and a patty still grilling.
    pickIngredient(world, 'patty');
    placeOnStation(world, 'grill');
    step(world, 1.2);
    return { screen: 'play' };
  }
  if (name === 'end') {
    // A shift well cooked: serve eight Blushes, then let the clock run out.
    for (let i = 0; i < 8; i += 1) {
      if (!cookAndServeBlush(world)) break;
      step(world, 1);
    }
    world.timeLeft = 0.5;
    step(world, 1);
    return { screen: 'over' };
  }
  // 'play' (and anything else): mid-assembly. A patty grills, a tomato chops,
  // the tray holds the chopped bits, and the plate already stacks bun, patty
  // and cheese — one dish mid-assembly, exactly as the bounty asks to see.
  pinOrder(world, 0, 3, 34);
  pickIngredient(world, 'patty');
  placeOnStation(world, 'grill');
  pickIngredient(world, 'tomato');
  placeOnStation(world, 'board');
  pickIngredient(world, 'egg');
  placeOnStation(world, 'pan');
  step(world, 3);
  takeFromStation(world, 'board', 0);
  takeFromStation(world, 'pan', 0);
  pickIngredient(world, 'lettuce');
  placeOnStation(world, 'board');
  step(world, 2.5);
  takeFromStation(world, 'board', 0);
  takeFromStation(world, 'grill', 0);
  pickIngredient(world, 'bun');
  handToTray(world);
  pickIngredient(world, 'cheese');
  handToTray(world);
  for (const item of ['bun', 'grilled patty', 'cheese']) {
    trayToPlate(world, world.tray.indexOf(item));
  }
  pickIngredient(world, 'patty');
  placeOnStation(world, 'grill');
  step(world, 1.5);
  return { screen: 'play' };
}
