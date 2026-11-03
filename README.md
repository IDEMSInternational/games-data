# IDEMS Games data

Data for the IDEMS Games puzzle apps (Rectangles, Slant, ...), kept apart
from their code. The apps download it from GitHub Pages:

    https://idemsinternational.github.io/games-data/announcements.json

Every game uses this address, and installed apps keep it, so don't rename
the file or the repository.

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
        "android": "https://play.google.com/store/apps/details?id=international.idems.slant",
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

## Checking

Every commit is checked automatically (the "Check the data" action): a
mistake such as a missing field or a badly written date fails the check,
and GitHub shows why. To check before committing:

    node tools/check.mjs

The apps skip anything they can't read rather than break, so an
announcement with a mistake in it would just not appear: check the
action's result after each change.
