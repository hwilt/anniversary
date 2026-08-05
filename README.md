# anniversary.hwilt.com

A page for our anniversary.

A static site — no build step, no dependencies. Deployed to Cloudflare Workers.

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
│   └── wordle.js  # the word game, and its puzzle list
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

## Local development

```sh
npx wrangler dev                          # serve with the Cloudflare runtime
python3 -m http.server -d public 8000     # or just serve the files
```

## Deploy

```sh
npx wrangler deploy
```
