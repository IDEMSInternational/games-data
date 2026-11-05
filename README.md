# IDEMS Games data

Data for the IDEMS Games puzzle apps (Rectangles, Slant, ...), kept apart
from their code, published on GitHub Pages:

    https://idemsinternational.github.io/games-data/announcements.json
    https://idemsinternational.github.io/games-data/privacy.html
    https://idemsinternational.github.io/games-data/support.html
    https://idemsinternational.github.io/games-data/rectangles/

The apps download the first, the app stores link to the privacy and support
pages, and every message shared from a game ends with a link to that game's
page.
Installed apps and store listings keep these addresses, so don't rename
the files or the repository.

## Announcements

`announcements.json` holds the news shown on each game's Announcements
page (in the ☰ menu), mostly new game releases. A new announcement puts
an orange dot on the ☰ button until the player opens the page. The apps
check for news when they open, at most once a day, so a change reaches
players within about a day of being committed.

```json
{
  "announcements": [
    {
      "id": "slant-launch",
      "date": "2026-12-01",
      "until": "2027-01-31",
      "about": "slant",
      "title": "New game: Slant",
      "text": "Draw diagonal lines in a grid so that every clue is touched by the right number of lines.",
      "links": {
        "android": "https://play.google.com/store/apps/details?id=idems.games.slant",
        "ios": "https://apps.apple.com/app/id0000000000"
      }
    }
  ]
}
```

| Field | | What it's for |
|---|---|---|
| `id` | required | A name for this announcement, unique, in lower-case letters, digits and dashes. The apps remember which ids each player has seen, so never reuse one. |
| `date` | required | `YYYY-MM-DD`. The announcement shows from this day (in the player's time zone). Set it in the future to prepare one in advance. |
| `until` | optional | `YYYY-MM-DD`, the last day it shows. Without it, it shows for good. About two months suits a new game. |
| `about` | optional | The id of the game it announces (`rectangles`, `slant`, ...): that game doesn't show it, as its players already have it. |
| `title` | required | Up to 60 characters. |
| `text` | required | Up to 300 characters, plain text. |
| `links` | optional | Store pages, `android` and `ios`, each a full `https://` address. The app shows a button to the one for the player's phone. |

The newest announcements show first. To take one down early, set its
`until` to yesterday, or delete it.

The first entry is the test announcement from November 2026, kept (past its
`until`, so it no longer shows) as a template: copy it, then give the copy
a new `id` and dates.

## Privacy Policy

`privacy.html` is the public copy of the apps' Privacy Policy, for the
app stores. It is made from `PRIVACY.md` in
[games-common-core](https://github.com/IDEMSInternational/games-common-core),
the same text the apps show, so don't edit it by hand: after the policy
changes, with games-common-core cloned beside this repository, run

    node tools/privacy.mjs

and commit the new `privacy.html`.

## Game pages

Each game has a folder (`rectangles/`, named by the game's id) with an
`index.html` and its `icon.png`. Messages shared from the game link there,
not to a store, because the friend may have another kind of phone and
because the link has to work before the game is in the stores.

A phone opening the page goes straight on to the game in its own store; a
computer sees both store buttons. While a store doesn't have the game, the
page says "Coming soon" for it. **When a game goes live in a store**, put
its address into `STORES` near the top of that game's `index.html`:

```js
const STORES = {
  android: 'https://play.google.com/store/apps/details?id=idems.games.rectangles',
  ios: 'https://apps.apple.com/app/id123456789',
};
```

Nothing changes in the app, and links shared before launch start working
too. For a new game, copy a folder, rename it to the game's id, and change
the name, description and icon (the game's `assets/app/icon-only.png`).

## Support page

`support.html` is the support page for the app stores: how to contact us
and a few common questions. It is written by hand (styled like
`privacy.html`), so edit it directly; keep its answers in step with the
apps.

## Checking

Every commit is checked automatically (the "Check the data" action): a
mistake such as a missing field or a badly written date fails the check,
and GitHub shows why. To check before committing:

    node tools/check.mjs

The apps skip anything they can't read rather than break, so an
announcement with a mistake in it would just not appear: check the
action's result after each change.
