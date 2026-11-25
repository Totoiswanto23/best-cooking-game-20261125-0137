// Sizzle & Serve: The Burnt Toast Bistro — tuning, ingredients and recipes.
// Every number that shapes the game lives here, so balancing is one file.

// Canvas the game draws on (desktop landscape).
export const VIEW = { width: 1280, height: 720 };

// A day (one shift) lasts this long; the shift timer is the game's big clock.
export const DAY_SECONDS = 150;
// Orders arrive this often at first, faster as the day goes on.
export const ORDER_EVERY_SECONDS = 14;
export const ORDER_EVERY_MIN_SECONDS = 8;
// How long a customer waits before storming out (and taking your combo with them).
export const ORDER_PATIENCE_SECONDS = 50;
// At most this many tickets on the order board at once.
export const MAX_ORDERS = 3;
// Combo resets when an order is lost; each served dish in a row adds this much tip.
export const COMBO_TIP_PER_STREAK = 2;
// A burnt item may sit on its station this long after finishing before it chars.
export const BURN_AFTER_SECONDS = 5;

// One ingredient. `station` is where it is prepared (null = ready as-is),
// `prepSeconds` how long that takes, `prepped` what it becomes.
export const INGREDIENTS = {
  bun:     { name: 'Brioche Bun',   key: '1', color: '#e8a34c', station: null,    prepSeconds: 0,   prepped: 'bun' },
  patty:   { name: 'Beef Patty',    key: '2', color: '#8a4b2d', station: 'grill', prepSeconds: 4,   prepped: 'grilled patty' },
  cheese:  { name: 'Cheddar',       key: '3', color: '#f5c542', station: null,    prepSeconds: 0,   prepped: 'cheese' },
  lettuce: { name: 'Lettuce',       key: '4', color: '#7dc242', station: 'board', prepSeconds: 2,   prepped: 'chopped lettuce' },
  tomato:  { name: 'Tomato',        key: '5', color: '#e8443a', station: 'board', prepSeconds: 2.5, prepped: 'tomato slices' },
  egg:     { name: 'Free-Range Egg', key: '6', color: '#fdf3d0', station: 'pan',   prepSeconds: 3.5, prepped: 'fried egg' },
  bread:   { name: 'Sourdough',     key: '7', color: '#d9b380', station: 'toaster', prepSeconds: 3, prepped: 'toast' },
};

// Stations. `slots` is how many items fit; `accepts` the ingredient ids it takes.
export const STATIONS = {
  board:   { name: 'Chopping Board', slots: 1, accepts: ['lettuce', 'tomato'], verb: 'Chopping' },
  grill:   { name: 'Grill',          slots: 2, accepts: ['patty'],              verb: 'Grilling' },
  pan:     { name: 'Frying Pan',     slots: 1, accepts: ['egg'],                verb: 'Frying' },
  toaster: { name: 'Toaster',        slots: 1, accepts: ['bread'],              verb: 'Toasting' },
};

// The menu. `needs` lists prepped ingredient ids, in the order a good chef stacks them.
export const RECIPES = [
  {
    id: 'blush-burger',
    name: 'The Classic Blush',
    needs: ['bun', 'grilled patty', 'cheese', 'chopped lettuce', 'tomato slices'],
    price: 14,
    blurb: 'Our bestseller. The blush is the tomato. Obviously.',
  },
  {
    id: 'egg-sarnie',
    name: 'Egg-cellent Sarnie',
    needs: ['toast', 'fried egg', 'cheese'],
    price: 11,
    blurb: 'For customers who say "egg-cellent" out loud. Every time.',
  },
  {
    id: 'rabbit-food',
    name: 'Rabbit Food Deluxe',
    needs: ['chopped lettuce', 'tomato slices', 'cheese'],
    price: 9,
    blurb: 'A salad. In MY bistro. The chef has questions.',
  },
  {
    id: 'hangover-cure',
    name: 'The Hangover Cure',
    needs: ['toast', 'fried egg', 'grilled patty', 'cheese'],
    price: 17,
    blurb: 'Cures hangovers. Side effects: wanting another one.',
  },
];

// The regulars, with the quip that appears on their ticket.
export const CUSTOMERS = [
  { name: 'Greg',   quip: 'I once ate a shoe. This is better.' },
  { name: 'Mira',   quip: 'Extra pickles? There are no pickles. I know.' },
  { name: 'Old Ben', quip: 'Back in my day, burgers were 5 cents. And on fire.' },
  { name: 'Zoe',    quip: 'I am vegan except for this. And cheese. And eggs.' },
  { name: 'Chef Rat', quip: 'I am a rat. I know good food. Trust me.' },
  { name: 'Dana',   quip: 'Make it snappy, my goldfish is waiting.' },
  { name: 'Pip Jr.', quip: 'Dad says I can have anything. Dad is wrong.' },
  { name: 'Auntie Flo', quip: 'Needs more salt. Everything needs more salt.' },
];

// Little floating messages the game shows when things go right (or wrong).
export const PRAISE = [
  'Sizzling!',
  'Chef’s kiss!',
  'Plated like a pro!',
  'The crowd goes mild!',
  'Michelin who?',
];
export const GRUMBLES = [
  'Charcoal, anyone?',
  'That one fought back.',
  'The smoke alarm approves.',
  'A bold new flavour: burnt.',
];
