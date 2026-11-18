// Checks announcements.json, games.json and the game pages before they go
// live: run `node tools/check.mjs`. The apps skip anything they can't read,
// so a mistake in an announcement or a game would make it silently
// disappear from them, and a game page with a mistake would greet the
// friends players share it with; this catches them on every commit instead.

import { existsSync, readFileSync, readdirSync } from 'node:fs';

const FIELDS = ['id', 'date', 'until', 'about', 'title', 'text', 'links'];
const PLATFORMS = ['android', 'ios'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const root = new URL('../', import.meta.url);

/** The games with a page: each top-level folder with an index.html, named by the game's id. */
const games = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(new URL(`${entry.name}/index.html`, root)))
  .map((entry) => entry.name);

/** A real calendar date written YYYY-MM-DD. */
function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

let data;
try {
  data = JSON.parse(readFileSync(new URL('../announcements.json', import.meta.url), 'utf8'));
} catch (error) {
  console.error(`announcements.json isn't valid JSON: ${error.message}`);
  process.exit(1);
}

if (typeof data !== 'object' || data === null || !Array.isArray(data.announcements)) {
  fail('announcements.json', 'must be { "announcements": [ ... ] }');
} else {
  const ids = new Set();
  data.announcements.forEach((item, i) => {
    const where = `announcement ${i + 1}${item && typeof item.id === 'string' ? ` ("${item.id}")` : ''}`;
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return fail(where, 'must be an object');

    for (const key of Object.keys(item)) {
      if (!FIELDS.includes(key)) fail(where, `unknown field "${key}" (allowed: ${FIELDS.join(', ')})`);
    }
    if (typeof item.id !== 'string' || !SLUG.test(item.id)) {
      fail(where, '"id" must be lower-case letters, digits and dashes, e.g. "slanted-launch"');
    } else if (ids.has(item.id)) {
      fail(where, `"id" is used twice: each announcement needs its own`);
    } else {
      ids.add(item.id);
    }
    if (!isDate(item.date)) fail(where, '"date" must be a date written YYYY-MM-DD');
    if (item.until !== undefined) {
      if (!isDate(item.until)) fail(where, '"until" must be a date written YYYY-MM-DD');
      else if (isDate(item.date) && item.until < item.date) fail(where, '"until" is before "date"');
    }
    if (item.about !== undefined && !games.includes(item.about)) {
      fail(where, `"about" must be the id of a game with a page here: ${games.join(', ')}`);
    }
    if (typeof item.title !== 'string' || !item.title.trim()) fail(where, '"title" is missing');
    else if (item.title.length > 60) fail(where, `"title" is ${item.title.length} characters: keep it to 60`);
    if (typeof item.text !== 'string' || !item.text.trim()) fail(where, '"text" is missing');
    else if (item.text.length > 300) fail(where, `"text" is ${item.text.length} characters: keep it to 300`);
    if (item.links !== undefined) {
      if (typeof item.links !== 'object' || item.links === null || Array.isArray(item.links)) {
        fail(where, '"links" must be { "android": "...", "ios": "..." }');
      } else {
        for (const [platform, url] of Object.entries(item.links)) {
          if (!PLATFORMS.includes(platform)) fail(where, `unknown link "${platform}" (allowed: android, ios)`);
          else if (typeof url !== 'string' || !url.startsWith('https://')) {
            fail(where, `the ${platform} link must be a web address starting https://`);
          }
        }
      }
    }
  });
}

// games.json: the list of IDEMS Games the apps show, and each game's store
// addresses, empty until it's in that store.
const GAME_FIELDS = ['id', 'name', 'summary', 'stores'];
let listed = [];
try {
  const list = JSON.parse(readFileSync(new URL('games.json', root), 'utf8'));
  if (!Array.isArray(list?.games)) fail('games.json', 'must be { "games": [ ... ] }');
  else listed = list.games;
} catch (error) {
  fail('games.json', `isn't valid JSON: ${error.message}`);
}
const ids = new Set();
listed.forEach((game, i) => {
  const where = `games.json, game ${i + 1}${game && typeof game.id === 'string' ? ` ("${game.id}")` : ''}`;
  if (typeof game !== 'object' || game === null || Array.isArray(game)) return fail(where, 'must be an object');
  for (const key of Object.keys(game)) {
    if (!GAME_FIELDS.includes(key)) fail(where, `unknown field "${key}" (allowed: ${GAME_FIELDS.join(', ')})`);
  }
  if (typeof game.id !== 'string' || !SLUG.test(game.id)) fail(where, '"id" must be the game\'s id, e.g. "slanted"');
  else if (ids.has(game.id)) fail(where, '"id" is listed twice');
  else {
    ids.add(game.id);
    if (!games.includes(game.id)) fail(where, `there's no page for it: add a ${game.id}/ folder (see the README)`);
  }
  if (typeof game.name !== 'string' || !game.name.trim()) fail(where, '"name" is missing');
  else if (game.name.length > 30) fail(where, `"name" is ${game.name.length} characters: keep it to 30`);
  if (typeof game.summary !== 'string' || !game.summary.trim()) fail(where, '"summary" is missing');
  else if (game.summary.length > 100) fail(where, `"summary" is ${game.summary.length} characters: keep it to 100`);
  if (typeof game.stores !== 'object' || game.stores === null || Array.isArray(game.stores)) {
    fail(where, '"stores" must be { "android": "", "ios": "" }, with each address once the game is there');
  } else {
    for (const store of PLATFORMS) {
      const url = game.stores[store];
      if (typeof url !== 'string') fail(where, `"stores" needs "${store}": "" (or the game's address once it's there)`);
      else if (url && !url.startsWith('https://')) fail(where, `the ${store} store address must start https://`);
    }
    for (const store of Object.keys(game.stores)) {
      if (!PLATFORMS.includes(store)) fail(where, `unknown store "${store}" (allowed: android, ios)`);
    }
  }
});

// The game pages: each is in games.json, uses the shared page, and has an icon and a name.
for (const game of games) {
  const where = `${game}/index.html`;
  if (!SLUG.test(game)) fail(where, 'the folder must be named by the game\'s id, e.g. "slanted"');
  if (!ids.has(game) && listed.length) fail(where, `${game} isn't in games.json`);
  if (!existsSync(new URL(`${game}/icon.png`, root))) fail(where, `${game}/icon.png is missing`);
  const page = readFileSync(new URL(where, root), 'utf8');
  for (const shared of ['../game-page.js', '../game-page.css']) {
    if (!page.includes(`"${shared}"`)) fail(where, `doesn't load ${shared}`);
  }
  if (!/<title>[^<]+ · IDEMS Games<\/title>/.test(page)) fail(where, 'needs a <title> such as "Slanted · IDEMS Games"');
  if (!/<h1>[^<]+<\/h1>/.test(page)) fail(where, 'needs the game\'s name in an <h1>');
}

if (errors.length) {
  console.error(`Found ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
const count = data.announcements.length;
console.log(`announcements.json is fine (${count} announcement${count === 1 ? '' : 's'}).`);
console.log(`games.json and the game pages are fine (${games.join(', ')}).`);
