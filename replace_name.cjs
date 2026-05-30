const fs = require('fs');

const files = [
  './metadata.json',
  './package.json',
  './package-lock.json',
  './client/index.html',
  './client/src/App.tsx',
  './server/server.ts',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/SyncCode/g, 'OrbitCode');
  content = content.replace(/synccode/g, 'orbitcode');

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Renamed to OrbitCode successfully");
