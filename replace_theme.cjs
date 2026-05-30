const fs = require('fs');

const files = [
  'client/src/App.tsx',
  'client/src/components/Sidebar.tsx',
  'client/src/components/Topbar.tsx',
  'client/src/components/RightPanel.tsx',
  'client/src/components/Footer.tsx',
  'client/src/components/LandingPage.tsx',
  'client/src/components/NameModal.tsx',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Dark mode AMOLED adjustments
  content = content.replace(/bg-slate-950/g, 'bg-black');
  content = content.replace(/bg-slate-900/g, 'bg-neutral-950');
  content = content.replace(/bg-slate-800/g, 'bg-neutral-900');
  content = content.replace(/bg-slate-850/g, 'bg-neutral-900');
  content = content.replace(/bg-slate-750/g, 'bg-neutral-800');
  content = content.replace(/bg-slate-700/g, 'bg-neutral-800');
  content = content.replace(/border-slate-800/g, 'border-neutral-800');
  content = content.replace(/border-slate-850/g, 'border-neutral-800');
  content = content.replace(/border-slate-700/g, 'border-neutral-700');
  
  content = content.replace(/text-slate-100/g, 'text-neutral-100');
  content = content.replace(/text-slate-200/g, 'text-neutral-200');
  content = content.replace(/text-slate-300/g, 'text-neutral-300');
  content = content.replace(/text-slate-400/g, 'text-neutral-400');
  content = content.replace(/text-slate-500/g, 'text-neutral-500');
  content = content.replace(/text-slate-600/g, 'text-neutral-600');

  // Light mode pure black accents
  content = content.replace(/text-slate-900/g, 'text-black');
  content = content.replace(/text-slate-800/g, 'text-black');
  content = content.replace(/text-slate-850/g, 'text-black');
  content = content.replace(/text-slate-705/g, 'text-black');
  content = content.replace(/text-slate-700/g, 'text-neutral-800');

  content = content.replace(/bg-slate-50/g, 'bg-neutral-50');
  content = content.replace(/bg-slate-100/g, 'bg-neutral-100');
  content = content.replace(/bg-slate-200/g, 'bg-neutral-200');
  content = content.replace(/bg-slate-300/g, 'bg-neutral-300');
  content = content.replace(/border-slate-200/g, 'border-neutral-200');
  content = content.replace(/border-slate-205/g, 'border-neutral-200');
  content = content.replace(/border-slate-250/g, 'border-neutral-300');
  content = content.replace(/border-slate-300/g, 'border-neutral-300');

  fs.writeFileSync(file, content, 'utf8');
}
console.log("Done");
