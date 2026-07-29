const fs = require('fs');
const path = require('path');
const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'sets_raw.json'), 'utf-8'));
const sets = d.data.map(s => ({
  id: s.id,
  name: s.name,
  series: s.series,
  total: s.total,
  printedTotal: s.printedTotal,
  releaseDate: s.releaseDate,
  code: s.ptcgoCode || ''
}));
fs.writeFileSync(path.join(__dirname, 'sets.json'), JSON.stringify(sets));
console.log('wrote', sets.length, 'sets, bytes:', fs.statSync(path.join(__dirname, 'sets.json')).size);
