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
│   └── counter.js # days together, and time until the next anniversary
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

## Local development

```sh
npx wrangler dev                          # serve with the Cloudflare runtime
python3 -m http.server -d public 8000     # or just serve the files
```

## Deploy

```sh
npx wrangler deploy
```
