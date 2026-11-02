// Pure logic for index.html. Plain script (not a module): file:// pages can't load ES modules.

// polymarket.com event URL (any locale prefix, query, trailing market part) or bare slug -> event slug, else null.
function slugFromInput(text) {
  const s = String(text).trim().toLowerCase();
  const m = s.match(/^(?:https?:\/\/)?(?:www\.)?polymarket\.com\/(?:[^/?#]+\/)?event\/([a-z0-9-]+)(?=[/?#]|$)/);
  if (m) return m[1];
  return /^[a-z0-9-]+$/.test(s) ? s : null;
}

// Open markets with a price. Shown: Yes >= 1%. Hidden: the rest.
// ladder = markets end on different dates (e.g. "ceasefire through X?") -> sort by date, else by price.
function pickMarkets(event) {
  const open = [];
  for (const m of event.markets || []) {
    if (!m.active || m.closed || !m.outcomePrices || !m.clobTokenIds) continue;
    open.push({
      label: m.groupItemTitle || m.question,
      price: Number(JSON.parse(m.outcomePrices)[0]),
      token: JSON.parse(m.clobTokenIds)[0],
      endDate: m.endDate,
    });
  }
  const shown = open.filter((m) => m.price >= 0.01);
  const hidden = open.filter((m) => m.price < 0.01).sort((a, b) => b.price - a.price);
  const ladder = new Set(shown.map((m) => m.endDate)).size > 1;
  shown.sort(ladder ? (a, b) => a.endDate.localeCompare(b.endDate) : (a, b) => b.price - a.price);
  return { shown, hidden, ladder };
}

// history = [{t: unix seconds, p: price}]. Current minus the point nearest 24h before the last one;
// null when history doesn't reach back that far (within 3h).
function change24h(history, current) {
  if (!history.length) return null;
  const target = history[history.length - 1].t - 86400;
  let best = history[0];
  for (const h of history) if (Math.abs(h.t - target) < Math.abs(best.t - target)) best = h;
  return Math.abs(best.t - target) > 3 * 3600 ? null : current - best.p;
}

if (typeof module !== 'undefined') module.exports = { slugFromInput, pickMarkets, change24h };
