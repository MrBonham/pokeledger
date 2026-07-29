const fs = require('fs');
const path = require('path');

const SETS_JSON_PATH = path.join(__dirname, 'sets.json');
const DELAY_MS = 600;
const MAX_ATTEMPTS = 10;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllSets() {
  const url = 'https://api.pokemontcg.io/v2/sets?pageSize=250&orderBy=releaseDate';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) return json.data;
    } catch (e) {
      // retry
    }
    await sleep(Math.min(DELAY_MS * attempt, 8000));
  }
  throw new Error('Failed to fetch set list after retries');
}

async function main() {
  const raw = await fetchAllSets();
  const sets = raw.map(s => ({
    id: s.id,
    name: s.name,
    series: s.series,
    total: s.total,
    printedTotal: s.printedTotal,
    releaseDate: s.releaseDate,
    code: s.ptcgoCode || ''
  }));
  fs.writeFileSync(SETS_JSON_PATH, JSON.stringify(sets));
  console.log('wrote sets.json —', sets.length, 'sets');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
