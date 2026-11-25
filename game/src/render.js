// Everything the player sees, painted on one canvas with plain shapes: the
// chalkboard order board, the stations, the prep tray, the plate, the serve
// bell and the ingredient bins. No images, no fonts from the network.
import { DAY_SECONDS, INGREDIENTS, RECIPES, STATIONS, VIEW } from './config.js';
import { plateMatches, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, TRAY_MAX } from './world.js';

// Where everything sits on the 1280x720 canvas. input.js reads the same boxes,
// so a click lands exactly where the picture says it does.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 16, y: 80, w: 288, h: 296 },
  ticketH: 92,
  stations: {
    board: { x: 328, y: 88, w: 180, h: 150 },
    grill: { x: 524, y: 88, w: 220, h: 150 },
    pan: { x: 760, y: 88, w: 180, h: 150 },
    toaster: { x: 956, y: 88, w: 180, h: 150 },
  },
  tray: { x: 328, y: 262, w: 808, h: 92 },
  plate: { x: 328, y: 378, w: 420, h: 180 },
  bell: { x: 772, y: 378, w: 364, h: 180 },
  trash: { x: 1152, y: 378, w: 112, h: 84 },
  bins: { x: 16, y: 588, w: 1248, h: 116 },
};

const COLORS = {
  wall: '#f7e8c9',
  wallTile: '#f2dfba',
  floor: '#c98f5f',
  counter: '#8a5a33',
  counterTop: '#b5773f',
  board: '#3d3a35',
  chalk: '#fdf6e3',
  ticket: '#fff8e1',
  ticketEdge: '#e8d9a0',
  plate: '#ffffff',
  plateRim: '#dfe8f2',
  ink: '#2b2620',
  muted: '#7a6a58',
  red: '#d94f3d',
  green: '#5da244',
  gold: '#f5c542',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, fraction, fill, back) {
  ctx.fillStyle = back;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (fraction > 0) {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, Math.max(h, w * Math.min(1, fraction)), h, h / 2);
    ctx.fill();
  }
}

// --- Food, drawn as shapes ----------------------------------------------------

