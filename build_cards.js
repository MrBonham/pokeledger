const fs = require('fs');
const path = require('path');

const SETS_PATH = path.join(__dirname, 'sets.json');
const CARDS_PATH = path.join(__dirname, 'cards.json');
const PAGE_SIZE = 250;
const DELAY_MS = 600;
const MAX_ATTEMPTS = 12;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(setId, page) {
  const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&select=id,name,number,rarity,supertype,types,tcgplayer&pageSize=${PAGE_SIZE}&page=${page}`;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (json && Array.isArray(json.data)) return json;
      // status:500 or similar error body — retry
    } catch (e) {
      // network error — retry
    }
    await sleep(Math.min(DELAY_MS * attempt, 8000));
  }
  return null;
}

const BASE_PRICE_KEYS = ['normal', 'holofoil', '1stEditionHolofoil', '1stEditionNormal', 'unlimitedHolofoil', 'unlimited'];

function pickBasePrice(prices) {
  if (!prices) return null;
  for (const k of BASE_PRICE_KEYS) {
    if (prices[k] && typeof prices[k].market === 'number') return prices[k].market;
  }
  for (const k of Object.keys(prices)) {
    if (k === 'reverseHolofoil') continue;
    if (prices[k] && typeof prices[k].market === 'number') return prices[k].market;
  }
  return null;
}

function toCompact(card) {
  const type = card.supertype === 'Pokémon' ? (card.types || []).join('/') : card.supertype;
  const prices = card.tcgplayer && card.tcgplayer.prices;
  const hasReverse = !!(prices && prices.reverseHolofoil && typeof prices.reverseHolofoil.market === 'number');
  const basePrice = pickBasePrice(prices);
  const out = { number: card.number, name: card.name, rarity: card.rarity || '', type: type || '' };
  if (basePrice != null) out.price = Math.round(basePrice * 100) / 100;
  if (hasReverse) {
    out.rev = 1;
    out.revPrice = Math.round(prices.reverseHolofoil.market * 100) / 100;
  }
  return out;
}

async function main() {
  const force = process.argv.includes('--force');
  const sets = JSON.parse(fs.readFileSync(SETS_PATH, 'utf-8'));
  const cards = (!force && fs.existsSync(CARDS_PATH)) ? JSON.parse(fs.readFileSync(CARDS_PATH, 'utf-8')) : {};

  let done = 0;
  const failed = [];
  for (const set of sets) {
    if (cards[set.id] && cards[set.id].length >= set.total) {
      done++;
      console.log(`[skip] ${set.id} already has ${cards[set.id].length} cards (${done}/${sets.length})`);
      continue;
    }
    const pages = Math.max(1, Math.ceil(set.total / PAGE_SIZE));
    let all = [];
    let ok = true;
    for (let page = 1; page <= pages; page++) {
      const json = await fetchPage(set.id, page);
      if (!json) { ok = false; break; }
      all = all.concat(json.data);
      await sleep(DELAY_MS);
    }
    done++;
    if (!ok) {
      failed.push(set.id);
      console.log(`[FAIL] ${set.id} (${set.name}) — giving up after retries (${done}/${sets.length})`);
      await sleep(2000);
      continue;
    }
    const compact = all.map(toCompact);
    compact.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0) || a.number.localeCompare(b.number));
    cards[set.id] = compact;
    console.log(`[ok] ${set.id} (${set.name}) — ${compact.length}/${set.total} cards (${done}/${sets.length})`);
    fs.writeFileSync(CARDS_PATH, JSON.stringify(cards));
  }

  console.log('DONE. Total sets with card data:', Object.keys(cards).length, '/', sets.length);
  if (failed.length) console.log('FAILED SETS (retry these):', failed.join(', '));
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
