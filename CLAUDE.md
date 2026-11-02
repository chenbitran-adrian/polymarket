# CLAUDE.md

Personal Polymarket watch page. **Not related to Adrian**: no Linear ticket, no mission-control, none of the
adrian-services workflow. PR and commit summaries here need no ticket link.

## What's here
- `index.html`: the page. One card per followed event. Candidate events draw as lines; date ladders (markets
  ending on different dates) draw as bars, now vs the start of the selected range. Each card has a Yes/No switch.
- `lib.js`: the pure logic (`slugFromInput`, `pickMarkets`, `change24h`, `startPoint`). A plain `<script>`, not an
  ES module: the page is opened from disk (file://), where module scripts are blocked. Exports via
  `module.exports` for the tests.
- `test.js`: `node --test`. Covers lib.js only.
- APIs: Gamma `events?slug=` (markets, prices, `startDate`) and CLOB `prices-history` (Yes token =
  `clobTokenIds[0]`). Public, no key, CORS `*`.
- Chart.js 4.4.1 from cdnjs with an SRI hash. Changing the version means changing the hash.

## Run and check
- Open `index.html` directly. No build, no server, no dependencies.
- Playwright blocks file://, so for browser checks serve the folder:
  `python -m http.server 8765 --bind 127.0.0.1`. The favicon 404 it logs is harmless.

## Deploy
- Push to `main` and GitHub Pages rebuilds https://chenbitran-adrian.github.io/polymarket/ in about a minute
  (phone browsers may cache it for ~10 minutes). The repo is public, because the free plan has no Pages for
  private repos, so everything committed is public.

## Gotchas
- localStorage: `pm.events` (followed slugs) and `pm.no.v2` (slugs shown as No). `save()` writes both on every
  add or remove, so changing a stored default needs a new key name. That's why the key is `.v2`.
- Range-start bars use the market's `startDate`. A market that opened inside the range gets no earlier bar: its
  first price point is the 50/50 launch quote, not a trade.
- No = 1 − Yes. The No token's own history is not fetched.
- The user reads the page with a screen reader. The text list under each chart must carry every number the
  chart shows.