// Each prepped (or raw) ingredient gets a little icon, drawn the same way on
// tickets, trays, plates and bins, so the player learns the shapes fast.
export function drawIngredient(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1.5, s * 0.04);
  ctx.strokeStyle = 'rgba(43,38,32,0.35)';
  switch (id) {
    case 'bun':
    case 'toast': {
      // A golden dome (bun) or a toasted slice (toast: squarer, darker edge).
      ctx.fillStyle = id === 'bun' ? '#e8a34c' : '#d9a75f';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.08, s * 0.5, s * 0.32, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c98a3a';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.1, s * 0.5, s * 0.1, 0, 0, Math.PI);
      ctx.fill();
      if (id === 'bun') {
        ctx.fillStyle = '#fff3d6';
        for (const [dx, dy] of [[-0.22, -0.14], [0, -0.22], [0.22, -0.14], [-0.1, -0.05], [0.12, -0.06]]) {
          ctx.beginPath();
          ctx.ellipse(dx * s, dy * s, s * 0.035, s * 0.02, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'patty':
    case 'grilled patty': {
      ctx.fillStyle = id === 'grilled patty' ? '#6e3a20' : '#a85f3c';
      roundRect(ctx, -s * 0.5, -s * 0.16, s, s * 0.32, s * 0.12);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.05);
      ctx.lineTo(s * 0.3, -s * 0.05);
      ctx.moveTo(-s * 0.3, s * 0.06);
      ctx.lineTo(s * 0.3, s * 0.06);
      ctx.stroke();
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f5c542';
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, s * 0.28);
      ctx.lineTo(s * 0.5, s * 0.28);
      ctx.lineTo(s * 0.5, -s * 0.1);
      ctx.lineTo(0, -s * 0.32);
      ctx.lineTo(-s * 0.5, -s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d9a520';
      for (const [dx, dy] of [[-0.2, 0.1], [0.15, 0.02], [0.3, 0.16]]) {
        ctx.beginPath();
        ctx.arc(dx * s, dy * s, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lettuce':
    case 'chopped lettuce': {
      ctx.fillStyle = id === 'chopped lettuce' ? '#8fd35a' : '#5da244';
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.ellipse(Math.cos(angle) * s * 0.28, Math.sin(angle) * s * 0.28, s * 0.24, s * 0.18, angle, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.2);
      ctx.lineTo(0, s * 0.2);
      ctx.stroke();
      break;
    }
    case 'tomato':
    case 'tomato slices': {
      ctx.fillStyle = '#e8443a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f28b82';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8443a';
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * s * 0.15, Math.sin(angle) * s * 0.15, s * 0.07, s * 0.04, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'egg':
    case 'fried egg': {
      ctx.fillStyle = '#fdf6e3';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.48, s * 0.34, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = id === 'fried egg' ? '#f5a623' : '#f7d774';
      ctx.beginPath();
      ctx.arc(s * 0.05, 0, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'bread': {
      ctx.fillStyle = '#e8c890';
      roundRect(ctx, -s * 0.42, -s * 0.34, s * 0.84, s * 0.68, s * 0.1);
      ctx.fill();
      ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = '#999999';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawBurnt(ctx, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#2b2620';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.45, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.05);
  ctx.lineTo(-s * 0.05, s * 0.08);
  ctx.lineTo(s * 0.1, -s * 0.08);
  ctx.lineTo(s * 0.25, s * 0.05);
  ctx.stroke();
  ctx.restore();
}

// --- The kitchen ---------------------------------------------------------------

function drawTopBar(ctx, world, now) {
  const { topBar } = LAYOUT;
  ctx.fillStyle = '#2b2620';
  ctx.fillRect(topBar.x, topBar.y, topBar.w, topBar.h);
  text(ctx, 'SIZZLE & SERVE', 20, 30, 24, '#ffd94d');
  text(ctx, 'The Burnt Toast Bistro', 20, 52, 13, '#f7e8c9', 'left', '400');
  const timerW = 420;
  const timerX = 470;
  text(ctx, 'SHIFT', timerX, 26, 12, '#f7e8c9');
  const urgent = world.timeLeft <= 20;
  const pulse = urgent ? 0.65 + 0.35 * Math.sin(now / 150) : 1;
  ctx.globalAlpha = pulse;
  bar(ctx, timerX, 32, timerW, 16, world.timeLeft / DAY_SECONDS, urgent ? '#e8443a' : '#7dc242', '#4a4038');
  ctx.globalAlpha = 1;
  const mm = Math.floor(world.timeLeft / 60);
  const ss = Math.floor(world.timeLeft % 60);
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, timerX + timerW / 2, 45, 13, '#ffffff', 'center');
  text(ctx, `COINS  $${world.coins}`, 940, 30, 20, '#ffd94d');
  text(ctx, `served ${world.served}   lost ${world.lost}`, 940, 52, 13, '#f7e8c9', 'left', '400');
  if (world.combo >= 2) {
    text(ctx, `COMBO x${world.combo}`, 1150, 30, 20, '#ff9d5c');
    text(ctx, 'tips are rolling in!', 1150, 52, 12, '#f7e8c9', 'left', '400');
  }
}

function drawOrderBoard(ctx, world) {
  const { board, ticketH } = LAYOUT;
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, board.x, board.y, board.w, board.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#6b5a3e';
  ctx.lineWidth = 3;
  roundRect(ctx, board.x, board.y, board.w, board.h, 12);
  ctx.stroke();
  text(ctx, 'ORDER BOARD', board.x + 16, board.y + 28, 16, COLORS.chalk);
  text(ctx, 'click a ticket to serve it', board.x + board.w - 16, board.y + 26, 11, '#b8a888', 'right', '400');
  for (let i = 0; i < 3; i += 1) {
    const y = board.y + 40 + i * (ticketH + 6);
    const order = world.orders[i];
    ctx.fillStyle = order ? COLORS.ticket : 'rgba(253,246,227,0.12)';
    roundRect(ctx, board.x + 10, y, board.w - 20, ticketH, 8);
    ctx.fill();
    if (!order) {
      ctx.strokeStyle = 'rgba(253,246,227,0.35)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      roundRect(ctx, board.x + 10, y, board.w - 20, ticketH, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for a hungry customer...', board.x + board.w / 2, y + ticketH / 2 + 4, 12, '#b8a888', 'center', '400');
      continue;
    }
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = frac < 0.35;
    text(ctx, `#${i + 1}  ${order.recipe.name}`, board.x + 20, y + 22, 15, COLORS.ink);
    const quip = `${order.customer.name}: “${order.customer.quip}”`;
    const shortQuip = quip.length > 40 ? `${quip.slice(0, 39)}…` : quip;
    text(ctx, shortQuip, board.x + 20, y + 40, 10.5, COLORS.muted, 'left', '400');
    for (let j = 0; j < order.recipe.needs.length; j += 1) {
      drawIngredient(ctx, order.recipe.needs[j], board.x + 32 + j * 34, y + 66, 26);
    }
    bar(ctx, board.x + 20, y + ticketH - 12, board.w - 40, 6, frac, urgent ? '#e8443a' : '#7dc242', '#e8d9a0');
  }
}

function drawStation(ctx, world, stationId, now) {
  const box = LAYOUT.stations[stationId];
  const station = STATIONS[stationId];
  const slots = world.stations[stationId];
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.counter;
  ctx.lineWidth = 3;
  roundRect(ctx, box.x, box.y, box.w, box.h, 10);
  ctx.stroke();
  text(ctx, station.name.toUpperCase(), box.x + 12, box.y + 22, 12, '#5d3d1e');
  text(ctx, `${station.verb} ${station.accepts.map((id) => INGREDIENTS[id].name).join(' / ')}`, box.x + 12, box.y + 38, 10.5, '#7a5a38', 'left', '400');
  if (stationId === 'grill') {
    // Little flames under the grill grate.
    ctx.fillStyle = '#ff9d5c';
    for (let i = 0; i < 3; i += 1) {
      const fx = box.x + 50 + i * 60;
      const flame = 8 + 4 * Math.sin(now / 180 + i * 2);
      ctx.beginPath();
      ctx.moveTo(fx - 10, box.y + box.h - 18);
      ctx.quadraticCurveTo(fx, box.y + box.h - 18 - flame * 2, fx + 10, box.y + box.h - 18);
      ctx.closePath();
      ctx.fill();
    }
  }
  const slotW = box.w / station.slots;
  for (let i = 0; i < station.slots; i += 1) {
    const cx = box.x + slotW * (i + 0.5);
    const cy = box.y + 92;
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 26, slotW * 0.32, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    const slot = slots[i];
    if (!slot) {
      ctx.strokeStyle = 'rgba(93,61,30,0.4)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, slotW * 0.3, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'empty', cx, cy + 4, 11, '#7a5a38', 'center', '400');
      continue;
    }
    if (slot.burnt) {
      drawBurnt(ctx, cx, cy, 64);
      text(ctx, 'BURNT! click to bin it', cx, cy + 46, 11, '#e8443a', 'center');
    } else {
      drawIngredient(ctx, slot.ingredient, cx, cy, 64);
      if (slot.done) {
        text(ctx, 'READY! click to take', cx, cy + 46, 11, '#2f7d32', 'center');
      } else {
        bar(ctx, cx - 44, cy + 34, 88, 8, slot.progress, '#ff9d5c', 'rgba(0,0,0,0.2)');
      }
    }
  }
}

function drawTray(ctx, world) {
  const { tray } = LAYOUT;
  ctx.fillStyle = '#e8d9a0';
  roundRect(ctx, tray.x, tray.y, tray.w, tray.h, 10);
  ctx.fill();
  text(ctx, 'PREP TRAY — click an item to stack it on the plate', tray.x + 12, tray.y + 22, 12, '#5d3d1e');
  const slotW = (tray.w - 24) / TRAY_MAX;
  for (let i = 0; i < TRAY_MAX; i += 1) {
    const cx = tray.x + 12 + slotW * (i + 0.5);
    const cy = tray.y + 58;
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    roundRect(ctx, cx - slotW / 2 + 4, cy - 24, slotW - 8, 48, 8);
    ctx.fill();
    const item = world.tray[i];
    if (item) drawIngredient(ctx, item, cx, cy, 40);
  }
}

function drawPlate(ctx, world, now) {
  const { plate } = LAYOUT;
  ctx.fillStyle = '#efe3c8';
  roundRect(ctx, plate.x, plate.y, plate.w, plate.h, 10);
  ctx.fill();
  text(ctx, 'THE PLATE', plate.x + 12, plate.y + 22, 12, '#5d3d1e');
  text(ctx, 'click the plate to take the top item off', plate.x + plate.w - 12, plate.y + 22, 10.5, '#7a5a38', 'right', '400');
  const cx = plate.x + plate.w / 2;
  const cy = plate.y + 108;
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.plateRim;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 150, 52, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, 118, 38, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (world.plate.length === 0) {
    text(ctx, 'empty plate — stack a dish here', cx, cy + 4, 13, '#9a8a74', 'center', '400');
  } else {
    // Stack the dish from the bottom up, each layer a little higher.
    for (let i = 0; i < world.plate.length; i += 1) {
      drawIngredient(ctx, world.plate[i], cx, cy - 6 - i * 13, 72);
    }
    const matched = world.orders.find((order) => plateMatches(world.plate, order.recipe));
    if (matched) {
      const glow = 0.6 + 0.4 * Math.sin(now / 200);
      ctx.globalAlpha = glow;
      text(ctx, `✓ matches ${matched.recipe.name} — RING THE BELL!`, cx, plate.y + plate.h - 12, 13, '#2f7d32', 'center');
      ctx.globalAlpha = 1;
    }
  }
}

function drawBell(ctx, world, now) {
  const { bell } = LAYOUT;
  const ready = world.orders.some((order) => plateMatches(world.plate, order.recipe));
  ctx.fillStyle = ready ? '#fff3c4' : '#efe3c8';
  roundRect(ctx, bell.x, bell.y, bell.w, bell.h, 10);
  ctx.fill();
  text(ctx, 'SERVE!', bell.x + 16, bell.y + 24, 13, '#5d3d1e');
  const cx = bell.x + bell.w / 2;
  const cy = bell.y + 96;
  const ring = ready ? 1 + 0.06 * Math.sin(now / 120) : 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(ring, ring);
  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.arc(0, 0, 52, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-56, -4, 112, 10);
  ctx.beginPath();
  ctx.arc(0, 12, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a520';
  ctx.fillRect(-6, -62, 12, 14);
  ctx.beginPath();
  ctx.arc(0, -62, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  text(ctx, ready ? 'DING! A dish is ready to go!' : 'Ring the bell (or a ticket) to serve', cx, bell.y + bell.h - 14, 12, ready ? '#2f7d32' : '#7a5a38', 'center', '400');
}

function drawTrash(ctx, world) {
  const { trash } = LAYOUT;
  ctx.fillStyle = '#efe3c8';
  roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 10);
  ctx.fill();
  ctx.fillStyle = '#8a8a8a';
  roundRect(ctx, trash.x + 30, trash.y + 22, 52, 44, 6);
  ctx.fill();
  ctx.fillStyle = '#6b6b6b';
  ctx.fillRect(trash.x + 26, trash.y + 14, 60, 8);
  text(ctx, 'BIN', trash.x + trash.w / 2, trash.y + trash.h - 8, 11, '#5d3d1e', 'center');
  if (world.hand) text(ctx, 'click to toss it', trash.x + trash.w / 2, trash.y + trash.h + 14, 10, '#7a5a38', 'center', '400');
}

function drawBins(ctx, world) {
  const { bins } = LAYOUT;
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(bins.x - 16, bins.y - 8, 1280, bins.h + 8);
  ctx.fillStyle = COLORS.counterTop;
  ctx.fillRect(bins.x - 16, bins.y - 8, 1280, 10);
  text(ctx, 'INGREDIENTS — click a bin (or press 1–7) to pick it up', bins.x, bins.y + 16, 12, '#f7e8c9');
  const ids = Object.keys(INGREDIENTS);
  const binW = bins.w / ids.length;
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const ingredient = INGREDIENTS[id];
    const x = bins.x + i * binW;
    const inHand = world.hand === id;
    ctx.fillStyle = inHand ? '#ffd94d' : 'rgba(255,255,255,0.12)';
    roundRect(ctx, x + 6, bins.y + 26, binW - 12, 78, 10);
    ctx.fill();
    if (inHand) {
      ctx.strokeStyle = '#2b2620';
      ctx.lineWidth = 3;
      roundRect(ctx, x + 6, bins.y + 26, binW - 12, 78, 10);
      ctx.stroke();
    }
    drawIngredient(ctx, id, x + binW / 2, bins.y + 60, 46);
    text(ctx, ingredient.name, x + binW / 2, bins.y + 96, 11, '#f7e8c9', 'center', '400');
    ctx.fillStyle = '#2b2620';
    ctx.beginPath();
    ctx.arc(x + 22, bins.y + 40, 11, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ingredient.key, x + 22, bins.y + 44, 12, '#ffd94d', 'center');
  }
  if (world.hand) {
    text(ctx, `Holding: ${INGREDIENTS[world.hand].name} — click a station, or the bin to toss it`, 640, bins.y + 4, 12, '#ffd94d', 'center', '400');
  }
}

function drawFloats(ctx, world) {
  for (const float of world.floats) {
    ctx.globalAlpha = Math.min(1, float.life);
    text(ctx, float.text, float.x, float.y - (1.4 - float.life) * 40, 20, float.color, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, world) {
  if (world.elapsed > world.bannerUntil || !world.banner) return;
  const w = 760;
  const x = (VIEW.width - w) / 2;
  ctx.fillStyle = 'rgba(43,38,32,0.88)';
  roundRect(ctx, x, 76, w, 34, 17);
  ctx.fill();
  text(ctx, world.banner, VIEW.width / 2, 99, 14, '#fdf6e3', 'center', '400');
}

function drawTitle(ctx, world, now) {
  ctx.fillStyle = 'rgba(43,38,32,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const cx = VIEW.width / 2;
  text(ctx, 'SIZZLE & SERVE', cx, 250, 64, '#ffd94d', 'center');
  text(ctx, 'The Burnt Toast Bistro', cx, 296, 28, '#fdf6e3', 'center', '400');
  text(ctx, 'You are Chef Pip. The orders never stop. The grill never cools.', cx, 330, 16, '#f7e8c9', 'center', '400');
  text(ctx, 'Chop it. Grill it. Stack it. Ring the bell. Try not to burn the place down.', cx, 356, 16, '#f7e8c9', 'center', '400');
  const pulse = 1 + 0.04 * Math.sin(now / 250);
  ctx.save();
  ctx.translate(cx, 430);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#f5c542';
  roundRect(ctx, -150, -32, 300, 64, 32);
  ctx.fill();
  text(ctx, 'START SHIFT  ▶', 0, 8, 22, '#2b2620', 'center');
  ctx.restore();
  text(ctx, 'Mouse to click  ·  Keys 1–7 pick ingredients  ·  Space serves  ·  T toss  ·  P pause  ·  M mute', cx, 510, 14, '#f7e8c9', 'center', '400');
  text(ctx, 'A tiny bistro, a big dream, and one very nervous smoke alarm.', cx, 540, 13, '#b8a888', 'center', '400');
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(43,38,32,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const cx = VIEW.width / 2;
  text(ctx, 'SHIFT OVER!', cx, 220, 56, '#ffd94d', 'center');
  text(ctx, world.verdict, cx, 264, 18, '#fdf6e3', 'center', '400');
  for (let i = 0; i < 3; i += 1) {
    text(ctx, i < world.stars ? '★' : '☆', cx - 60 + i * 60, 330, 48, '#ffd94d', 'center');
  }
  text(ctx, `Dishes served: ${world.served}      Walk-outs: ${world.lost}      Burnt offerings: ${world.burnt}`, cx, 380, 16, '#f7e8c9', 'center', '400');
  text(ctx, `Coins earned: $${world.coins}  (tips $${world.tips})      Best combo: x${world.bestCombo}`, cx, 410, 16, '#f7e8c9', 'center', '400');
  ctx.fillStyle = '#f5c542';
  roundRect(ctx, cx - 150, 446, 300, 56, 28);
  ctx.fill();
  text(ctx, 'COOK AGAIN  ▶', cx, 482, 20, '#2b2620', 'center');
  text(ctx, 'Press R or click the button to run another shift.', cx, 530, 13, '#b8a888', 'center', '400');
}

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = COLORS.wallTile;
  for (let y = 64; y < 580; y += 46) {
    for (let x = (y / 46) % 2 === 0 ? 0 : 23; x < VIEW.width; x += 46) {
      ctx.fillRect(x, y, 44, 44);
    }
  }
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 580, VIEW.width, 140);
}

// The one entry point: paint the whole game for this moment.
export function render(ctx, world, now) {
  drawBackground(ctx);
  drawTopBar(ctx, world, now);
  drawOrderBoard(ctx, world);
  for (const stationId of Object.keys(LAYOUT.stations)) drawStation(ctx, world, stationId, now);
  drawTray(ctx, world);
  drawPlate(ctx, world, now);
  drawBell(ctx, world, now);
  drawTrash(ctx, world);
  drawBins(ctx, world);
  drawFloats(ctx, world);
  drawBanner(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world, now);
  else if (world.screen === SCREEN_OVER) drawOver(ctx, world);
}
