// What every game's page does (the page is the game's folder, e.g. rectangles/index.html).
// It finds the game in games.json, by the folder's name, which is the game's id: a phone
// goes straight on to the game in its own store; anything else (or a phone whose store
// doesn't have the game yet) sees the page, with a button for each store that has it
// and "Coming soon" for the others.

const agent = navigator.userAgent;
const phone = /Android/i.test(agent)
  ? 'android'
  : /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)
    ? 'ios'
    : null;
const gameId = location.pathname.split('/').filter(Boolean).pop();
const NAMES = { android: ['Get it on Google Play', 'Google Play'], ios: ['Download on the App Store', 'the App Store'] };

/** The game's store addresses from games.json; none if it can't be read. */
const stores = fetch('../games.json', { cache: 'no-cache' })
  .then((response) => (response.ok ? response.json() : null))
  .then((data) => data?.games?.find((game) => game.id === gameId)?.stores ?? {})
  .catch(() => ({}));

stores.then((STORES) => {
  if (phone && STORES[phone]) return location.replace(STORES[phone]);
  const show = () => {
    const list = document.getElementById('stores');
    // On a phone, only its own store; elsewhere, both.
    const shown = phone ? [phone] : ['android', 'ios'];
    const soon = [];
    for (const store of shown) {
      if (STORES[store]) {
        const link = document.createElement('a');
        link.className = 'store';
        link.href = STORES[store];
        link.textContent = NAMES[store][0];
        list.append(link);
      } else {
        soon.push(NAMES[store][1]);
      }
    }
    if (soon.length) {
      const note = document.createElement('p');
      note.className = 'soon';
      note.textContent = `Coming soon to ${soon.join(' and ')}.`;
      list.append(note);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
});
