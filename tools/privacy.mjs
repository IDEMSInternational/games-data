// Makes privacy.html, the public Privacy Policy that the app stores link to,
// from PRIVACY.md in games-common-core (the same text the apps show), so the
// two never differ. Run `node tools/privacy.mjs [path to PRIVACY.md]` after
// the policy changes; it looks for ../games-common-core/PRIVACY.md by default.

import { readFileSync, writeFileSync } from 'node:fs';

const source = process.argv[2] ?? new URL('../../games-common-core/PRIVACY.md', import.meta.url);
const markdown = readFileSync(source, 'utf8');

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Plain text, with e-mail addresses made into links. */
const inline = (text) => escape(text).replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, (email) => `<a href="mailto:${email}">${email}</a>`);

// The simple Markdown the policy uses: a "# " title, "## " headings and paragraphs.
let title = 'Privacy Policy';
const body = [];
for (const block of markdown.replace(/\r/g, '').split(/\n\s*\n/)) {
  const text = block.replace(/\s+/g, ' ').trim();
  if (!text) continue;
  if (text.startsWith('## ')) body.push(`<h2>${inline(text.slice(3))}</h2>`);
  else if (text.startsWith('# ')) title = text.slice(2);
  else body.push(`<p>${inline(text)}</p>`);
}

writeFileSync(
  new URL('../privacy.html', import.meta.url),
  `<!doctype html>
<!-- Made by tools/privacy.mjs from games-common-core/PRIVACY.md: change that, not this. -->
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · IDEMS Games</title>
<style>
  /* The apps' orange, darkened on white so links are easy to read. */
  :root { color-scheme: light dark; --brand: light-dark(#b4510f, #f37021); }
  body { margin: 0 auto; max-width: 40rem; padding: 2rem 1rem 3rem; font: 1.05rem/1.6 system-ui, sans-serif; }
  h1 { margin-bottom: 0.25rem; }
  h1 + p { color: GrayText; margin-top: 0; }
  h2 { margin-top: 2rem; font-size: 1.2rem; }
  a { color: var(--brand); }
</style>
</head>
<body>
<h1>${escape(title)}</h1>
${body.join('\n')}
</body>
</html>
`,
);
console.log(`privacy.html made from ${source instanceof URL ? 'games-common-core/PRIVACY.md' : source}.`);
