const fs = require('fs');
const path = require('path');

const sets = JSON.parse(fs.readFileSync(path.join(__dirname, 'sets.json'), 'utf-8'));
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf-8'));
let template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8');

const snapshotDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

template = template.replace('/*__SETS_DATA__*/[]/*__END_SETS_DATA__*/', JSON.stringify(sets));
template = template.replace('/*__CARD_DATA__*/{}/*__END_CARD_DATA__*/', JSON.stringify(cards));
template = template.replace('__SNAPSHOT_DATE__', snapshotDate);

const splitAt = template.indexOf('</style>') + '</style>'.length;
const headContent = template.slice(0, splitAt);
const bodyContent = template.slice(splitAt);

const doc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
${headContent}
<link rel="manifest" href="manifest.json" />
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<meta name="theme-color" content="#0a1128" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="PokéLedger" />
</head>
<body>
${bodyContent}
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
  }
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), doc);
console.log('wrote index.html, bytes:', fs.statSync(path.join(__dirname, 'index.html')).size);
