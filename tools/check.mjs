// Checks announcements.json before it goes live: run `node tools/check.mjs`.
// The games skip anything they can't read, so a mistake here would make an
// announcement silently disappear; this catches it on every commit instead.

import { readFileSync } from 'node:fs';

const FIELDS = ['id', 'date', 'until', 'about', 'title', 'text', 'links'];
const PLATFORMS = ['android', 'ios'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

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
      fail(where, '"id" must be lower-case letters, digits and dashes, e.g. "slant-launch"');
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
    if (item.about !== undefined && (typeof item.about !== 'string' || !SLUG.test(item.about))) {
      fail(where, '"about" must be a game\'s id, e.g. "slant"');
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

if (errors.length) {
  console.error(`announcements.json has ${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}
const count = data.announcements.length;
console.log(`announcements.json is fine (${count} announcement${count === 1 ? '' : 's'}).`);
