// Checks announcements.json and the game pages before they go live: run
// `node tools/check.mjs`. The games skip anything they can't read, so a
// mistake in an announcement would make it silently disappear, and a game
// page with a mistake would greet the friends players share it with; this
// catches both on every commit instead.

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

// The game pages: each uses the shared page, and has an icon, a name and
// store addresses that are either empty ("coming soon") or web addresses.
for (const game of games) {
  const where = `${game}/index.html`;
  if (!SLUG.test(game)) fail(where, 'the folder must be named by the game\'s id, e.g. "slanted"');
  if (!existsSync(new URL(`${game}/icon.png`, root))) fail(where, `${game}/icon.png is missing`);
  const page = readFileSync(new URL(where, root), 'utf8');
  for (const shared of ['../game-page.js', '../game-page.css']) {
    if (!page.includes(`"${shared}"`)) fail(where, `doesn't load ${shared}`);
  }
  if (!/<title>[^<]+ · IDEMS Games<\/title>/.test(page)) fail(where, 'needs a <title> such as "Slanted · IDEMS Games"');
  if (!/<h1>[^<]+<\/h1>/.test(page)) fail(where, 'needs the game\'s name in an <h1>');
  const stores = /const STORES = \{([^}]*)\}/.exec(page);
  if (!stores) {
    fail(where, 'needs STORES, the game\'s store addresses (see the README)');
  } else {
    for (const store of PLATFORMS) {
      const value = new RegExp(`${store}: '([^']*)'`).exec(stores[1]);
      if (!value) fail(where, `STORES needs ${store}: '' (or the game's address once it's there)`);
      else if (value[1] && !value[1].startsWith('https://')) {
        fail(where, `the ${store} store address must start https://`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Found ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
const count = data.announcements.length;
console.log(`announcements.json is fine (${count} announcement${count === 1 ? '' : 's'}).`);
console.log(`The game pages are fine (${games.join(', ')}).`);
