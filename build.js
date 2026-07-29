const fs = require('fs');
const path = require('path');

const sets = JSON.parse(fs.readFileSync(path.join(__dirname, 'sets.json'), 'utf-8'));
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf-8'));
let template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8');

template = template.replace('/*__SETS_DATA__*/[]/*__END_SETS_DATA__*/', JSON.stringify(sets));
template = template.replace('/*__CARD_DATA__*/{}/*__END_CARD_DATA__*/', JSON.stringify(cards));
template = template.replace('__SNAPSHOT_DATE__', 'Jul 28, 2026');

fs.writeFileSync(path.join(__dirname, 'index.html'), template);
console.log('wrote index.html, bytes:', fs.statSync(path.join(__dirname, 'index.html')).size);
