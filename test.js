// Run: node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const { slugFromInput, pickMarkets, change24h } = require('./lib.js');

const mk = (o) => ({ active: true, closed: false, endDate: '2026-10-28T03:59:00Z', ...o });
const labels = (ms) => ms.map((m) => m.label);

test('slugFromInput', () => {
  const pm = 'who-will-be-the-next-prime-minister-of-israel-after-the-next-election';
  assert.equal(slugFromInput(`https://polymarket.com/event/${pm}`), pm);
  assert.equal(slugFromInput('https://polymarket.com/event/foo-bar?tid=123'), 'foo-bar');
  assert.equal(slugFromInput('https://polymarket.com/event/foo-bar/foo-bar-market-x'), 'foo-bar');
  assert.equal(slugFromInput('polymarket.com/he/event/foo-bar#x'), 'foo-bar');
  assert.equal(slugFromInput('  Foo-Bar  '), 'foo-bar');
  assert.equal(slugFromInput('https://polymarket.com/market/some-market'), null);
  assert.equal(slugFromInput('https://www.polymarket.com/event/foo-bar'), 'foo-bar');
  assert.equal(slugFromInput('https://example.com/x'), null);
  assert.equal(slugFromInput('https://example.com/event/foo'), null);
  assert.equal(slugFromInput('https://example.com/?u=polymarket.com/event/foo'), null);
  assert.equal(slugFromInput('https://polymarket.com/event/foo.bar'), null);
  assert.equal(slugFromInput('https://polymarket.com/event/foo%20bar'), null);
  assert.equal(slugFromInput('hello world'), null);
  assert.equal(slugFromInput(''), null);
});

test('pickMarkets: candidate event shows open markets >= 1%, sorted by price', () => {
  const r = pickMarkets({ markets: [
    mk({ groupItemTitle: 'Benjamin Netanyahu', outcomePrices: '["0.335", "0.665"]', clobTokenIds: '["t1", "n1"]' }),
    mk({ groupItemTitle: 'Naftali Bennett', outcomePrices: '["0.0415", "0.9585"]', clobTokenIds: '["t2", "n2"]' }),
    mk({ groupItemTitle: 'Gadi Eizenkot', outcomePrices: '["0.3795", "0.6205"]', clobTokenIds: '["t3", "n3"]' }),
    mk({ groupItemTitle: 'Yair Lapid', outcomePrices: '["0.0035", "0.9965"]', clobTokenIds: '["t4", "n4"]' }),
    mk({ groupItemTitle: 'Person H', active: false, clobTokenIds: '["t5", "n5"]' }),
  ] });
  assert.deepEqual(labels(r.shown), ['Gadi Eizenkot', 'Benjamin Netanyahu', 'Naftali Bennett']);
  assert.deepEqual(labels(r.hidden), ['Yair Lapid']);
  assert.equal(r.ladder, false);
  assert.deepEqual(r.shown[0], { label: 'Gadi Eizenkot', price: 0.3795, token: 't3', endDate: '2026-10-28T03:59:00Z' });
});

test('pickMarkets: date ladder shows only unresolved dates, in date order', () => {
  const r = pickMarkets({ markets: [
    mk({ groupItemTitle: 'July 18', closed: true, outcomePrices: '["1", "0"]', clobTokenIds: '["a", "b"]', endDate: '2026-07-19T00:00:00Z' }),
    mk({ groupItemTitle: 'December 31', outcomePrices: '["0.365", "0.635"]', clobTokenIds: '["c", "d"]', endDate: '2026-12-31T20:29:00Z' }),
    mk({ groupItemTitle: 'November 3', outcomePrices: '["0.9735", "0.0265"]', clobTokenIds: '["e", "f"]', endDate: '2026-11-04T00:00:00Z' }),
    mk({ groupItemTitle: 'November 15', outcomePrices: '["0.685", "0.315"]', clobTokenIds: '["g", "h"]', endDate: '2026-11-16T00:00:00Z' }),
  ] });
  assert.deepEqual(labels(r.shown), ['November 3', 'November 15', 'December 31']);
  assert.deepEqual(r.hidden, []);
  assert.equal(r.ladder, true);
});

test('pickMarkets: all resolved -> nothing shown', () => {
  const r = pickMarkets({ markets: [mk({ groupItemTitle: 'X', closed: true, outcomePrices: '["1", "0"]', clobTokenIds: '["a", "b"]' })] });
  assert.deepEqual(r, { shown: [], hidden: [], ladder: false });
});

test('change24h: current minus the point nearest 24h before the last point', () => {
  const H = 3600, t0 = 1_800_000_000;
  const hourly = Array.from({ length: 49 }, (_, i) => ({ t: t0 + i * H, p: i / 100 })); // 48h, +1pt/h
  assert.ok(Math.abs(change24h(hourly, 0.5) - (0.5 - 0.24)) < 1e-9);
  // 1d view: first point sits slightly under 24h back -> still used
  const day = [{ t: t0 + 800, p: 0.3 }, { t: t0 + 86400, p: 0.4 }];
  assert.ok(Math.abs(change24h(day, 0.4) - 0.1) < 1e-9);
  // history too short to reach 24h back
  assert.equal(change24h([{ t: t0, p: 0.3 }, { t: t0 + 2 * H, p: 0.4 }], 0.4), null);
  assert.equal(change24h([], 0.4), null);
});
