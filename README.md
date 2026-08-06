# anniversary.hwilt.com

A page for our anniversary.

A static site — no build step, nothing to install. Deployed to Cloudflare
Workers. The one third-party library, Leaflet, is vendored under
`public/vendor` and served with everything else.

## Layout

```
public/            # everything served publicly (Cloudflare assets directory)
├── index.html     # the page
├── 404.html       # not-found page
├── _headers       # Cloudflare response headers
├── css/
│   ├── base.css   # design tokens, reset, shared components
│   ├── home.css   # index.html only
│   └── error.css  # 404 page only
├── js/
│   ├── counter.js # days together, and time until the next anniversary
│   ├── map.js     # the map of places, and its coordinates
│   ├── wordle.js  # the word game, and its puzzle list
│   └── photos.js  # the album shown once the game is finished
├── images/        # web-sized photos for the album
├── vendor/        # Leaflet, vendored rather than loaded from a CDN
└── favicon.svg
wrangler.jsonc     # deploy config (not served)
```

Every page loads `base.css` first, then its own stylesheet. Anything used by
both pages belongs in `base.css`.

Only files under `public/` are published — config and README stay private.

## The date

The start date lives in `public/index.html` in two places, and nowhere else:

- the `since …` line in the hero, which is what's read
- `data-since="YYYY-MM-DD"` on `<section class="counter">`, which is what's counted

Change both together.

## The map

The `PLACES` array at the top of `public/js/map.js`:

```js
{ name: 'Your place', note: 'Philadelphia', lat: 39.95, lon: -75.17, home: true }
```

A real map, with roads. Leaflet is vendored in `public/vendor/leaflet` rather
than loaded from a CDN, so the version is pinned and the page doesn't depend on
someone else's script host. Map tiles are the one thing still fetched from
elsewhere — drawing the road network is what a tile server is for.

Tiles are standard OpenStreetMap. The pale "light" basemaps (CARTO Positron,
Voyager) look tidier in the abstract but draw almost no road detail at this
zoom, which reads as an empty rectangle — these carry parks, water and a real
road hierarchy. A CSS filter in `home.css` warms them into the cream and takes
the blue out of the water; it's scoped to the tile layer alone, so the pins and
route keep their real colours. Adjust the `sepia` and `contrast` there to taste.

Attribution is required by OpenStreetMap's terms — leave it in place. Their
tile server is fine for a page this size, but it's a volunteer-funded service
with a [usage policy](https://operations.osmfoundation.org/policies/tiles/);
if this ever got real traffic, switch to a commercial tile host.

The map sits on a postcard — lighter card stock than the page, a caption strip,
a stamp in the corner and a degree of tilt — so the section reads as an object
on the page rather than a rectangle in the middle of it. The caption is built
from the two `home` places, so it follows them if they change.

The stamp is inline SVG in `index.html`. Its perforated edge is a dashed stroke
with round caps used as a mask, so each dash punches a real hole in the rim
rather than painting one on; that's why it works sitting over the map. It's
`pointer-events: none`, so it never swallows a click meant for the map.

The distance is measured from the same coordinates, so changing one updates the
text with it. `home: true` marks the two ends it's measured between; it's a
straight line, not a driving route. Order in the array is the order the pins are
numbered, and the view frames all of them automatically.

The scroll wheel doesn't zoom the map until you click it, so scrolling past the
map doesn't get swallowed. On a touch screen a one-finger drag pans the map
rather than scrolling the page; `dragging: false` in the map options turns that
off if it gets annoying.

**Coordinates are kept to two decimals on purpose.** That's about a kilometre
of slack — enough to land on the right neighbourhood without publishing
anyone's address on a page that anyone with the link can read. To add a place,
right-click it on any map, copy the lat/lon, and round it.

One caveat: adding somewhere far away zooms everything out, and pins that are
close together in reality will start to overlap.

## The word game

Wordle, with your own words. The puzzle list is the `PUZZLES` array at the top
of `public/js/wordle.js`:

```js
{ answer: 'TUFJTkU=', hint: 'Shown as soon as this word comes up.' }
```

The hint goes up with the board, before any guessing — so write it as a clue,
not as a reveal. It stays on screen while the word is being solved.

Answers are base64 so that a glance at the page source doesn't spoil them.
That's a spoiler guard, not a secret — anyone determined can still decode it,
so don't put anything in there you'd mind being read. To encode a word, run
this in a browser console:

```js
btoa('MAINE')   // -> 'TUFJTkU='
```

Any word length works; the grid sizes itself to the answer. Guesses aren't
checked against a dictionary — any string of the right length is accepted,
which keeps names and inside jokes playable.

Progress is kept in `localStorage` under `anniversary.wordle.solved`, so
solved words stay solved across visits. "Play again" clears it.

## The album

Solving every word reveals a photo under the closing message, starting on a
random one, with arrows either side to move through the rest. Arrow keys and
swiping work too.

The list is the `PHOTOS` array at the top of `public/js/photos.js`:

```js
{ src: '/images/DSC00791.JPG', alt: 'A short description of the photo.' }
```

`wordle.js` doesn't know the album exists — it fires an `anniversary:finished`
event and `photos.js` listens for it. That's also why `photos.js` is loaded
first in `index.html`: returning to an already-finished game fires that event
during load, so the listener has to be registered before it.

### Adding photos

Files in `public/images/` are served as-is, so put web-sized copies there
rather than camera originals — a 5MB photo is a 5MB download on someone's
phone. To resize a batch:

```sh
sips -Z 1600 --setProperty formatOptions 78 original.JPG --out public/images/original.JPG
```

## Local development

```sh
npx wrangler dev                          # serve with the Cloudflare runtime
python3 -m http.server -d public 8000     # or just serve the files
```

## Deploy

```sh
npx wrangler deploy
```
